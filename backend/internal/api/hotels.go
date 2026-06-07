package api

import (
	"fmt"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/anuragh/indieyatra/backend/internal/auth"
	"github.com/anuragh/indieyatra/backend/internal/db"
	"github.com/anuragh/indieyatra/backend/internal/models"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// GET /api/hotels/cities — unique cities with hotel count
func (h *Handlers) HotelCities(c echo.Context) error {
	type cityResult struct {
		City        string `json:"city"`
		State       string `json:"state"`
		HotelCount  int    `json:"hotel_count"`
		MinPrice    float64 `json:"min_price"`
	}
	var results []cityResult
	db.DB.Raw(`
		SELECT h.city, h.state, COUNT(DISTINCT h.id) AS hotel_count,
		       COALESCE(MIN(r.price_per_night), 0) AS min_price
		FROM hotels h
		LEFT JOIN hotel_rooms r ON r.hotel_id = h.id AND r.is_active = true AND r.deleted_at IS NULL
		WHERE h.deleted_at IS NULL AND h.is_active = true
		GROUP BY h.city, h.state
		ORDER BY hotel_count DESC
	`).Scan(&results)
	return c.JSON(http.StatusOK, results)
}

// GET /api/hotels/search?city=&check_in=&check_out=&guests=&stars=&property_type=&sort=
func (h *Handlers) SearchHotels(c echo.Context) error {
	city := strings.TrimSpace(c.QueryParam("city"))
	checkIn := c.QueryParam("check_in")
	checkOut := c.QueryParam("check_out")
	stars := c.QueryParam("stars")      // comma-separated: 3,4,5
	propType := c.QueryParam("property_type")
	sortBy := c.QueryParam("sort") // price_asc,price_desc,rating,reviews

	query := db.DB.Model(&models.Hotel{}).Where("is_active = true")
	if city != "" {
		query = query.Where("LOWER(city) = ?", strings.ToLower(city))
	}
	if stars != "" {
		starNums := strings.Split(stars, ",")
		query = query.Where("star_rating IN ?", starNums)
	}
	if propType != "" {
		query = query.Where("LOWER(property_type) = ?", strings.ToLower(propType))
	}

	var hotels []models.Hotel
	if err := query.Find(&hotels).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	// Compute nights
	nights := 1
	var ciDate, coDate time.Time
	if checkIn != "" && checkOut != "" {
		ci, err1 := time.Parse("2006-01-02", checkIn)
		co, err2 := time.Parse("2006-01-02", checkOut)
		if err1 == nil && err2 == nil && co.After(ci) {
			ciDate = ci
			coDate = co
			nights = int(math.Ceil(co.Sub(ci).Hours() / 24))
		}
	}
	_ = ciDate
	_ = coDate

	type hotelResult struct {
		models.Hotel
		MinPricePerNight float64      `json:"min_price_per_night"`
		Rooms            []models.HotelRoom `json:"rooms"`
	}

	var results []hotelResult
	for _, hotel := range hotels {
		var rooms []models.HotelRoom
		db.DB.Where("hotel_id = ? AND is_active = true", hotel.ID).Find(&rooms)

		minPrice := 0.0
		for i, r := range rooms {
			if i == 0 || r.PricePerNight < minPrice {
				minPrice = r.PricePerNight
			}
		}
		results = append(results, hotelResult{
			Hotel:            hotel,
			MinPricePerNight: minPrice * float64(nights),
			Rooms:            rooms,
		})
	}

	// Sort
	switch sortBy {
	case "price_asc":
		for i := 1; i < len(results); i++ {
			for j := i; j > 0 && results[j].MinPricePerNight < results[j-1].MinPricePerNight; j-- {
				results[j], results[j-1] = results[j-1], results[j]
			}
		}
	case "price_desc":
		for i := 1; i < len(results); i++ {
			for j := i; j > 0 && results[j].MinPricePerNight > results[j-1].MinPricePerNight; j-- {
				results[j], results[j-1] = results[j-1], results[j]
			}
		}
	case "rating":
		for i := 1; i < len(results); i++ {
			for j := i; j > 0 && results[j].Rating > results[j-1].Rating; j-- {
				results[j], results[j-1] = results[j-1], results[j]
			}
		}
	case "reviews":
		for i := 1; i < len(results); i++ {
			for j := i; j > 0 && results[j].TotalReviews > results[j-1].TotalReviews; j-- {
				results[j], results[j-1] = results[j-1], results[j]
			}
		}
	default:
		// default: rating desc
		for i := 1; i < len(results); i++ {
			for j := i; j > 0 && results[j].Rating > results[j-1].Rating; j-- {
				results[j], results[j-1] = results[j-1], results[j]
			}
		}
	}

	return c.JSON(http.StatusOK, results)
}

// GET /api/hotels/:id
func (h *Handlers) GetHotel(c echo.Context) error {
	idStr := c.Param("id")
	hotelID, err := uuid.Parse(idStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid hotel id"})
	}

	var hotel models.Hotel
	if err := db.DB.First(&hotel, "id = ?", hotelID).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "hotel not found"})
	}

	var rooms []models.HotelRoom
	db.DB.Where("hotel_id = ? AND is_active = true", hotelID).Find(&rooms)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"hotel": hotel,
		"rooms": rooms,
	})
}

// POST /api/hotels/bookings/create (auth required)
func (h *Handlers) CreateHotelBooking(c echo.Context) error {
	userIDRaw := c.Get(auth.UserIDKey)
	userIDStr, ok := userIDRaw.(string)
	if !ok || userIDStr == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid user"})
	}

	var req struct {
		HotelID         string `json:"hotel_id"`
		RoomID          string `json:"room_id"`
		CheckIn         string `json:"check_in"`
		CheckOut        string `json:"check_out"`
		Guests          int    `json:"guests"`
		RoomCount       int    `json:"room_count"`
		GuestName       string `json:"guest_name"`
		GuestEmail      string `json:"guest_email"`
		GuestPhone      string `json:"guest_phone"`
		SpecialRequests string `json:"special_requests"`
		PaymentMethod   string `json:"payment_method"`
		EarlyCheckin    bool   `json:"early_checkin"`
		LateCheckout    bool   `json:"late_checkout"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}

	hotelID, err := uuid.Parse(req.HotelID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid hotel_id"})
	}
	var hotel models.Hotel
	if err := db.DB.First(&hotel, "id = ?", hotelID).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "hotel not found"})
	}
	roomID, err := uuid.Parse(req.RoomID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid room_id"})
	}

	ci, err := time.Parse("2006-01-02", req.CheckIn)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid check_in date"})
	}
	co, err := time.Parse("2006-01-02", req.CheckOut)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid check_out date"})
	}
	if !co.After(ci) {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "check_out must be after check_in"})
	}

	nights := int(math.Ceil(co.Sub(ci).Hours() / 24))
	if req.RoomCount <= 0 {
		req.RoomCount = 1
	}
	if req.Guests <= 0 {
		req.Guests = 2
	}

	var room models.HotelRoom
	if err := db.DB.First(&room, "id = ?", roomID).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "room not found"})
	}
	if room.HotelID != hotelID {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "room does not belong to hotel"})
	}
	if room.AvailableRooms < req.RoomCount {
		return c.JSON(http.StatusConflict, map[string]string{"error": "not enough rooms available"})
	}

	roomPrice := room.PricePerNight * float64(nights) * float64(req.RoomCount)
	taxAmount := math.Round(roomPrice*room.TaxPercent/100*100) / 100
	platformFee := 250.0
	total := math.Round((roomPrice+taxAmount+platformFee)*100) / 100

	ref := fmt.Sprintf("IH%s", strings.ToUpper(uuid.New().String()[:8]))

	booking := models.HotelBooking{
		UserID:          userID,
		HotelID:         hotelID,
		RoomID:          roomID,
		BookingRef:      ref,
		CheckIn:         ci,
		CheckOut:        co,
		Nights:          nights,
		Guests:          req.Guests,
		RoomCount:       req.RoomCount,
		GuestName:       req.GuestName,
		GuestEmail:      req.GuestEmail,
		GuestPhone:      req.GuestPhone,
		SpecialRequests: req.SpecialRequests,
		Status:          "confirmed",
		RoomPrice:       roomPrice,
		TaxAmount:       taxAmount,
		PlatformFee:     platformFee,
		TotalAmount:     total,
		PaymentMethod:   req.PaymentMethod,
		EarlyCheckin:    req.EarlyCheckin,
		LateCheckout:    req.LateCheckout,
	}

	if err := db.DB.Create(&booking).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to create booking"})
	}

	db.DB.Model(&room).Update("available_rooms", room.AvailableRooms-req.RoomCount)

	go SendHotelBookingNotifications(h.EmailSvc, booking, hotel, room, req.GuestEmail, req.GuestPhone)

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"booking_ref":  ref,
		"status":       "confirmed",
		"check_in":     req.CheckIn,
		"check_out":    req.CheckOut,
		"nights":       nights,
		"room_type":    room.RoomType,
		"room_price":   roomPrice,
		"tax_amount":   taxAmount,
		"platform_fee": platformFee,
		"total_amount": total,
	})
}

// GET /api/hotels/bookings/:id
func (h *Handlers) GetHotelBooking(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	var booking models.HotelBooking
	if err := db.DB.Preload("Hotel").Preload("Room").
		Where("id = ? AND user_id = ?", id, uid).First(&booking).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "booking not found"})
	}
	return c.JSON(http.StatusOK, booking)
}

// GET /api/hotels/bookings/user/me
func (h *Handlers) ListUserHotelBookings(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var bookings []models.HotelBooking
	db.DB.Preload("Hotel").
		Preload("Room").
		Where("user_id = ?", uid).
		Order("created_at DESC").
		Find(&bookings)
	if bookings == nil {
		bookings = []models.HotelBooking{}
	}
	return c.JSON(http.StatusOK, bookings)
}
