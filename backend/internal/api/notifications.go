package api

// notifications.go — shared booking-confirmation delivery (email + SMS + WhatsApp)
// for all four verticals. Each vertical calls the appropriate Send* function from
// a goroutine after the booking is committed to the DB.

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/anuragh/indieyatra/backend/internal/models"
	"github.com/anuragh/indieyatra/backend/internal/services"
)

// ---- shared helpers --------------------------------------------------------

func esc(s string) string { return escape(s) } // re-use escape() from bookings.go

func rupeeFmt(f float64) string { return "₹" + strconv.FormatFloat(f, 'f', 0, 64) }

func headerBlock(accentColor, label, ref string) string {
	return fmt.Sprintf(`
    <div style="background:linear-gradient(135deg,%s,%s);padding:20px 24px">
      <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.85">IndieYatra · %s</div>
      <div style="font-size:24px;font-weight:700;margin-top:4px">Booking %s</div>
      <div style="font-size:13px;opacity:.9;margin-top:2px">Status: <strong>CONFIRMED</strong></div>
    </div>`, accentColor, lighten(accentColor), label, ref)
}

func lighten(hex string) string {
	// Simple brightening map for the five brand colors.
	m := map[string]string{
		"#4F46E5": "#6366F1", // train indigo
		"#06B6D4": "#22D3EE", // flight cyan
		"#F59E0B": "#FCD34D", // hotel amber
		"#FF6B1A": "#FF8A3D", // bus saffron
	}
	if v, ok := m[hex]; ok {
		return v
	}
	return hex
}

func tableRow(label, value string) string {
	return fmt.Sprintf(`<tr><td style="color:#94A3B8;padding:6px 0">%s</td><td style="text-align:right">%s</td></tr>`, label, value)
}

func footerBlock() string {
	return `
    <div style="background:#0F172A;padding:14px 24px;font-size:11px;color:#64748B;text-align:center">
      IndieYatra · Made in India · This is an electronic ticket, no printout required.
    </div>`
}

func refBlock(ref string) string {
	return fmt.Sprintf(`
      <hr style="border:none;border-top:1px dashed #334155;margin:20px 0">
      <div style="text-align:center">
        <div style="display:inline-block;padding:12px;background:#0F172A;border-radius:8px">
          <div style="font-family:monospace;font-size:11px;letter-spacing:.2em;color:#94A3B8">BOOKING REFERENCE</div>
          <div style="font-family:monospace;font-size:22px;font-weight:700;letter-spacing:.18em;margin-top:6px">%s</div>
        </div>
      </div>`, ref)
}

func wrapHTML(ref, inner string) string {
	return fmt.Sprintf(`<!doctype html>
<html><head><meta charset="utf-8"><title>IndieYatra e-Ticket %s</title></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0F172A;color:#E2E8F0;padding:24px;margin:0">
  <div style="max-width:560px;margin:0 auto;background:#1E293B;border:1px solid #334155;border-radius:16px;overflow:hidden">
    %s
  </div>
</body></html>`, ref, inner)
}

// ---- train -----------------------------------------------------------------

func buildTrainTicketHTML(b models.TrainBooking) string {
	depTime := b.Schedule.DepartureTime
	arrTime := b.Schedule.ArrivalTime
	date := b.Schedule.JourneyDate.Format("Mon, 02 Jan 2006")

	names := make([]string, 0, len(b.Passengers))
	berths := make([]string, 0, len(b.Passengers))
	for _, p := range b.Passengers {
		names = append(names, p.FullName)
		berths = append(berths, fmt.Sprintf("%s/%s", p.Coach, p.BerthNumber))
	}

	rows := strings.Join([]string{
		tableRow("Train", esc(b.Schedule.Train.Number+" "+b.Schedule.Train.Name)),
		tableRow("Date", date),
		tableRow("Departure", fmt.Sprintf("<strong>%s</strong> %s", esc(b.Schedule.FromStation.Code), depTime)),
		tableRow("Arrival", fmt.Sprintf("<strong>%s</strong> %s (+%dd)", esc(b.Schedule.ToStation.Code), arrTime, b.Schedule.ArrivalDay)),
		tableRow("Class / Quota", esc(b.Class)+" / "+esc(b.Quota)),
		tableRow("PNR", fmt.Sprintf("<strong style='letter-spacing:.1em'>%s</strong>", esc(b.PNR))),
		tableRow("Coach / Berth", esc(joinNonEmpty(berths, "  "))),
		tableRow("Passengers", esc(joinNonEmpty(names, ", "))),
		tableRow("Total paid", fmt.Sprintf("<strong style='color:#4F46E5'>%s</strong>", rupeeFmt(b.TotalAmount))),
	}, "\n")

	inner := headerBlock("#4F46E5", "Train e-Ticket", b.BookingRef) + `
    <div style="padding:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div>
          <div style="font-size:34px;font-weight:700;color:#4F46E5">` + esc(b.Schedule.FromStation.Code) + `</div>
          <div style="font-size:12px;color:#94A3B8">` + esc(b.Schedule.FromStation.Name) + `</div>
        </div>
        <div style="color:#94A3B8;font-size:20px">→</div>
        <div style="text-align:right">
          <div style="font-size:34px;font-weight:700">` + esc(b.Schedule.ToStation.Code) + `</div>
          <div style="font-size:12px;color:#94A3B8">` + esc(b.Schedule.ToStation.Name) + `</div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid #334155;margin:0 0 20px">
      <table style="width:100%;font-size:14px;border-collapse:collapse">` + rows + `</table>` +
		refBlock(b.BookingRef) + `
      <p style="font-size:12px;color:#94A3B8;margin-top:24px">
        Carry a valid photo ID matching the passenger name. Board from the correct coach.
        Check PNR status for final chart confirmation.
      </p>
    </div>` + footerBlock()

	return wrapHTML(b.BookingRef, inner)
}

func buildTrainSMSText(b models.TrainBooking) string {
	return fmt.Sprintf(
		"IndieYatra Train Booking CONFIRMED\nRef: %s | PNR: %s\n%s %s → %s\n%s | Class: %s\nTotal: %s\nView: indieya.in/trips",
		b.BookingRef, b.PNR,
		b.Schedule.Train.Number, b.Schedule.FromStation.Code, b.Schedule.ToStation.Code,
		b.Schedule.JourneyDate.Format("02 Jan 2006"), b.Class,
		rupeeFmt(b.TotalAmount),
	)
}

func buildTrainWhatsAppText(b models.TrainBooking) string {
	return fmt.Sprintf(
		"🚆 *IndieYatra Train Booking Confirmed*\n\n"+
			"Ref: *%s*\nPNR: *%s*\n\n"+
			"*%s* (%s)\n%s → %s\n%s | Class: %s\n\n"+
			"Passengers: %d\nTotal: *%s*\n\nView your ticket: IndieYatra > Trips",
		b.BookingRef, b.PNR,
		b.Schedule.Train.Name, b.Schedule.Train.Number,
		b.Schedule.FromStation.Code, b.Schedule.ToStation.Code,
		b.Schedule.JourneyDate.Format("02 Jan 2006"), b.Class,
		len(b.Passengers), rupeeFmt(b.TotalAmount),
	)
}

// SendTrainBookingNotifications fires email + SMS + WhatsApp for a confirmed
// train booking. Call inside a goroutine.
func SendTrainBookingNotifications(svc *services.EmailService, b models.TrainBooking, email, phone string) {
	if email != "" {
		subject := "IndieYatra Train e-Ticket: " + b.BookingRef + " (PNR: " + b.PNR + ")"
		_ = svc.SendETicket(email, subject, buildTrainTicketHTML(b))
	}
	if phone != "" {
		_ = svc.SendSMS(phone, buildTrainSMSText(b))
		_ = svc.SendWhatsApp(phone, buildTrainWhatsAppText(b))
	}
}

// ---- flight ----------------------------------------------------------------

func buildFlightTicketHTML(b models.FlightBooking, sched models.FlightSchedule) string {
	date := sched.JourneyDate.Format("Mon, 02 Jan 2006")

	names := make([]string, 0, len(b.Passengers))
	seats := make([]string, 0, len(b.Passengers))
	for _, p := range b.Passengers {
		names = append(names, p.FirstName+" "+p.LastName)
		seats = append(seats, p.SeatNumber)
	}

	rows := strings.Join([]string{
		tableRow("Airline", esc(sched.Airline.Name)+" "+esc(sched.FlightNumber)),
		tableRow("Aircraft", esc(sched.Aircraft)),
		tableRow("Date", date),
		tableRow("Departure", fmt.Sprintf("<strong>%s</strong> %s — Terminal %s", esc(sched.FromAirport.IATA), sched.DepartureTime, esc(sched.FromAirport.Terminal))),
		tableRow("Arrival", fmt.Sprintf("<strong>%s</strong> %s — Terminal %s", esc(sched.ToAirport.IATA), sched.ArrivalTime, esc(sched.ToAirport.Terminal))),
		tableRow("Cabin", esc(b.CabinClass)),
		tableRow("PNR", fmt.Sprintf("<strong style='letter-spacing:.1em'>%s</strong>", esc(b.PNR))),
		tableRow("Seats", esc(joinNonEmpty(seats, ", "))),
		tableRow("Passengers", esc(joinNonEmpty(names, ", "))),
		tableRow("Baggage", fmt.Sprintf("%dkg check-in", sched.BaggageKg)),
		tableRow("Total paid", fmt.Sprintf("<strong style='color:#06B6D4'>%s</strong>", rupeeFmt(b.TotalAmount))),
	}, "\n")

	inner := headerBlock("#06B6D4", "Flight e-Ticket", b.BookingRef) + `
    <div style="padding:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div>
          <div style="font-size:34px;font-weight:700;color:#06B6D4">` + esc(sched.FromAirport.IATA) + `</div>
          <div style="font-size:12px;color:#94A3B8">` + esc(sched.FromAirport.City) + `</div>
        </div>
        <div style="text-align:center;color:#94A3B8">
          <div style="font-size:20px">✈</div>
          <div style="font-size:10px;margin-top:2px">` + fmt.Sprintf("%dh %02dm", sched.DurationMin/60, sched.DurationMin%60) + `</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:34px;font-weight:700">` + esc(sched.ToAirport.IATA) + `</div>
          <div style="font-size:12px;color:#94A3B8">` + esc(sched.ToAirport.City) + `</div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid #334155;margin:0 0 20px">
      <table style="width:100%;font-size:14px;border-collapse:collapse">` + rows + `</table>` +
		refBlock(b.BookingRef) + `
      <p style="font-size:12px;color:#94A3B8;margin-top:24px">
        Web check-in opens 48h before departure. Carry a valid photo ID. Arrive at the
        airport at least 75 minutes before departure.
      </p>
    </div>` + footerBlock()

	return wrapHTML(b.BookingRef, inner)
}

func buildFlightSMSText(b models.FlightBooking, sched models.FlightSchedule) string {
	return fmt.Sprintf(
		"IndieYatra Flight Booking CONFIRMED\nRef: %s | PNR: %s\n%s %s → %s\n%s %s | %s\nTotal: %s\nView: indieya.in/trips",
		b.BookingRef, b.PNR,
		sched.Airline.Name, sched.FromAirport.IATA, sched.ToAirport.IATA,
		sched.JourneyDate.Format("02 Jan 2006"), sched.DepartureTime, b.CabinClass,
		rupeeFmt(b.TotalAmount),
	)
}

func buildFlightWhatsAppText(b models.FlightBooking, sched models.FlightSchedule) string {
	return fmt.Sprintf(
		"✈️ *IndieYatra Flight Booking Confirmed*\n\n"+
			"Ref: *%s*\nPNR: *%s*\n\n"+
			"*%s %s*\n%s (%s) → %s (%s)\n%s | Dep: %s\n\n"+
			"Cabin: %s | Baggage: %dkg\nPassengers: %d\nTotal: *%s*\n\n"+
			"Web check-in opens 48h before departure.\nView your ticket: IndieYatra > Trips",
		b.BookingRef, b.PNR,
		sched.Airline.Name, sched.FlightNumber,
		sched.FromAirport.City, sched.FromAirport.IATA,
		sched.ToAirport.City, sched.ToAirport.IATA,
		sched.JourneyDate.Format("02 Jan 2006"), sched.DepartureTime,
		b.CabinClass, sched.BaggageKg, len(b.Passengers), rupeeFmt(b.TotalAmount),
	)
}

// SendFlightBookingNotifications fires email + SMS + WhatsApp for a confirmed
// flight booking. Call inside a goroutine.
func SendFlightBookingNotifications(svc *services.EmailService, b models.FlightBooking, sched models.FlightSchedule, email, phone string) {
	if email != "" {
		subject := fmt.Sprintf("IndieYatra Flight e-Ticket: %s (PNR: %s)", b.BookingRef, b.PNR)
		_ = svc.SendETicket(email, subject, buildFlightTicketHTML(b, sched))
	}
	if phone != "" {
		_ = svc.SendSMS(phone, buildFlightSMSText(b, sched))
		_ = svc.SendWhatsApp(phone, buildFlightWhatsAppText(b, sched))
	}
}

// ---- hotel -----------------------------------------------------------------

func buildHotelVoucherHTML(b models.HotelBooking, hotel models.Hotel, room models.HotelRoom) string {
	rows := strings.Join([]string{
		tableRow("Hotel", esc(hotel.Name)),
		tableRow("Location", esc(hotel.City)+", "+esc(hotel.State)),
		tableRow("Room", esc(room.RoomType)+" — "+esc(room.BedType)),
		tableRow("Check-in", b.CheckIn.Format("Mon, 02 Jan 2006")+" (from "+esc(hotel.CheckInTime)+")"),
		tableRow("Check-out", b.CheckOut.Format("Mon, 02 Jan 2006")+" (by "+esc(hotel.CheckOutTime)+")"),
		tableRow("Nights", strconv.Itoa(b.Nights)),
		tableRow("Guests", strconv.Itoa(b.Guests)),
		tableRow("Guest name", esc(b.GuestName)),
		tableRow("Room price", rupeeFmt(b.RoomPrice)+" × "+strconv.Itoa(b.Nights)+" nights"),
		tableRow("Taxes", rupeeFmt(b.TaxAmount)),
		tableRow("Total paid", fmt.Sprintf("<strong style='color:#F59E0B'>%s</strong>", rupeeFmt(b.TotalAmount))),
	}, "\n")

	inner := headerBlock("#F59E0B", "Hotel Voucher", b.BookingRef) + `
    <div style="padding:24px">
      <div style="margin-bottom:20px">
        <div style="font-size:22px;font-weight:700;color:#F59E0B">` + esc(hotel.Name) + `</div>
        <div style="font-size:13px;color:#94A3B8;margin-top:4px">` + esc(hotel.Address) + `</div>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:20px">
        <div style="flex:1;background:#0F172A;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:10px;text-transform:uppercase;color:#94A3B8;letter-spacing:.1em">Check-in</div>
          <div style="font-size:20px;font-weight:700;color:#F59E0B;margin-top:4px">` + b.CheckIn.Format("02 Jan") + `</div>
          <div style="font-size:11px;color:#94A3B8">` + esc(hotel.CheckInTime) + `</div>
        </div>
        <div style="flex:1;background:#0F172A;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:10px;text-transform:uppercase;color:#94A3B8;letter-spacing:.1em">Check-out</div>
          <div style="font-size:20px;font-weight:700;margin-top:4px">` + b.CheckOut.Format("02 Jan") + `</div>
          <div style="font-size:11px;color:#94A3B8">` + esc(hotel.CheckOutTime) + `</div>
        </div>
        <div style="flex:1;background:#0F172A;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:10px;text-transform:uppercase;color:#94A3B8;letter-spacing:.1em">Nights</div>
          <div style="font-size:20px;font-weight:700;margin-top:4px">` + strconv.Itoa(b.Nights) + `</div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid #334155;margin:0 0 20px">
      <table style="width:100%;font-size:14px;border-collapse:collapse">` + rows + `</table>` +
		refBlock(b.BookingRef) + `
      <p style="font-size:12px;color:#94A3B8;margin-top:24px">
        Present this voucher at check-in along with a valid photo ID. Early check-in and
        late checkout subject to availability.
      </p>
    </div>` + footerBlock()

	return wrapHTML(b.BookingRef, inner)
}

func buildHotelSMSText(b models.HotelBooking, hotel models.Hotel) string {
	return fmt.Sprintf(
		"IndieYatra Hotel Booking CONFIRMED\nRef: %s\n%s, %s\nCheck-in: %s | Check-out: %s\n%d night(s) | %s\nView: indieya.in/trips",
		b.BookingRef,
		hotel.Name, hotel.City,
		b.CheckIn.Format("02 Jan 2006"), b.CheckOut.Format("02 Jan 2006"),
		b.Nights, rupeeFmt(b.TotalAmount),
	)
}

func buildHotelWhatsAppText(b models.HotelBooking, hotel models.Hotel, room models.HotelRoom) string {
	return fmt.Sprintf(
		"🏨 *IndieYatra Hotel Booking Confirmed*\n\n"+
			"Ref: *%s*\n\n"+
			"*%s*\n%s, %s\n\n"+
			"Room: %s (%s)\nCheck-in: *%s* from %s\nCheck-out: *%s* by %s\nNights: %d\n\n"+
			"Guest: %s\nTotal: *%s*\n\n"+
			"Present this booking reference at check-in.\nView your voucher: IndieYatra > Trips",
		b.BookingRef,
		hotel.Name, hotel.City, hotel.State,
		room.RoomType, room.BedType,
		b.CheckIn.Format("02 Jan 2006"), hotel.CheckInTime,
		b.CheckOut.Format("02 Jan 2006"), hotel.CheckOutTime,
		b.Nights,
		b.GuestName, rupeeFmt(b.TotalAmount),
	)
}

// SendHotelBookingNotifications fires email + SMS + WhatsApp for a confirmed
// hotel booking. Call inside a goroutine.
func SendHotelBookingNotifications(svc *services.EmailService, b models.HotelBooking, hotel models.Hotel, room models.HotelRoom, email, phone string) {
	if email != "" {
		subject := "IndieYatra Hotel Voucher: " + b.BookingRef + " — " + hotel.Name
		_ = svc.SendETicket(email, subject, buildHotelVoucherHTML(b, hotel, room))
	}
	if phone != "" {
		_ = svc.SendSMS(phone, buildHotelSMSText(b, hotel))
		_ = svc.SendWhatsApp(phone, buildHotelWhatsAppText(b, hotel, room))
	}
}
