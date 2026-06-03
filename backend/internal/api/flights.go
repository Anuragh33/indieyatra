package api

import (
	"fmt"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/anuragh/indiebus/backend/internal/auth"
	"github.com/anuragh/indiebus/backend/internal/db"
	"github.com/anuragh/indiebus/backend/internal/models"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

var _ = time.Now // suppress unused import warning

// GET /api/flights/airports/autocomplete?q=
func (h *Handlers) FlightAirportsAutocomplete(c echo.Context) error {
	q := strings.TrimSpace(c.QueryParam("q"))
	if len(q) < 2 {
		return c.JSON(http.StatusOK, []models.Airport{})
	}
	qU := strings.ToUpper(q)
	qL := strings.ToLower(q)
	var airports []models.Airport
	db.DB.Where(
		"UPPER(iata) LIKE ? OR LOWER(name) LIKE ? OR LOWER(city) LIKE ?",
		qU+"%", "%"+qL+"%", "%"+qL+"%",
	).Order("city ASC").Limit(10).Find(&airports)
	return c.JSON(http.StatusOK, airports)
}

type flightSearchResult struct {
	ScheduleID     string  `json:"schedule_id"`
	FlightNumber   string  `json:"flight_number"`
	AirlineCode    string  `json:"airline_code"`
	AirlineName    string  `json:"airline_name"`
	AirlineColor   string  `json:"airline_color"`
	FromIATA       string  `json:"from_iata"`
	FromCity       string  `json:"from_city"`
	ToIATA         string  `json:"to_iata"`
	ToCity         string  `json:"to_city"`
	DepartureTime  string  `json:"departure_time"`
	ArrivalTime    string  `json:"arrival_time"`
	DurationMin    int     `json:"duration_min"`
	Aircraft       string  `json:"aircraft"`
	AvailableSeats int     `json:"available_seats"`
	BaseFare       float64 `json:"base_fare"`
	TaxesAndFees   float64 `json:"taxes_and_fees"`
	TotalFare      float64 `json:"total_fare"`
	BaggageKg      int     `json:"baggage_kg"`
	HasMeal        bool    `json:"has_meal"`
	HasWifi        bool    `json:"has_wifi"`
	OnTimePercent  int     `json:"on_time_percent"`
	FareType       string  `json:"fare_type"`
	RefundPolicy   string  `json:"refund_policy"`
}

// GET /api/flights/search?from=BOM&to=DEL&date=2024-01-15&adults=1&cabin=Economy
func (h *Handlers) SearchFlights(c echo.Context) error {
	from := strings.ToUpper(strings.TrimSpace(c.QueryParam("from")))
	to := strings.ToUpper(strings.TrimSpace(c.QueryParam("to")))
	dateStr := c.QueryParam("date")
	cabin := c.QueryParam("cabin")

	if from == "" || to == "" || dateStr == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "from, to, date required"})
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid date format"})
	}
	startOfDay := date.Truncate(24 * time.Hour)
	endOfDay := startOfDay.Add(24 * time.Hour)

	var schedules []models.FlightSchedule
	q := db.DB.Preload("Airline").Preload("FromAirport").Preload("ToAirport").
		Joins("JOIN airports fa ON fa.id = flight_schedules.from_airport_id").
		Joins("JOIN airports ta ON ta.id = flight_schedules.to_airport_id").
		Where("fa.iata = ? AND ta.iata = ?", from, to).
		Where("flight_schedules.journey_date >= ? AND flight_schedules.journey_date < ?", startOfDay, endOfDay).
		Where("flight_schedules.is_active = true AND flight_schedules.available_seats > 0").
		Where("flight_schedules.deleted_at IS NULL")

	if cabin != "" {
		q = q.Where("flight_schedules.cabin_class = ?", cabin)
	}
	q.Order("flight_schedules.departure_time ASC").Find(&schedules)

	results := make([]flightSearchResult, 0, len(schedules))
	for _, s := range schedules {
		// Strip date suffix from flight number display
		displayNum := s.FlightNumber
		if idx := strings.LastIndex(displayNum, "-2"); idx > 3 {
			displayNum = displayNum[:idx]
		}
		results = append(results, flightSearchResult{
			ScheduleID:     s.ID.String(),
			FlightNumber:   displayNum,
			AirlineCode:    s.Airline.Code,
			AirlineName:    s.Airline.Name,
			AirlineColor:   s.Airline.Color,
			FromIATA:       s.FromAirport.IATA,
			FromCity:       s.FromAirport.City,
			ToIATA:         s.ToAirport.IATA,
			ToCity:         s.ToAirport.City,
			DepartureTime:  s.DepartureTime,
			ArrivalTime:    s.ArrivalTime,
			DurationMin:    s.DurationMin,
			Aircraft:       s.Aircraft,
			AvailableSeats: s.AvailableSeats,
			BaseFare:       s.BaseFare,
			TaxesAndFees:   s.TaxesAndFees,
			TotalFare:      s.BaseFare + s.TaxesAndFees,
			BaggageKg:      s.BaggageKg,
			HasMeal:        s.HasMeal,
			HasWifi:        s.HasWifi,
			OnTimePercent:  s.OnTimePercent,
			FareType:       s.FareType,
			RefundPolicy:   s.RefundPolicy,
		})
	}
	return c.JSON(http.StatusOK, results)
}

// GET /api/flights/:id
func (h *Handlers) GetFlight(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	var s models.FlightSchedule
	if err := db.DB.Preload("Airline").Preload("FromAirport").Preload("ToAirport").
		First(&s, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "flight not found"})
	}
	displayNum := s.FlightNumber
	if idx := strings.LastIndex(displayNum, "-2"); idx > 3 {
		displayNum = displayNum[:idx]
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"schedule":       s,
		"flight_number":  displayNum,
		"taxes_breakdown": []map[string]interface{}{
			{"label": "Base Fare", "amount": s.BaseFare},
			{"label": "Passenger Service Fee", "amount": float64(int(s.BaseFare*0.05/10)) * 10},
			{"label": "User Development Fee", "amount": float64(int(s.BaseFare*0.04/10)) * 10},
			{"label": "Fuel Surcharge", "amount": float64(int(s.BaseFare*0.06/10)) * 10},
			{"label": "GST (5%)", "amount": float64(int(s.TaxesAndFees*0.27/10)) * 10},
			{"label": "Platform Fee", "amount": 250.0},
		},
	})
}

type createFlightBookingReq struct {
	ScheduleID   string `json:"schedule_id"`
	CabinClass   string `json:"cabin_class"`
	ContactEmail string `json:"contact_email"`
	ContactPhone string `json:"contact_phone"`
	Insurance    bool   `json:"insurance"`
	Passengers   []struct {
		Title          string `json:"title"`
		FirstName      string `json:"first_name"`
		LastName       string `json:"last_name"`
		DOB            string `json:"dob"`
		Gender         string `json:"gender"`
		IDType         string `json:"id_type"`
		IDNumber       string `json:"id_number"`
		FrequentFlyer  string `json:"frequent_flyer"`
		MealPreference string `json:"meal_preference"`
		ExtraBaggage   int    `json:"extra_baggage_kg"`
	} `json:"passengers"`
}

// POST /api/flights/bookings/create
func (h *Handlers) CreateFlightBooking(c echo.Context) error {
	userIDStr, ok := c.Get(auth.UserIDKey).(string)
	if !ok || userIDStr == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	var req createFlightBookingReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}

	schedID, err := uuid.Parse(req.ScheduleID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid schedule_id"})
	}

	var sched models.FlightSchedule
	if err := db.DB.Preload("Airline").Preload("FromAirport").Preload("ToAirport").
		First(&sched, "id = ?", schedID).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "flight not found"})
	}

	paxCount := len(req.Passengers)
	if paxCount == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "at least one passenger required"})
	}

	baseFare := sched.BaseFare * float64(paxCount)
	taxes := sched.TaxesAndFees * float64(paxCount)
	platformFee := 250.0
	insuranceFee := 0.0
	if req.Insurance {
		insuranceFee = 149.0 * float64(paxCount)
	}
	mealFee := 0.0
	for _, p := range req.Passengers {
		if p.MealPreference != "" && p.MealPreference != "none" {
			mealFee += 250
		}
		if p.ExtraBaggage > 0 {
			mealFee += float64(p.ExtraBaggage) * 600
		}
	}
	gst := (baseFare + mealFee) * 0.05
	total := baseFare + taxes + platformFee + insuranceFee + mealFee + gst

	bookingRef := fmt.Sprintf("IY-FLT-%06d", rand.Intn(999999))
	pnr := fmt.Sprintf("%s%04d", sched.Airline.Code, rand.Intn(9999))

	booking := models.FlightBooking{
		UserID:       userID,
		ScheduleID:   schedID,
		BookingRef:   bookingRef,
		PNR:          strings.ToUpper(pnr),
		CabinClass:   req.CabinClass,
		Status:       "confirmed",
		TotalAmount:  total,
		BaseFare:     baseFare,
		TaxesAndFees: taxes,
		MealFee:      mealFee,
		InsuranceFee: insuranceFee,
		PlatformFee:  platformFee,
		GSTAmount:    gst,
		ContactEmail: req.ContactEmail,
		ContactPhone: req.ContactPhone,
	}

	if err := db.DB.Create(&booking).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to create booking"})
	}

	seatLetters := []string{"A", "B", "C", "D", "E", "F"}
	passengers := make([]models.FlightPassenger, 0, paxCount)
	for i, p := range req.Passengers {
		row := 10 + i
		seat := fmt.Sprintf("%d%s", row, seatLetters[i%6])
		passengers = append(passengers, models.FlightPassenger{
			FlightBookingID: booking.ID,
			Title:           p.Title,
			FirstName:       p.FirstName,
			LastName:        p.LastName,
			DOB:             p.DOB,
			Gender:          p.Gender,
			IDType:          p.IDType,
			IDNumber:        p.IDNumber,
			FrequentFlyer:   p.FrequentFlyer,
			MealPreference:  p.MealPreference,
			SeatNumber:      seat,
			ExtraBaggage:    p.ExtraBaggage,
			Status:          "confirmed",
		})
	}

	if err := db.DB.Create(&passengers).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to save passengers"})
	}

	// Reduce seat availability
	db.DB.Model(&sched).UpdateColumn("available_seats", sched.AvailableSeats-paxCount)

	booking.Passengers = passengers

	// Phase 5: WhatsApp delivery
	if req.ContactPhone != "" {
		go func() {
			msg := "Your IndieYatra flight booking " + bookingRef + " (PNR: " + booking.PNR + ") is confirmed. " +
				sched.Airline.Name + " " + sched.FlightNumber + " — " + sched.FromAirport.City + " to " + sched.ToAirport.City +
				" on " + sched.JourneyDate.Format("02 Jan 2006") + ". View details in the app."
			_ = h.EmailSvc.SendWhatsApp(req.ContactPhone, msg)
		}()
	}

	return c.JSON(http.StatusCreated, booking)
}

// GET /api/flights/bookings/:id
func (h *Handlers) GetFlightBooking(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	var booking models.FlightBooking
	if err := db.DB.Preload("Schedule.Airline").Preload("Schedule.FromAirport").
		Preload("Schedule.ToAirport").Preload("Passengers").
		Where("id = ? AND user_id = ?", id, uid).First(&booking).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "booking not found"})
	}
	return c.JSON(http.StatusOK, booking)
}

// GET /api/flights/bookings/user/me
func (h *Handlers) ListUserFlightBookings(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var bookings []models.FlightBooking
	db.DB.Preload("Schedule.Airline").
		Preload("Schedule.FromAirport").
		Preload("Schedule.ToAirport").
		Preload("Passengers").
		Where("user_id = ?", uid).
		Order("created_at DESC").
		Find(&bookings)
	if bookings == nil {
		bookings = []models.FlightBooking{}
	}
	return c.JSON(http.StatusOK, bookings)
}
