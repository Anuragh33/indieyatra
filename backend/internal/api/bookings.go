package api

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/anuragh/indiebus/backend/internal/auth"
	"github.com/anuragh/indiebus/backend/internal/db"
	"github.com/anuragh/indiebus/backend/internal/models"
	"github.com/anuragh/indiebus/backend/internal/services"
	"github.com/anuragh/indiebus/backend/internal/websocket"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type CreateBookingRequest struct {
	ScheduleID      string  `json:"schedule_id" validate:"required"`
	SeatIDs         []string `json:"seat_ids" validate:"required"`
	Passengers      []PassengerInput `json:"passengers" validate:"required"`
	ContactEmail    string  `json:"contact_email" validate:"required,email"`
	ContactPhone    string  `json:"contact_phone" validate:"required"`
	WhatsAppEnabled bool    `json:"whatsapp_enabled"`
}

type PassengerInput struct {
	FullName string `json:"full_name"`
	Age      int    `json:"age"`
	Gender   string `json:"gender"`
	IDType   string `json:"id_type"`
	IDNumber string `json:"id_number"`
	SeatID   string `json:"seat_id"`
}

func (h *Handlers) CreateBooking(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	var req CreateBookingRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	if len(req.SeatIDs) == 0 || len(req.Passengers) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "seats and passengers required"})
	}
	if len(req.Passengers) != len(req.SeatIDs) {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "passenger count must match seat count"})
	}

	userUUID, _ := uuid.Parse(uid)
	scheduleUUID, _ := uuid.Parse(req.ScheduleID)

	// Verify all seats are locked by this user before opening the transaction
	for _, sid := range req.SeatIDs {
		owner, locked, _ := db.IsSeatLocked(c.Request().Context(), req.ScheduleID, sid)
		if !locked || owner != uid {
			return c.JSON(http.StatusConflict, map[string]string{"error": "seat " + sid + " is not held by you"})
		}
	}

	// Run the booking creation, seat updates, and passenger inserts inside a single
	// transaction so a failure at any point rolls everything back. Prevents orphan
	// bookings (booking exists but seats weren't marked booked) and inconsistent
	// seats_available counters.
	var booking models.Booking
	err := db.DB.Transaction(func(tx *gorm.DB) error {
		var schedule models.Schedule
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			First(&schedule, "id = ?", scheduleUUID).Error; err != nil {
			return err
		}
		if schedule.SeatsAvailable < len(req.SeatIDs) {
			return echo.NewHTTPError(http.StatusConflict, map[string]string{
				"error": "not enough seats available",
			})
		}
		if !schedule.IsActive {
			return echo.NewHTTPError(http.StatusConflict, map[string]string{
				"error": "schedule is no longer active",
			})
		}

		// Verify all seats exist, are still available, and belong to this schedule
		var existingSeats []models.Seat
		seatUUIDs := make([]uuid.UUID, 0, len(req.SeatIDs))
		for _, sid := range req.SeatIDs {
			parsed, err := uuid.Parse(sid)
			if err != nil {
				return echo.NewHTTPError(http.StatusBadRequest, map[string]string{
					"error": "invalid seat id: " + sid,
				})
			}
			seatUUIDs = append(seatUUIDs, parsed)
		}
		if err := tx.Where("id IN ? AND schedule_id = ?", seatUUIDs, scheduleUUID).
			Find(&existingSeats).Error; err != nil {
			return err
		}
		if len(existingSeats) != len(seatUUIDs) {
			return echo.NewHTTPError(http.StatusBadRequest, map[string]string{
				"error": "one or more seats do not belong to this schedule",
			})
		}
		for _, s := range existingSeats {
			if s.Status == "booked" {
				return echo.NewHTTPError(http.StatusConflict, map[string]string{
					"error": "seat " + s.SeatNumber + " is already booked",
				})
			}
		}

		// Compute totals
		baseTotal := schedule.BaseFare * float64(len(req.SeatIDs))
		tax := baseTotal * 0.05
		total := baseTotal + tax

		bookingRef := "IB-" + uuid.NewString()[:8]
		booking = models.Booking{
			UserID:          userUUID,
			ScheduleID:      scheduleUUID,
			BookingRef:      bookingRef,
			Status:          "pending",
			BaseAmount:      baseTotal,
			TaxAmount:       tax,
			TotalAmount:     total,
			Currency:        "INR",
			ContactEmail:    req.ContactEmail,
			ContactPhone:    req.ContactPhone,
			WhatsAppEnabled: req.WhatsAppEnabled,
		}
		if err := tx.Create(&booking).Error; err != nil {
			return err
		}

		// Add passengers + mark their seats booked, all inside the transaction
		for i, p := range req.Passengers {
			passenger := models.Passenger{
				BookingID: booking.ID,
				FullName:  p.FullName,
				Age:       p.Age,
				Gender:    p.Gender,
				IDType:    p.IDType,
				IDNumber:  p.IDNumber,
				SeatID:    &seatUUIDs[i],
				SeatNumber: existingSeats[i].SeatNumber,
			}
			if err := tx.Create(&passenger).Error; err != nil {
				return err
			}
			if err := tx.Model(&models.Seat{}).
				Where("id = ?", seatUUIDs[i]).
				Updates(map[string]interface{}{"status": "booked"}).Error; err != nil {
				return err
			}
		}

		// Atomic decrement of seats_available on the schedule
		if err := tx.Model(&models.Schedule{}).
			Where("id = ?", scheduleUUID).
			UpdateColumn("seats_available", gorm.Expr("seats_available - ?", len(req.SeatIDs))).Error; err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		if he, ok := err.(*echo.HTTPError); ok {
			return c.JSON(he.Code, he.Message)
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "booking create failed: " + err.Error()})
	}

	// Release Redis locks (after successful commit, fire-and-forget)
	for _, sid := range req.SeatIDs {
		db.ReleaseSeat(context.Background(), req.ScheduleID, sid)
	}

	// Notify WebSocket clients (after commit)
	for _, sid := range req.SeatIDs {
		websocket.GlobalHub.EmitSeatLocked(req.ScheduleID, req.ScheduleID, sid, uid)
	}

	return c.JSON(http.StatusCreated, booking)
}

func (h *Handlers) GetBooking(c echo.Context) error {
	id := c.Param("id")
	var booking models.Booking
	if err := db.DB.Preload("Schedule.Route.FromCity").
		Preload("Schedule.Route.ToCity").
		Preload("Schedule.Operator").
		Preload("Schedule.Bus").
		Preload("Passengers").
		Preload("Payment").
		Where("id = ?", id).First(&booking).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "booking not found"})
	}
	return c.JSON(http.StatusOK, booking)
}

func (h *Handlers) DownloadTicket(c echo.Context) error {
	uid := auth.GetUserID(c)
	id := c.Param("id")
	var booking models.Booking
	q := db.DB.Preload("Schedule.Route.FromCity").
		Preload("Schedule.Route.ToCity").
		Preload("Schedule.Operator").
		Preload("Schedule.Bus").
		Preload("Passengers")
	if uid != "" {
		q = q.Where("id = ? AND user_id = ?", id, uid)
	} else {
		q = q.Where("id = ?", id)
	}
	if err := q.First(&booking).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "booking not found"})
	}
	html := buildETicketHTML(booking)
	return c.HTML(http.StatusOK, html)
}

func (h *Handlers) ListUserBookings(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var bookings []models.Booking
	db.DB.Preload("Schedule.Route.FromCity").
		Preload("Schedule.Route.ToCity").
		Preload("Schedule.Operator").
		Where("user_id = ?", uid).
		Order("created_at DESC").
		Find(&bookings)
	return c.JSON(http.StatusOK, bookings)
}

type InitPaymentRequest struct {
	BookingID string  `json:"booking_id" validate:"required"`
	Method    string  `json:"method"` // upi/card/netbanking/wallet
	Amount    float64 `json:"amount"`
}

func (h *Handlers) InitPayment(c echo.Context) error {
	var req InitPaymentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}

	var booking models.Booking
	if err := db.DB.Where("id = ?", req.BookingID).First(&booking).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "booking not found"})
	}

	orderID, err := h.PaymentSvc.CreateOrder(c.Request().Context(), services.CreateOrderInput{
		Amount:   booking.TotalAmount,
		Currency: booking.Currency,
		Receipt:  booking.BookingRef,
		Notes:    map[string]interface{}{"booking_id": booking.ID.String(), "method": req.Method},
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	payment := models.Payment{
		BookingID:       booking.ID,
		RazorpayOrderID: orderID,
		Amount:          booking.TotalAmount,
		Currency:        booking.Currency,
		Method:          req.Method,
		Status:          "initiated",
	}
	db.DB.Create(&payment)

	db.DB.Model(&booking).Update("payment_id", payment.ID)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"order_id":  orderID,
		"amount":    booking.TotalAmount,
		"currency":  booking.Currency,
		"payment_id": payment.ID,
		"booking_id": booking.ID,
	})
}

type VerifyPaymentRequest struct {
	OrderID   string `json:"razorpay_order_id" validate:"required"`
	PaymentID string `json:"razorpay_payment_id" validate:"required"`
	Signature string `json:"razorpay_signature" validate:"required"`
}

func (h *Handlers) VerifyPayment(c echo.Context) error {
	var req VerifyPaymentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}

	if !h.PaymentSvc.VerifySignature(services.VerifyInput{
		OrderID:   req.OrderID,
		PaymentID: req.PaymentID,
		Signature: req.Signature,
	}) {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid signature"})
	}

	var payment models.Payment
	if err := db.DB.Where("razorpay_order_id = ?", req.OrderID).First(&payment).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "payment not found"})
	}
	now := time.Now()
	payment.RazorpayPaymentID = req.PaymentID
	payment.RazorpaySignature = req.Signature
	payment.Status = "paid"
	payment.PaidAt = &now
	db.DB.Save(&payment)

	var booking models.Booking
	db.DB.Preload("Passengers").Preload("Schedule.Route.FromCity").Preload("Schedule.Route.ToCity").Preload("Schedule.Operator").
		Where("id = ?", payment.BookingID).First(&booking)
	booking.Status = "confirmed"
	booking.ETicketSent = true
	db.DB.Save(&booking)

	// Send e-ticket (logs in dev mode)
	go func() {
		subject := "IndieBus e-Ticket: " + booking.BookingRef
		body := buildETicketHTML(booking)
		_ = h.EmailSvc.SendETicket(booking.ContactEmail, subject, body)
		if booking.WhatsAppEnabled {
			_ = h.EmailSvc.SendWhatsApp(booking.ContactPhone, "Your IndieBus ticket "+booking.BookingRef+" is confirmed. View it in the app: IndieBus > Trips.")
		}
	}()

	return c.JSON(http.StatusOK, map[string]string{"status": "verified", "booking_ref": booking.BookingRef})
}

// buildETicketHTML returns a full HTML e-ticket ready for SMTP delivery.
// Expects booking.Schedule with Route.FromCity/ToCity, Operator, Bus, Passengers preloaded.
func buildETicketHTML(b models.Booking) string {
	dep := b.Schedule.DepartureAt
	arr := b.Schedule.ArrivalAt
	operator := b.Schedule.Operator.Name
	busType := b.Schedule.Bus.BusType

	seats := make([]string, 0, len(b.Passengers))
	names := make([]string, 0, len(b.Passengers))
	for _, p := range b.Passengers {
		seats = append(seats, p.SeatNumber)
		names = append(names, p.FullName)
	}

	dateStr := dep.Format("Mon, 02 Jan 2006")
	depTime := dep.Format("15:04")
	arrTime := arr.Format("15:04")
	seatList := joinNonEmpty(seats, ", ")
	paxList := joinNonEmpty(names, ", ")

	return fmt.Sprintf(`<!doctype html>
<html><head><meta charset="utf-8"><title>IndieBus e-Ticket %s</title></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0F172A;color:#E2E8F0;padding:24px;margin:0">
  <div style="max-width:560px;margin:0 auto;background:#1E293B;border:1px solid #334155;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#FF6B1A,#FF8A3D);padding:20px 24px">
      <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.85">IndieBus · e-Ticket</div>
      <div style="font-size:24px;font-weight:700;margin-top:4px">Booking %s</div>
      <div style="font-size:13px;opacity:.9;margin-top:2px">Status: <strong>CONFIRMED</strong></div>
    </div>
    <div style="padding:24px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
        <div>
          <div style="font-size:34px;font-weight:700;color:#FF6B1A">%s</div>
          <div style="font-size:12px;color:#94A3B8">%s</div>
        </div>
        <div style="text-align:center;color:#94A3B8">→</div>
        <div style="text-align:right">
          <div style="font-size:34px;font-weight:700">%s</div>
          <div style="font-size:12px;color:#94A3B8">%s</div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid #334155;margin:20px 0">
      <table style="width:100%%;font-size:14px;border-collapse:collapse">
        <tr><td style="color:#94A3B8;padding:6px 0">Date</td><td style="text-align:right">%s</td></tr>
        <tr><td style="color:#94A3B8;padding:6px 0">Departure</td><td style="text-align:right">%s</td></tr>
        <tr><td style="color:#94A3B8;padding:6px 0">Arrival</td><td style="text-align:right">%s</td></tr>
        <tr><td style="color:#94A3B8;padding:6px 0">Operator</td><td style="text-align:right">%s</td></tr>
        <tr><td style="color:#94A3B8;padding:6px 0">Bus</td><td style="text-align:right">%s</td></tr>
        <tr><td style="color:#94A3B8;padding:6px 0">Seats</td><td style="text-align:right"><strong>%s</strong></td></tr>
        <tr><td style="color:#94A3B8;padding:6px 0">Passengers</td><td style="text-align:right">%s</td></tr>
        <tr><td style="color:#94A3B8;padding:6px 0">Total paid</td><td style="text-align:right"><strong style="color:#FF6B1A">₹%s</strong></td></tr>
      </table>
      <hr style="border:none;border-top:1px dashed #334155;margin:20px 0">
      <div style="text-align:center">
        <div style="display:inline-block;padding:12px;background:#0F172A;border-radius:8px">
          <div style="font-family:monospace;font-size:11px;letter-spacing:.2em;color:#94A3B8">PRESENT AT BOARDING</div>
          <div style="font-family:monospace;font-size:22px;font-weight:700;letter-spacing:.18em;margin-top:6px">%s</div>
        </div>
      </div>
      <p style="font-size:12px;color:#94A3B8;margin-top:24px">
        Carry a valid government ID matching the passenger name. Reach boarding point
        15 min before departure. Free cancellation up to 4 hours before departure.
      </p>
    </div>
    <div style="background:#0F172A;padding:14px 24px;font-size:11px;color:#64748B;text-align:center">
      IndieBus · Made in India · This is an electronic ticket, no printout required.
    </div>
  </div>
</body></html>`,
		b.BookingRef,
		b.BookingRef,
		depTime, dateStr,
		arrTime, dateStr,
		dateStr, depTime, arrTime,
		escape(operator), escape(busType),
		escape(seatList), escape(paxList),
		strconv.FormatFloat(b.TotalAmount, 'f', 2, 64),
		b.BookingRef,
	)
}

func escape(s string) string {
	s = htmlEscape(s)
	if s == "" {
		return "—"
	}
	return s
}

func htmlEscape(s string) string {
	r := strings.NewReplacer(
		"&", "&amp;",
		"<", "&lt;",
		">", "&gt;",
		`"`, "&quot;",
		"'", "&#39;",
	)
	return r.Replace(s)
}

func joinNonEmpty(parts []string, sep string) string {
	out := ""
	for i, p := range parts {
		if p == "" {
			continue
		}
		if i > 0 && out != "" {
			out += sep
		}
		out += p
	}
	return out
}

func _ensureStrconv() { _ = strconv.FormatFloat }
