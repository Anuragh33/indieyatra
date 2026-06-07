package api

import (
	"net/http"
	"time"

	"github.com/anuragh/indieyatra/backend/internal/auth"
	"github.com/anuragh/indieyatra/backend/internal/db"
	"github.com/anuragh/indieyatra/backend/internal/models"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// GetSchedule returns a schedule with all relations preloaded (operator, bus, route, cities)
func (h *Handlers) GetSchedule(c echo.Context) error {
	id := c.Param("id")
	var s models.Schedule
	if err := db.DB.
		Preload("Route.FromCity").
		Preload("Route.ToCity").
		Preload("Bus.Operator").
		Preload("Operator").
		First(&s, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "schedule not found"})
	}
	return c.JSON(http.StatusOK, s)
}

// GetTracking returns the current GPS position of a bus on a given schedule.
// If the bus is currently in transit (departed but not yet arrived), the
// position is computed by linear interpolation between from/to city coords.
// If the bus hasn't departed yet, position = from city. If already arrived,
// position = to city.
func (h *Handlers) GetTracking(c echo.Context) error {
	id := c.Param("id")
	var s models.Schedule
	if err := db.DB.Preload("Route").First(&s, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "schedule not found"})
	}
	var fromCity, toCity models.City
	db.DB.First(&fromCity, "id = ?", s.Route.FromCityID)
	db.DB.First(&toCity, "id = ?", s.Route.ToCityID)

	now := time.Now()
	var lat, lng, progress float64
	var status string
	switch {
	case now.Before(s.DepartureAt):
		lat, lng = fromCity.Latitude, fromCity.Longitude
		progress = 0
		status = "not_started"
	case now.After(s.ArrivalAt):
		lat, lng = toCity.Latitude, toCity.Longitude
		progress = 1
		status = "arrived"
	default:
		total := float64(s.ArrivalAt.Sub(s.DepartureAt))
		elapsed := float64(now.Sub(s.DepartureAt))
		progress = elapsed / total
		lat = fromCity.Latitude + (toCity.Latitude-fromCity.Latitude)*progress
		lng = fromCity.Longitude + (toCity.Longitude-fromCity.Longitude)*progress
		status = "in_transit"
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"schedule_id": s.ID,
		"lat":         lat,
		"lng":         lng,
		"progress":    progress,
		"status":      status,
		"departed_at": s.DepartureAt,
		"arrives_at":  s.ArrivalAt,
		"from_city":   fromCity.Name,
		"to_city":     toCity.Name,
		"timestamp":   now,
	})
}

// ListBusReviews returns reviews for a given bus/operator
func (h *Handlers) CreateReview(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var body struct {
		OperatorID string `json:"operator_id"`
		ScheduleID string `json:"schedule_id"`
		Rating     int    `json:"rating"`
		Title      string `json:"title"`
		Comment    string `json:"comment"`
	}
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	if body.Rating < 1 || body.Rating > 5 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "rating must be 1-5"})
	}
	userUUID, _ := uuid.Parse(uid)
	opUUID, _ := uuid.Parse(body.OperatorID)
	review := models.Review{
		UserID:     userUUID,
		OperatorID: opUUID,
		Rating:     body.Rating,
		Title:      body.Title,
		Comment:    body.Comment,
		IsVerified: true,
	}
	if body.ScheduleID != "" {
		sid, err := uuid.Parse(body.ScheduleID)
		if err == nil {
			review.ScheduleID = &sid
		}
	}
	if err := db.DB.Create(&review).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to save review"})
	}
	db.DB.Preload("User").First(&review, review.ID)
	return c.JSON(http.StatusCreated, review)
}

func (h *Handlers) ListBusReviews(c echo.Context) error {
	operatorID := c.QueryParam("operator_id")
	var reviews []models.Review
	q := db.DB.Preload("User").Order("created_at DESC").Limit(50)
	if operatorID != "" {
		q = q.Where("operator_id = ?", operatorID)
	}
	q.Find(&reviews)
	return c.JSON(http.StatusOK, reviews)
}

// PriceHistory returns the price history for a route (last 30 days)
func (h *Handlers) PriceHistory(c echo.Context) error {
	routeID := c.QueryParam("route_id")
	var hist []models.PriceHistory
	q := db.DB.Order("date ASC").Limit(30)
	if routeID != "" {
		q = q.Where("route_id = ?", routeID)
	}
	q.Find(&hist)
	return c.JSON(http.StatusOK, hist)
}

// UpdateProfile updates the authenticated user's profile fields
func (h *Handlers) UpdateProfile(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var body struct {
		FullName string `json:"full_name"`
		Phone    string `json:"phone"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	updates := map[string]interface{}{}
	if body.FullName != "" {
		updates["full_name"] = body.FullName
	}
	if body.Phone != "" {
		updates["phone"] = body.Phone
	}
	if body.AvatarURL != "" {
		updates["avatar_url"] = body.AvatarURL
	}
	if len(updates) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "no fields to update"})
	}
	if err := db.DB.Model(&models.User{}).Where("id = ?", uid).Updates(updates).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "update failed"})
	}
	var user models.User
	db.DB.Where("id = ?", uid).First(&user)
	return c.JSON(http.StatusOK, user)
}

// ListPaymentMethods returns the saved payment methods for the authenticated user
func (h *Handlers) ListPaymentMethods(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var methods []models.SavedPaymentMethod
	db.DB.Where("user_id = ?", uid).Order("is_default DESC, created_at DESC").Find(&methods)
	return c.JSON(http.StatusOK, methods)
}

// AddPaymentMethod saves a new payment method for the authenticated user
func (h *Handlers) AddPaymentMethod(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var body struct {
		Type    string `json:"type"`
		Label   string `json:"label"`
		Network string `json:"network"`
	}
	if err := c.Bind(&body); err != nil || body.Label == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "label required"})
	}
	userUUID, _ := uuid.Parse(uid)
	m := models.SavedPaymentMethod{UserID: userUUID, Type: body.Type, Label: body.Label, Network: body.Network}
	if err := db.DB.Create(&m).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "create failed"})
	}
	return c.JSON(http.StatusCreated, m)
}

// DeletePaymentMethod removes a saved payment method
func (h *Handlers) DeletePaymentMethod(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	id := c.Param("id")
	result := db.DB.Where("id = ? AND user_id = ?", id, uid).Delete(&models.SavedPaymentMethod{})
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "not found"})
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "deleted"})
}
