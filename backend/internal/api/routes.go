package api

import (
	"github.com/anuragh/indiebus/backend/internal/auth"
	"github.com/labstack/echo/v4"
)

func RegisterRoutes(e *echo.Echo, h *Handlers) {
	// Public
	e.GET("/api/health", func(c echo.Context) error {
		return c.JSON(200, map[string]string{"status": "ok", "service": "indiebus"})
	})
	e.POST("/api/auth/register", h.Register)
	e.POST("/api/auth/login", h.Login)
	e.GET("/api/auth/google", h.GoogleLogin)
	e.GET("/api/auth/google/callback", h.GoogleCallback)
	e.POST("/api/auth/refresh-token", h.RefreshToken)

	// Search — public (uses optional auth)
	e.GET("/api/search/buses", h.SearchBuses, auth.Optional())
	e.GET("/api/search/suggestions", h.SearchSuggestions)
	e.GET("/api/routes/popular", h.PopularRoutes)
	e.GET("/api/destinations/top", h.TopDestinations)
	e.GET("/api/buses/:id", h.GetBus)
	e.GET("/api/buses/:id/seats", h.GetBusSeats)
	e.GET("/api/schedules/:id", h.GetSchedule)
	e.GET("/api/tracking/:id", h.GetTracking)
	e.GET("/api/reviews", h.ListBusReviews)
	e.GET("/api/price-history", h.PriceHistory)

	// AI Planner — public
	e.POST("/api/ai/plan-trip", h.PlanTrip)
	e.GET("/api/ai/suggestions", h.PlanTrip) // alias

	// WebSocket (handled separately via http.Handler)
	// Mounted in main.go

	// Train vertical — public
	e.GET("/api/trains/stations/autocomplete", h.TrainStationsAutocomplete)
	e.GET("/api/trains/search", h.SearchTrains)
	e.GET("/api/trains/schedule/:id", h.GetTrainSchedule)
	e.GET("/api/trains/pnr/:pnr", h.GetPNRStatus)

	// Flight vertical — public
	e.GET("/api/flights/airports/autocomplete", h.FlightAirportsAutocomplete)
	e.GET("/api/flights/search", h.SearchFlights)
	e.GET("/api/flights/:id", h.GetFlight)

	// Hotel vertical — public
	e.GET("/api/hotels/cities", h.HotelCities)
	e.GET("/api/hotels/search", h.SearchHotels)
	e.GET("/api/hotels/:id", h.GetHotel)

	// Protected
	authed := e.Group("/api", auth.Middleware())
	authed.GET("/auth/me", h.Me)
	authed.POST("/auth/logout", h.Logout)
	authed.PUT("/auth/change-password", h.ChangePassword)

	// Bookings & Payments
	authed.POST("/bookings/create", h.CreateBooking)
	authed.GET("/bookings/:id", h.GetBooking)
	authed.GET("/bookings/:id/ticket", h.DownloadTicket)
	authed.GET("/bookings/user/me", h.ListUserBookings)
	authed.POST("/payments/initiate", h.InitPayment)
	authed.POST("/payments/verify", h.VerifyPayment)

	// Seat locks (called by frontend during seat selection)
	authed.POST("/seats/lock", h.LockSeat)
	authed.DELETE("/seats/release", h.ReleaseSeat)

	// Alerts
	authed.POST("/alerts/create", h.CreateAlert)
	authed.GET("/alerts/user/me", h.ListAlerts)
	authed.PUT("/alerts/:id/toggle", h.ToggleAlert)
	authed.DELETE("/alerts/:id", h.DeleteAlert)

	// Reviews
	authed.POST("/reviews", h.CreateReview)

	// Train bookings — auth required
	authed.POST("/trains/bookings/create", h.CreateTrainBooking)
	authed.GET("/trains/bookings/user/me", h.ListUserTrainBookings)
	authed.GET("/trains/bookings/:id", h.GetTrainBooking)

	// Flight bookings — auth required
	authed.POST("/flights/bookings/create", h.CreateFlightBooking)
	authed.GET("/flights/bookings/user/me", h.ListUserFlightBookings)
	authed.GET("/flights/bookings/:id", h.GetFlightBooking)

	// Hotel bookings — auth required
	authed.POST("/hotels/bookings/create", h.CreateHotelBooking)
	authed.GET("/hotels/bookings/user/me", h.ListUserHotelBookings)
	authed.GET("/hotels/bookings/:id", h.GetHotelBooking)

	// Concierge — auth required
	authed.POST("/concierge/chat", h.ConciergeChat)
	authed.GET("/concierge/feed", h.ConciergeFeed)
	authed.GET("/concierge/briefing", h.ConciergeBriefing)
	authed.GET("/concierge/settings", h.GetConciergeSettings)
	authed.POST("/concierge/settings", h.SaveConciergeSettings)
	authed.POST("/concierge/dismiss/:alertId", h.DismissAlert)
	authed.POST("/concierge/read/:alertId", h.MarkAlertRead)

	// Unified trips + rewards
	authed.GET("/trips/all", h.AllTrips)
	authed.GET("/rewards/me", h.UserRewards)

	// Multimodal optimizer — public
	e.POST("/api/optimize/routes", h.OptimizeRoutes)
	e.GET("/api/optimize/popular-combinations", h.PopularCombinations)

	// Voice search — public
	e.POST("/api/voice/parse", h.ParseVoice)

	// Wishlist
	authed.POST("/wishlist/add", h.AddWishlist)
	authed.GET("/wishlist/user/me", h.ListWishlist)
	authed.DELETE("/wishlist/:id", h.DeleteWishlist)

	// Profile
	authed.GET("/users/me", h.GetProfile)
	authed.PUT("/users/me", h.UpdateProfile)
	authed.PUT("/users/preferences", h.UpdatePreferences)

	// Saved payment methods
	authed.GET("/payment-methods", h.ListPaymentMethods)
	authed.POST("/payment-methods", h.AddPaymentMethod)
	authed.DELETE("/payment-methods/:id", h.DeletePaymentMethod)
}
