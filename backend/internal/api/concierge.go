package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/anuragh/indiebus/backend/internal/auth"
	"github.com/anuragh/indiebus/backend/internal/db"
	"github.com/anuragh/indiebus/backend/internal/models"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// ─── Ollama / OpenAI-compatible chat ──────────────────────────────────────────

type chatMsg struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ollamaReq struct {
	Model    string    `json:"model"`
	Messages []chatMsg `json:"messages"`
	Stream   bool      `json:"stream"`
}

type ollamaResp struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func (h *Handlers) callOllama(messages []chatMsg) (string, error) {
	baseURL := h.OllamaURL
	if baseURL == "" {
		baseURL = "http://localhost:11434"
	}
	model := h.OllamaModel
	if model == "" {
		model = "llama3"
	}

	body, _ := json.Marshal(ollamaReq{
		Model:    model,
		Messages: messages,
		Stream:   false,
	})

	resp, err := http.Post(baseURL+"/v1/chat/completions", "application/json", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("ollama unreachable: %w", err)
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)

	var or ollamaResp
	if err := json.Unmarshal(raw, &or); err != nil || len(or.Choices) == 0 {
		return "", fmt.Errorf("invalid ollama response")
	}
	return or.Choices[0].Message.Content, nil
}

// buildSystemPrompt returns a context-rich system prompt for the concierge.
func buildSystemPrompt(uid string) string {
	now := time.Now().Format("Monday, 02 January 2006, 15:04 IST")

	// Fetch upcoming trips
	var trainBookings []models.TrainBooking
	var flightBookings []models.FlightBooking
	db.DB.Preload("Schedule.Train").Preload("Schedule.FromStation").Preload("Schedule.ToStation").
		Where("user_id = ? AND status = 'confirmed'", uid).
		Where("created_at > ?", time.Now().AddDate(0, -1, 0)).
		Order("created_at DESC").Limit(3).Find(&trainBookings)

	db.DB.Preload("Schedule.Airline").Preload("Schedule.FromAirport").Preload("Schedule.ToAirport").
		Where("user_id = ? AND status = 'confirmed'", uid).
		Where("created_at > ?", time.Now().AddDate(0, -1, 0)).
		Order("created_at DESC").Limit(3).Find(&flightBookings)

	tripCtx := ""
	for _, b := range trainBookings {
		tripCtx += fmt.Sprintf("- Train: %s (%s) PNR %s, %s → %s on %s, Class %s\n",
			b.Schedule.Train.Name, b.Schedule.Train.Number, b.PNR,
			b.Schedule.FromStation.City, b.Schedule.ToStation.City,
			b.Schedule.JourneyDate.Format("02 Jan 2006"), b.Class)
	}
	for _, b := range flightBookings {
		tripCtx += fmt.Sprintf("- Flight: %s %s PNR %s, %s → %s on %s, %s\n",
			b.Schedule.Airline.Name, b.Schedule.FlightNumber, b.PNR,
			b.Schedule.FromAirport.City, b.Schedule.ToAirport.City,
			b.Schedule.JourneyDate.Format("02 Jan 2006"), b.CabinClass)
	}
	if tripCtx == "" {
		tripCtx = "No upcoming trips found."
	}

	return fmt.Sprintf(`You are IndieYatra Concierge, a smart, helpful, and concise travel assistant for IndieYatra — India's travel super-app covering buses, trains, flights, and hotels.

Current date and time: %s

User's recent bookings:
%s

Your role:
- Answer questions about the user's trips, PNR status, train/flight status
- Give travel tips, packing advice, route suggestions
- Alert the user about important travel information
- Help with booking-related queries

Rules:
- Be concise — reply in 2-4 sentences unless a detailed answer is needed
- Use Indian rupee (₹) for prices
- Refer to Indian cities, trains, airlines naturally
- If you don't know something specific (like live delays), say so clearly and suggest how to check
- Keep a warm, friendly, helpful tone`, now, tripCtx)
}

// ─── HTTP Handlers ─────────────────────────────────────────────────────────────

// POST /api/concierge/chat
func (h *Handlers) ConciergeChat(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	var req struct {
		Message   string `json:"message"`
		SessionID string `json:"session_id"`
	}
	if err := c.Bind(&req); err != nil || req.Message == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "message required"})
	}

	// Load recent session history (last 10 messages)
	var history []models.ConciergeChatMessage
	db.DB.Where("user_id = ? AND session_id = ?", uid, req.SessionID).
		Order("created_at ASC").Limit(10).Find(&history)

	// Build messages array
	messages := []chatMsg{{Role: "system", Content: buildSystemPrompt(uid)}}
	for _, m := range history {
		messages = append(messages, chatMsg{Role: m.Role, Content: m.Content})
	}
	messages = append(messages, chatMsg{Role: "user", Content: req.Message})

	// Call Ollama
	reply, err := h.callOllama(messages)
	if err != nil {
		// Graceful fallback so UI still works without Ollama
		reply = "I'm currently unable to connect to my AI model. Please ensure Ollama is running at " + h.OllamaURL + ". In the meantime, you can check your bookings under My Trips."
	}

	// Persist conversation
	sid := req.SessionID
	if sid == "" {
		sid = uuid.New().String()
	}
	db.DB.Create(&models.ConciergeChatMessage{UserID: func() uuid.UUID { id, _ := uuid.Parse(uid); return id }(), Role: "user", Content: req.Message, SessionID: sid})
	db.DB.Create(&models.ConciergeChatMessage{UserID: func() uuid.UUID { id, _ := uuid.Parse(uid); return id }(), Role: "assistant", Content: reply, SessionID: sid})

	return c.JSON(http.StatusOK, map[string]string{
		"reply":      reply,
		"session_id": sid,
	})
}

// GET /api/concierge/feed
func (h *Handlers) ConciergeFeed(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var alerts []models.ConciergeAlert
	db.DB.Where("user_id = ? AND is_dismissed = false", uid).
		Order("priority ASC, created_at DESC").
		Limit(20).Find(&alerts)
	if alerts == nil {
		alerts = []models.ConciergeAlert{}
	}
	return c.JSON(http.StatusOK, alerts)
}

// GET /api/concierge/briefing
func (h *Handlers) ConciergeBriefing(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	// Count upcoming trips
	var trainCount, flightCount int64
	db.DB.Model(&models.TrainBooking{}).
		Where("user_id = ? AND status = 'confirmed'", uid).
		Where("created_at > ?", time.Now().AddDate(0, -1, 0)).Count(&trainCount)
	db.DB.Model(&models.FlightBooking{}).
		Where("user_id = ? AND status = 'confirmed'", uid).
		Where("created_at > ?", time.Now().AddDate(0, -1, 0)).Count(&flightCount)

	hour := time.Now().Hour()
	greeting := "Good morning"
	if hour >= 12 && hour < 17 {
		greeting = "Good afternoon"
	} else if hour >= 17 {
		greeting = "Good evening"
	}

	var user models.User
	db.DB.Where("id = ?", uid).First(&user)
	name := user.FullName
	if name == "" {
		name = "there"
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"greeting":      fmt.Sprintf("%s, %s!", greeting, name),
		"train_trips":   trainCount,
		"flight_trips":  flightCount,
		"date":          time.Now().Format("Monday, 02 January 2006"),
	})
}

// GET /api/concierge/settings
func (h *Handlers) GetConciergeSettings(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var settings models.ConciergeSettings
	result := db.DB.Where("user_id = ?", uid).First(&settings)
	if result.Error != nil {
		// Return defaults
		return c.JSON(http.StatusOK, models.ConciergeSettings{
			WhatsAppAlerts:  true,
			DelayAlerts:     true,
			PriceDropAlerts: true,
			TatkalAlerts:    true,
			BriefingTime:    "06:00",
		})
	}
	return c.JSON(http.StatusOK, settings)
}

// POST /api/concierge/settings
func (h *Handlers) SaveConciergeSettings(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	userID, _ := uuid.Parse(uid)

	var req models.ConciergeSettings
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}

	var existing models.ConciergeSettings
	if db.DB.Where("user_id = ?", uid).First(&existing).Error != nil {
		req.UserID = userID
		db.DB.Create(&req)
	} else {
		db.DB.Model(&existing).Updates(map[string]interface{}{
			"auto_rebook":       req.AutoRebook,
			"auto_checkin":      req.AutoCheckin,
			"briefing_time":     req.BriefingTime,
			"whatsapp_alerts":   req.WhatsAppAlerts,
			"delay_alerts":      req.DelayAlerts,
			"price_drop_alerts": req.PriceDropAlerts,
			"tatkal_alerts":     req.TatkalAlerts,
		})
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "saved"})
}

// POST /api/concierge/dismiss/:alertId
func (h *Handlers) DismissAlert(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	alertID := c.Param("alertId")
	db.DB.Model(&models.ConciergeAlert{}).
		Where("id = ? AND user_id = ?", alertID, uid).
		Update("is_dismissed", true)
	return c.JSON(http.StatusOK, map[string]string{"status": "dismissed"})
}

// POST /api/concierge/read/:alertId
func (h *Handlers) MarkAlertRead(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	alertID := c.Param("alertId")
	db.DB.Model(&models.ConciergeAlert{}).
		Where("id = ? AND user_id = ?", alertID, uid).
		Update("is_read", true)
	return c.JSON(http.StatusOK, map[string]string{"status": "read"})
}
