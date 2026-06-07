// Package workers contains background goroutines for the IndieYatra concierge system.
// Each worker runs continuously and creates ConciergeAlert records + sends WhatsApp
// messages when relevant conditions are detected.
//
// External API keys (NTES, FlightAware, weather) are read from environment variables
// and must be populated before the workers take live action. Without keys the workers
// run in "dry" mode: they log what they would do but create no alerts.
package workers

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/anuragh/indieyatra/backend/internal/db"
	"github.com/anuragh/indieyatra/backend/internal/models"
	"github.com/anuragh/indieyatra/backend/internal/services"
	"github.com/anuragh/indieyatra/backend/internal/websocket"
	"github.com/google/uuid"
)

// Start launches all background workers. Call this once from main.go after DB is ready.
func Start(emailSvc *services.EmailService) {
	go priceMonitorWorker(emailSvc)
	go trainStatusWorker(emailSvc)
	go flightStatusWorker(emailSvc)
	go tatkalWindowWorker(emailSvc)
	go dailyBriefingWorker(emailSvc)
	go reviewPromptWorker(emailSvc)
	log.Println("✓ Concierge workers started")
}

// ─── Price Monitor ─────────────────────────────────────────────────────────────
// Polls every 30 minutes. Checks all active PriceAlerts and creates a
// ConciergeAlert + WhatsApp notification when a threshold is crossed.

func priceMonitorWorker(emailSvc *services.EmailService) {
	ticker := time.NewTicker(30 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		runPriceMonitor(emailSvc)
	}
}

func runPriceMonitor(emailSvc *services.EmailService) {
	var alerts []models.PriceAlert
	db.DB.Where("is_active = true").Find(&alerts)

	for _, alert := range alerts {
		var fromCity, toCity models.City
		if db.DB.First(&fromCity, "id = ?", alert.FromCityID).Error != nil {
			continue
		}
		if db.DB.First(&toCity, "id = ?", alert.ToCityID).Error != nil {
			continue
		}

		var sched models.Schedule
		err := db.DB.Preload("Route").
			Joins("JOIN routes r ON r.id = schedules.route_id").
			Where("r.from_city_id = ? AND r.to_city_id = ? AND schedules.is_active = true", alert.FromCityID, alert.ToCityID).
			Where("schedules.departure_at > ?", time.Now()).
			Order("schedules.base_fare ASC").
			First(&sched).Error

		if err != nil || sched.BaseFare == 0 {
			continue
		}

		currentFare := sched.BaseFare

		if currentFare <= alert.PriceThreshold {
			createAlertIfNotExists(alert.UserID.String(), "price_drop",
				fmt.Sprintf("Price dropped on %s → %s!", fromCity.Name, toCity.Name),
				fmt.Sprintf("Was ₹%.0f → Now ₹%.0f. Book now before it rises.",
					alert.CurrentPrice, currentFare),
				"/buses", "Book Now", 1)

			var user models.User
			if err := db.DB.First(&user, "id = ?", alert.UserID).Error; err == nil && user.Phone != "" {
				var settings models.ConciergeSettings
				if db.DB.Where("user_id = ?", alert.UserID).First(&settings).Error == nil && settings.WhatsAppAlerts {
					msg := fmt.Sprintf("Price Alert! %s→%s bus is now ₹%.0f. Book on IndieYatra now.",
						fromCity.Name, toCity.Name, currentFare)
					_ = emailSvc.SendWhatsApp(user.Phone, msg)
				}
			}

			db.DB.Model(&alert).Update("current_price", currentFare)
		}
	}
}

// ─── Train Status Worker ───────────────────────────────────────────────────────
// Polls every 5 minutes. For confirmed train bookings with journey_date = today,
// checks running status via NTES API (API key: NTES_API_KEY env var).

func trainStatusWorker(emailSvc *services.EmailService) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		runTrainStatus(emailSvc)
	}
}

func runTrainStatus(emailSvc *services.EmailService) {
	ntesKey := os.Getenv("NTES_API_KEY")

	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)

	var bookings []models.TrainBooking
	db.DB.Preload("Schedule.Train").Preload("Schedule.FromStation").Preload("Schedule.ToStation").
		Where("status = 'confirmed'").
		Joins("JOIN train_schedules ts ON ts.id = train_bookings.schedule_id").
		Where("ts.journey_date >= ? AND ts.journey_date < ?", today, tomorrow).
		Find(&bookings)

	for _, b := range bookings {
		if ntesKey == "" {
			// Dry run: log without hitting API
			log.Printf("[TrainStatusWorker] dry-run: would check %s (PNR %s)", b.Schedule.Train.Number, b.PNR)
			continue
		}

		// TODO: call NTES API with ntesKey and b.Schedule.Train.Number
		// delayMin, err := fetchNTESDelay(ntesKey, b.Schedule.Train.Number)
		// Example stub:
		delayMin := 0

		if delayMin > 30 {
			createAlertIfNotExists(b.UserID.String(), "delay",
				fmt.Sprintf("%s is running %dh %02dm late", b.Schedule.Train.Name, delayMin/60, delayMin%60),
				fmt.Sprintf("Your %s (PNR: %s) from %s to %s is delayed. We've noted your hotel of your late arrival.",
					b.Schedule.Train.Name, b.PNR, b.Schedule.FromStation.City, b.Schedule.ToStation.City),
				"/trains/booking/"+b.ID.String(), "View Booking", 1)

			var user models.User
			if db.DB.First(&user, "id = ?", b.UserID).Error == nil && user.Phone != "" {
				var settings models.ConciergeSettings
				if db.DB.Where("user_id = ?", b.UserID).First(&settings).Error == nil && settings.DelayAlerts && settings.WhatsAppAlerts {
					msg := fmt.Sprintf("Your %s (PNR %s) is running %d mins late. %s → %s. Check the IndieYatra app for updates.",
						b.Schedule.Train.Name, b.PNR, delayMin, b.Schedule.FromStation.City, b.Schedule.ToStation.City)
					_ = emailSvc.SendWhatsApp(user.Phone, msg)
				}
			}
		}
	}
}

// ─── Flight Status Worker ──────────────────────────────────────────────────────
// Polls every 5 minutes. For confirmed flight bookings with journey_date = today,
// checks status via AviationStack API (API key: AVIATIONSTACK_API_KEY env var).

func flightStatusWorker(emailSvc *services.EmailService) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		runFlightStatus(emailSvc)
	}
}

func runFlightStatus(emailSvc *services.EmailService) {
	aviationKey := os.Getenv("AVIATIONSTACK_API_KEY")

	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)

	var bookings []models.FlightBooking
	db.DB.Preload("Schedule.Airline").Preload("Schedule.FromAirport").Preload("Schedule.ToAirport").
		Where("status = 'confirmed'").
		Joins("JOIN flight_schedules fs ON fs.id = flight_bookings.schedule_id").
		Where("fs.journey_date >= ? AND fs.journey_date < ?", today, tomorrow).
		Find(&bookings)

	for _, b := range bookings {
		if aviationKey == "" {
			log.Printf("[FlightStatusWorker] dry-run: would check %s (PNR %s)", b.Schedule.FlightNumber, b.PNR)
			continue
		}

		// TODO: call AviationStack API with aviationKey and b.Schedule.FlightNumber
		// status, delayMin, err := fetchFlightStatus(aviationKey, b.Schedule.FlightNumber)
		delayMin := 0
		status := "on_time"

		switch status {
		case "delayed":
			createAlertIfNotExists(b.UserID.String(), "delay",
				fmt.Sprintf("%s %s is delayed by %d mins", b.Schedule.Airline.Name, b.Schedule.FlightNumber, delayMin),
				fmt.Sprintf("Your flight (PNR: %s) from %s to %s is running late.",
					b.PNR, b.Schedule.FromAirport.City, b.Schedule.ToAirport.City),
				"/flights/booking/"+b.ID.String(), "View Booking", 1)
		case "cancelled":
			createAlertIfNotExists(b.UserID.String(), "delay",
				fmt.Sprintf("%s %s has been cancelled", b.Schedule.Airline.Name, b.Schedule.FlightNumber),
				"Your flight has been cancelled. Please contact the airline or check IndieYatra for alternative options.",
				"/flights", "Find Alternatives", 1)
		default:
			_ = status // on_time — no alert needed
		}
	}
}

// ─── Tatkal Window Worker ──────────────────────────────────────────────────────
// Runs every hour. For users with price alerts on train routes, calculates
// the tatkal booking window (opens 24h before departure) and sends a reminder
// 1 hour before it opens.

func tatkalWindowWorker(emailSvc *services.EmailService) {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()
	for range ticker.C {
		runTatkalWindow(emailSvc)
	}
}

func runTatkalWindow(emailSvc *services.EmailService) {
	// Find train schedules departing in 25h (tatkal opens 24h before)
	windowStart := time.Now().Add(25 * time.Hour)
	windowEnd := time.Now().Add(26 * time.Hour)

	var schedules []models.TrainSchedule
	db.DB.Preload("Train").Preload("FromStation").Preload("ToStation").
		Where("journey_date >= ? AND journey_date < ?", windowStart, windowEnd).
		Where("is_active = true").Find(&schedules)

	// Find users with price alerts for these routes
	for _, s := range schedules {
		var alerts []models.PriceAlert
		db.DB.Where("from_code = ? AND to_code = ? AND vertical = 'train' AND is_active = true",
			s.FromStation.Code, s.ToStation.Code).Find(&alerts)

		for _, alert := range alerts {
			createAlertIfNotExists(alert.UserID.String(), "tatkal",
				fmt.Sprintf("Tatkal opens in ~1 hour for %s", s.Train.Name),
				fmt.Sprintf("%s → %s on %s. Tatkal booking window opens at %s.",
					s.FromStation.City, s.ToStation.City,
					s.JourneyDate.Format("02 Jan"),
					time.Now().Add(1*time.Hour).Format("15:04")),
				"/trains", "Book Tatkal", 1)

			var user models.User
			if db.DB.First(&user, "id = ?", alert.UserID).Error == nil && user.Phone != "" {
				var settings models.ConciergeSettings
				if db.DB.Where("user_id = ?", alert.UserID).First(&settings).Error == nil && settings.TatkalAlerts && settings.WhatsAppAlerts {
					msg := fmt.Sprintf("Tatkal Alert! %s (%s→%s) on %s opens for booking in ~1 hour. Book now on IndieYatra.",
						s.Train.Name, s.FromStation.City, s.ToStation.City, s.JourneyDate.Format("02 Jan"))
					_ = emailSvc.SendWhatsApp(user.Phone, msg)
				}
			}
		}
	}
}

// ─── Daily Briefing Worker ─────────────────────────────────────────────────────
// Runs every hour and sends a morning briefing to users whose briefing_time
// matches the current hour (e.g. "06:00" → fires at 6 AM).

func dailyBriefingWorker(emailSvc *services.EmailService) {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()
	for range ticker.C {
		runDailyBriefing(emailSvc)
	}
}

func runDailyBriefing(emailSvc *services.EmailService) {
	currentHour := fmt.Sprintf("%02d:00", time.Now().Hour())

	var settings []models.ConciergeSettings
	db.DB.Where("briefing_time = ? AND whatsapp_alerts = true", currentHour).Find(&settings)

	for _, s := range settings {
		var user models.User
		if db.DB.First(&user, "id = ?", s.UserID).Error != nil || user.Phone == "" {
			continue
		}

		// Build briefing message
		var trainCount, flightCount int64
		today := time.Now().Truncate(24 * time.Hour)
		tomorrow := today.Add(48 * time.Hour)

		db.DB.Model(&models.TrainBooking{}).
			Joins("JOIN train_schedules ts ON ts.id = train_bookings.schedule_id").
			Where("train_bookings.user_id = ? AND train_bookings.status = 'confirmed'", s.UserID).
			Where("ts.journey_date >= ? AND ts.journey_date < ?", today, tomorrow).
			Count(&trainCount)

		db.DB.Model(&models.FlightBooking{}).
			Joins("JOIN flight_schedules fs ON fs.id = flight_bookings.schedule_id").
			Where("flight_bookings.user_id = ? AND flight_bookings.status = 'confirmed'", s.UserID).
			Where("fs.journey_date >= ? AND fs.journey_date < ?", today, tomorrow).
			Count(&flightCount)

		name := user.FullName
		if name == "" {
			name = "traveller"
		}

		msg := fmt.Sprintf("Good morning, %s! 🌅 IndieYatra daily briefing:\n", name)
		if trainCount > 0 {
			msg += fmt.Sprintf("• You have %d train booking(s) in the next 48 hours.\n", trainCount)
		}
		if flightCount > 0 {
			msg += fmt.Sprintf("• You have %d flight(s) in the next 48 hours.\n", flightCount)
		}
		if trainCount == 0 && flightCount == 0 {
			msg += "• No upcoming trips in the next 48 hours. Planning your next adventure?\n"
		}
		msg += "Open IndieYatra for full details."

		_ = emailSvc.SendWhatsApp(user.Phone, msg)
	}
}

// ─── Review Prompt Worker ──────────────────────────────────────────────────────
// Runs every 6 hours. For confirmed train/flight/bus bookings whose journey date
// passed 4–48 hours ago, creates a "rate your trip" ConciergeAlert (once per booking).

func reviewPromptWorker(_ *services.EmailService) {
	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()
	for range ticker.C {
		runReviewPrompts()
	}
}

func runReviewPrompts() {
	window := time.Now().Add(-48 * time.Hour)
	cutoff := time.Now().Add(-4 * time.Hour)

	// Train bookings
	var trainBookings []models.TrainBooking
	db.DB.Preload("Schedule.Train").Preload("Schedule.FromStation").Preload("Schedule.ToStation").
		Where("status = 'confirmed'").
		Joins("JOIN train_schedules ts ON ts.id = train_bookings.schedule_id").
		Where("ts.journey_date >= ? AND ts.journey_date <= ?", window, cutoff).
		Find(&trainBookings)

	for _, b := range trainBookings {
		createAlertIfNotExists(b.UserID.String(), "review",
			fmt.Sprintf("How was your journey on %s?", b.Schedule.Train.Name),
			fmt.Sprintf("You recently travelled %s → %s. Rate your experience and help other travellers.",
				b.Schedule.FromStation.City, b.Schedule.ToStation.City),
			"/trips", "Rate Trip", 3)
	}

	// Flight bookings
	var flightBookings []models.FlightBooking
	db.DB.Preload("Schedule.Airline").Preload("Schedule.FromAirport").Preload("Schedule.ToAirport").
		Where("status = 'confirmed'").
		Joins("JOIN flight_schedules fs ON fs.id = flight_bookings.schedule_id").
		Where("fs.journey_date >= ? AND fs.journey_date <= ?", window, cutoff).
		Find(&flightBookings)

	for _, b := range flightBookings {
		createAlertIfNotExists(b.UserID.String(), "review",
			fmt.Sprintf("How was your %s flight?", b.Schedule.Airline.Name),
			fmt.Sprintf("You recently flew %s → %s. Share your rating.",
				b.Schedule.FromAirport.City, b.Schedule.ToAirport.City),
			"/trips", "Rate Flight", 3)
	}

	// Bus bookings
	var busBookings []models.Booking
	db.DB.Preload("Schedule.Route.FromCity").Preload("Schedule.Route.ToCity").
		Where("status = 'confirmed'").
		Where("schedules.departure_at >= ? AND schedules.departure_at <= ?", window, cutoff).
		Joins("JOIN schedules ON schedules.id = bookings.schedule_id").
		Find(&busBookings)

	for _, b := range busBookings {
		fromName := b.Schedule.Route.FromCity.Name
		toName := b.Schedule.Route.ToCity.Name
		if fromName == "" || toName == "" {
			continue
		}
		createAlertIfNotExists(b.UserID.String(), "review",
			"How was your bus journey?",
			fmt.Sprintf("You recently travelled %s → %s. Rate the operator.", fromName, toName),
			"/trips", "Rate Journey", 3)
	}
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

// createAlertIfNotExists creates a ConciergeAlert only if no identical unread
// alert already exists for this user (prevents duplicate alerts on every tick).
func createAlertIfNotExists(userIDStr, alertType, title, body, actionURL, actionLabel string, priority int) {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return
	}

	var count int64
	db.DB.Model(&models.ConciergeAlert{}).
		Where("user_id = ? AND type = ? AND title = ? AND is_dismissed = false", userID, alertType, title).
		Where("created_at > ?", time.Now().Add(-6*time.Hour)).
		Count(&count)

	if count > 0 {
		return // already created recently
	}

	db.DB.Create(&models.ConciergeAlert{
		UserID:      userID,
		Type:        alertType,
		Title:       title,
		Body:        body,
		ActionURL:   actionURL,
		ActionLabel: actionLabel,
		Priority:    priority,
	})

	// Push live to the user's WebSocket room so the badge updates instantly
	websocket.GlobalHub.EmitConciergeAlert(userIDStr, alertType, title, body)
}
