package api

import (
	"net/http"
	"time"

	"github.com/anuragh/indiebus/backend/internal/auth"
	"github.com/anuragh/indiebus/backend/internal/db"
	"github.com/anuragh/indiebus/backend/internal/models"
	"github.com/anuragh/indiebus/backend/internal/services"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type LockSeatRequest struct {
	ScheduleID string `json:"schedule_id" validate:"required"`
	SeatID     string `json:"seat_id" validate:"required"`
}

func (h *Handlers) LockSeat(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "login to lock seats"})
	}
	var req LockSeatRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	if err := db.LockSeat(c.Request().Context(), req.ScheduleID, uid, req.SeatID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "lock failed"})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":     "locked",
		"seat_id":    req.SeatID,
		"ttl_seconds": 300,
	})
}

type ReleaseSeatRequest struct {
	ScheduleID string `json:"schedule_id" validate:"required"`
	SeatID     string `json:"seat_id" validate:"required"`
}

func (h *Handlers) ReleaseSeat(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var req ReleaseSeatRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	if err := db.ReleaseSeat(c.Request().Context(), req.ScheduleID, req.SeatID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "release failed"})
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "released"})
}

type CreateAlertRequest struct {
	FromCityID     string  `json:"from_city_id" validate:"required"`
	ToCityID       string  `json:"to_city_id" validate:"required"`
	DateFrom       string  `json:"date_from" validate:"required"`
	DateTo         string  `json:"date_to" validate:"required"`
	PriceThreshold float64 `json:"price_threshold"`
}

func (h *Handlers) CreateAlert(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var req CreateAlertRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	df, _ := time.Parse("2006-01-02", req.DateFrom)
	dt, _ := time.Parse("2006-01-02", req.DateTo)

	userUUID, _ := uuid.Parse(uid)
	fromUUID, _ := uuid.Parse(req.FromCityID)
	toUUID, _ := uuid.Parse(req.ToCityID)

	alert := models.PriceAlert{
		UserID:         userUUID,
		FromCityID:     fromUUID,
		ToCityID:       toUUID,
		DateFrom:       df,
		DateTo:         dt,
		PriceThreshold: req.PriceThreshold,
		IsActive:       true,
	}
	db.DB.Create(&alert)
	return c.JSON(http.StatusCreated, alert)
}

func (h *Handlers) ListAlerts(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	userUUID, _ := uuid.Parse(uid)
	var alerts []models.PriceAlert
	db.DB.Preload("FromCity").Preload("ToCity").
		Where("user_id = ?", userUUID).
		Order("created_at DESC").
		Find(&alerts)

	// Enrich each alert with the price history of its route (last 30 days)
	type EnrichedAlert struct {
		models.PriceAlert
		Sparkline []models.PriceHistory `json:"sparkline"`
	}
	out := make([]EnrichedAlert, 0, len(alerts))
	for _, a := range alerts {
		var route models.Route
		if err := db.DB.Where("from_city_id = ? AND to_city_id = ?", a.FromCityID, a.ToCityID).First(&route).Error; err != nil {
			out = append(out, EnrichedAlert{PriceAlert: a})
			continue
		}
		var hist []models.PriceHistory
		db.DB.Where("route_id = ?", route.ID).Order("date ASC").Limit(30).Find(&hist)
		out = append(out, EnrichedAlert{PriceAlert: a, Sparkline: hist})
	}
	return c.JSON(http.StatusOK, out)
}

func (h *Handlers) ToggleAlert(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	id := c.Param("id")
	var alert models.PriceAlert
	if err := db.DB.Where("id = ? AND user_id = ?", id, uid).First(&alert).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "alert not found"})
	}
	alert.IsActive = !alert.IsActive
	db.DB.Save(&alert)
	return c.JSON(http.StatusOK, alert)
}

func (h *Handlers) DeleteAlert(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	id := c.Param("id")
	if err := db.DB.Where("id = ? AND user_id = ?", id, uid).Delete(&models.PriceAlert{}).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "delete failed"})
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "deleted"})
}

type AddWishlistRequest struct {
	CityID      string  `json:"city_id" validate:"required"`
	Notes       string  `json:"notes"`
	TargetPrice float64 `json:"target_price"`
}

func (h *Handlers) AddWishlist(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var req AddWishlistRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	userUUID, _ := uuid.Parse(uid)
	cityUUID, _ := uuid.Parse(req.CityID)
	w := models.Wishlist{
		UserID: userUUID, CityID: cityUUID,
		Notes: req.Notes, TargetPrice: req.TargetPrice,
	}
	db.DB.Create(&w)
	return c.JSON(http.StatusCreated, w)
}

func (h *Handlers) ListWishlist(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	userUUID, _ := uuid.Parse(uid)
	var items []models.Wishlist
	db.DB.Preload("City").Where("user_id = ?", userUUID).Find(&items)
	return c.JSON(http.StatusOK, items)
}

func (h *Handlers) DeleteWishlist(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	id := c.Param("id")
	if err := db.DB.Where("id = ? AND user_id = ?", id, uid).Delete(&models.Wishlist{}).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "delete failed"})
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "deleted"})
}

type PlanTripRequest struct {
	Prompt       string `json:"prompt"`
	FromCity     string `json:"from_city"`
	ToCity       string `json:"to_city"`
	DurationDays int    `json:"duration_days"`
	BudgetINR    int    `json:"budget_inr"`
	Month        string `json:"month"`
}

func (h *Handlers) PlanTrip(c echo.Context) error {
	var req PlanTripRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	if req.DurationDays == 0 {
		req.DurationDays = 5
	}
	if req.BudgetINR == 0 {
		req.BudgetINR = 3000
	}
	if req.Month == "" {
		req.Month = "July"
	}
	if req.ToCity == "" {
		req.ToCity = "Himachal"
	}

	out, err := h.AISvc.PlanTrip(c.Request().Context(), services.PlanInput{
		Prompt:       req.Prompt,
		FromCity:     req.FromCity,
		ToCity:       req.ToCity,
		DurationDays: req.DurationDays,
		BudgetINR:    req.BudgetINR,
		Month:        req.Month,
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, out)
}

func (h *Handlers) GetProfile(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var user models.User
	if err := db.DB.Where("id = ?", uid).First(&user).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "user not found"})
	}

	// Count trips
	var tripCount int64
	db.DB.Model(&models.Booking{}).Where("user_id = ? AND status = ?", uid, "completed").Count(&tripCount)

	var wishlistCount int64
	db.DB.Model(&models.Wishlist{}).Where("user_id = ?", uid).Count(&wishlistCount)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"user":           user,
		"trips_count":    tripCount,
		"wishlist_count": wishlistCount,
	})
}

type UpdatePreferencesRequest struct {
	SeatType        string `json:"seat_type"`
	BerthPreference string `json:"berth_preference"`
	MealPreference  string `json:"meal_preference"`
	PreferredOps    string `json:"preferred_ops"`
	Language        string `json:"language"`
}

func (h *Handlers) UpdatePreferences(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var req UpdatePreferencesRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	if err := db.DB.Model(&models.User{}).Where("id = ?", uid).Updates(map[string]interface{}{
		"pref_seat_type":         req.SeatType,
		"pref_berth_preference":  req.BerthPreference,
		"pref_meal_preference":   req.MealPreference,
		"pref_preferred_ops":     req.PreferredOps,
		"pref_language":          req.Language,
	}).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "update failed"})
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "updated"})
}
