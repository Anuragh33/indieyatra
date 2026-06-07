package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/anuragh/indieyatra/backend/internal/api"
	"github.com/anuragh/indieyatra/backend/internal/auth"
	"github.com/anuragh/indieyatra/backend/internal/config"
	"github.com/anuragh/indieyatra/backend/internal/db"
	"github.com/anuragh/indieyatra/backend/internal/models"
	"github.com/anuragh/indieyatra/backend/internal/seed"
	"github.com/anuragh/indieyatra/backend/internal/services"
	"github.com/anuragh/indieyatra/backend/internal/websocket"
	"github.com/anuragh/indieyatra/backend/internal/workers"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	cfg := config.Load()
	log.Printf("🚀 IndieYatra API starting (env=%s)", cfg.AppEnv)

	auth.InitClerk(cfg.ClerkSecretKey)

	if err := db.Connect(); err != nil {
		log.Fatalf("DB connect failed: %v", err)
	}
	if err := db.Migrate(); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	// Seed if empty
	if err := seed.RunIfEmpty(); err != nil {
		log.Printf("⚠ Seed issue (non-fatal): %v", err)
	}

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAuthorization},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
	}))

	emailSvc := services.NewEmailService(services.EmailConfig{
		SMTPHost:       cfg.SMTPHost,
		SMTPPort:       cfg.SMTPPort,
		SMTPUser:       cfg.SMTPUser,
		SMTPPassword:   cfg.SMTPPassword,
		EmailFrom:      cfg.EmailFrom,
		EmailFromName:  "IndieYatra",
		WhatsAppAPIURL: cfg.WhatsAppAPIURL,
		WhatsAppToken:  cfg.WhatsAppToken,
		WhatsAppPhone:  cfg.WhatsAppPhone,
		TwilioSID:      cfg.TwilioSID,
		TwilioToken:    cfg.TwilioToken,
		TwilioFrom:     cfg.TwilioFrom,
	})

	h := &api.Handlers{
		PaymentSvc:  services.NewPaymentService(),
		AISvc:       services.NewAIService(),
		EmailSvc:    emailSvc,
		FrontendURL: cfg.AppURL,
		OllamaURL:   cfg.OllamaURL,
		OllamaModel: cfg.OllamaModel,
	}

	// Start concierge background workers
	workers.Start(emailSvc)

	api.RegisterRoutes(e, h)

	// WebSocket
	go websocket.GlobalHub.Run()

	// GPS simulator: every 10s, push a fake bus position to all "track:*" rooms
	go simulateGPS()

	e.GET("/ws", echo.WrapHandler(websocket.HandleWS(websocket.GlobalHub)))

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	go func() {
		if err := e.StartServer(srv); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server crashed: %v", err)
		}
	}()

	log.Printf("✓ IndieYatra API listening on :%s", cfg.Port)

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("shutdown error: %v", err)
	}
}

func simulateGPS() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()
	for range ticker.C {
		// Find schedules currently in transit (departure <= now <= arrival)
		var schedules []models.Schedule
		db.DB.Preload("Route.FromCity").Preload("Route.ToCity").
			Where("departure_at <= ? AND arrival_at >= ?", time.Now(), time.Now()).
			Find(&schedules)

		for _, s := range schedules {
			if s.Route.FromCityID == uuid.Nil || s.Route.ToCityID == uuid.Nil {
				continue
			}
			// Fetch cities directly (the struct values are zeroed because of how
			// GORM populates a single JOIN, so we re-query to be safe)
			var fromCity, toCity models.City
			if err := db.DB.First(&fromCity, "id = ?", s.Route.FromCityID).Error; err != nil {
				continue
			}
			if err := db.DB.First(&toCity, "id = ?", s.Route.ToCityID).Error; err != nil {
				continue
			}
			total := float64(s.ArrivalAt.Sub(s.DepartureAt))
			if total <= 0 {
				continue
			}
			elapsed := float64(time.Since(s.DepartureAt))
			progress := elapsed / total
			if progress < 0 {
				progress = 0
			}
			if progress > 1 {
				progress = 1
			}
			// Linear interpolation between from and to city
			lat := fromCity.Latitude + (toCity.Latitude-fromCity.Latitude)*progress
			lng := fromCity.Longitude + (toCity.Longitude-fromCity.Longitude)*progress
			// Emit to the schedule-specific room so only subscribers of this bus see it
			websocket.GlobalHub.EmitGPS(s.ID.String(), lat, lng)
		}
	}
}
