package api

import (
	"net/http"
	"sort"

	"github.com/anuragh/indieyatra/backend/internal/auth"
	"github.com/anuragh/indieyatra/backend/internal/db"
	"github.com/anuragh/indieyatra/backend/internal/models"
	"github.com/labstack/echo/v4"
)

type UnifiedTrip struct {
	ID          string  `json:"id"`
	Vertical    string  `json:"vertical"` // bus/train/flight/hotel
	BookingRef  string  `json:"booking_ref"`
	Status      string  `json:"status"`
	TotalAmount float64 `json:"total_amount"`
	FromName    string  `json:"from_name"`
	ToName      string  `json:"to_name"`
	TravelDate  string  `json:"travel_date"`
	Description string  `json:"description"`
	CreatedAt   string  `json:"created_at"`
}

// GET /api/trips/all — all bookings across all verticals for the current user
func (h *Handlers) AllTrips(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	var trips []UnifiedTrip

	// Bus bookings
	var busBookings []models.Booking
	db.DB.Preload("Schedule.Route.FromCity").
		Preload("Schedule.Route.ToCity").
		Preload("Schedule.Operator").
		Where("user_id = ?", uid).
		Order("created_at DESC").
		Find(&busBookings)
	for _, b := range busBookings {
		t := UnifiedTrip{
			ID:          b.ID.String(),
			Vertical:    "bus",
			BookingRef:  b.BookingRef,
			Status:      b.Status,
			TotalAmount: b.TotalAmount,
			FromName:    b.Schedule.Route.FromCity.Name,
			ToName:      b.Schedule.Route.ToCity.Name,
			Description: b.Schedule.Operator.Name,
			CreatedAt:   b.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
		if !b.Schedule.DepartureAt.IsZero() {
			t.TravelDate = b.Schedule.DepartureAt.Format("2006-01-02")
		}
		trips = append(trips, t)
	}

	// Train bookings
	var trainBookings []models.TrainBooking
	db.DB.Preload("Schedule.Train").
		Preload("Schedule.FromStation").
		Preload("Schedule.ToStation").
		Where("user_id = ?", uid).
		Order("created_at DESC").
		Find(&trainBookings)
	for _, b := range trainBookings {
		t := UnifiedTrip{
			ID:          b.ID.String(),
			Vertical:    "train",
			BookingRef:  b.BookingRef,
			Status:      b.Status,
			TotalAmount: b.TotalAmount,
			FromName:    b.Schedule.FromStation.City,
			ToName:      b.Schedule.ToStation.City,
			Description: b.Schedule.Train.Name + " · " + b.Class,
			CreatedAt:   b.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
		if !b.Schedule.JourneyDate.IsZero() {
			t.TravelDate = b.Schedule.JourneyDate.Format("2006-01-02")
		}
		trips = append(trips, t)
	}

	// Flight bookings
	var flightBookings []models.FlightBooking
	db.DB.Preload("Schedule.Airline").
		Preload("Schedule.FromAirport").
		Preload("Schedule.ToAirport").
		Where("user_id = ?", uid).
		Order("created_at DESC").
		Find(&flightBookings)
	for _, b := range flightBookings {
		t := UnifiedTrip{
			ID:          b.ID.String(),
			Vertical:    "flight",
			BookingRef:  b.BookingRef,
			Status:      b.Status,
			TotalAmount: b.TotalAmount,
			FromName:    b.Schedule.FromAirport.City,
			ToName:      b.Schedule.ToAirport.City,
			Description: b.Schedule.Airline.Name + " · " + b.Schedule.FlightNumber,
			CreatedAt:   b.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
		if !b.Schedule.JourneyDate.IsZero() {
			t.TravelDate = b.Schedule.JourneyDate.Format("2006-01-02")
		}
		trips = append(trips, t)
	}

	// Hotel bookings
	var hotelBookings []models.HotelBooking
	db.DB.Preload("Hotel").
		Preload("Room").
		Where("user_id = ?", uid).
		Order("created_at DESC").
		Find(&hotelBookings)
	for _, b := range hotelBookings {
		t := UnifiedTrip{
			ID:          b.ID.String(),
			Vertical:    "hotel",
			BookingRef:  b.BookingRef,
			Status:      b.Status,
			TotalAmount: b.TotalAmount,
			CreatedAt:   b.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}
		if !b.CheckIn.IsZero() {
			t.TravelDate = b.CheckIn.Format("2006-01-02")
		}
		if b.Hotel != nil {
			t.FromName = b.Hotel.Name
			t.ToName = b.Hotel.City
		}
		if b.Room != nil {
			t.Description = b.Room.RoomType
		}
		trips = append(trips, t)
	}

	// Sort all trips by created_at descending
	sort.Slice(trips, func(i, j int) bool {
		return trips[i].CreatedAt > trips[j].CreatedAt
	})

	if trips == nil {
		trips = []UnifiedTrip{}
	}
	return c.JSON(http.StatusOK, trips)
}

// GET /api/rewards/me — current user's rewards summary
func (h *Handlers) UserRewards(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var user models.User
	if err := db.DB.Where("id = ?", uid).First(&user).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "user not found"})
	}

	var busCount, trainCount, flightCount, hotelCount int64
	db.DB.Model(&models.Booking{}).Where("user_id = ? AND status = 'confirmed'", uid).Count(&busCount)
	db.DB.Model(&models.TrainBooking{}).Where("user_id = ? AND status = 'confirmed'", uid).Count(&trainCount)
	db.DB.Model(&models.FlightBooking{}).Where("user_id = ? AND status = 'confirmed'", uid).Count(&flightCount)
	db.DB.Model(&models.HotelBooking{}).Where("user_id = ? AND status = 'confirmed'", uid).Count(&hotelCount)

	points := user.RewardPoints
	tier, nextTier := "Bronze", "Silver"
	nextPoints := 500
	switch {
	case points >= 5000:
		tier, nextTier, nextPoints = "Platinum", "", 0
	case points >= 2000:
		tier, nextTier, nextPoints = "Gold", "Platinum", 5000
	case points >= 500:
		tier, nextTier, nextPoints = "Silver", "Gold", 2000
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"points":           points,
		"tier":             tier,
		"next_tier":        nextTier,
		"next_tier_points": nextPoints,
		"total_bookings":   busCount + trainCount + flightCount + hotelCount,
		"bus_bookings":     busCount,
		"train_bookings":   trainCount,
		"flight_bookings":  flightCount,
		"hotel_bookings":   hotelCount,
	})
}
