package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/anuragh/indiebus/backend/internal/config"
	"github.com/anuragh/indiebus/backend/internal/models"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	DB  *gorm.DB
	RDB *redis.Client
)

func Connect() error {
	cfg := config.Cfg

	if cfg.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is not set")
	}

	gormLogger := logger.Default.LogMode(logger.Warn)
	if cfg.AppEnv == "development" {
		gormLogger = logger.Default.LogMode(logger.Info)
	}

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return fmt.Errorf("failed to connect to postgres: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	DB = db
	log.Println("✓ Connected to PostgreSQL")

	// Redis
	opt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		return fmt.Errorf("failed to parse redis URL: %w", err)
	}
	RDB = redis.NewClient(opt)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := RDB.Ping(ctx).Result(); err != nil {
		log.Printf("⚠ Redis ping failed (continuing anyway): %v", err)
	} else {
		log.Println("✓ Connected to Redis")
	}

	return nil
}

func Migrate() error {
	log.Println("→ Running auto-migrations...")
	return DB.AutoMigrate(
		&models.User{},
		&models.Operator{},
		&models.City{},
		&models.Route{},
		&models.Bus{},
		&models.Schedule{},
		&models.Seat{},
		&models.Booking{},
		&models.Passenger{},
		&models.Payment{},
		&models.PriceAlert{},
		&models.PriceHistory{},
		&models.Wishlist{},
		&models.Review{},
		&models.AITripPlan{},
		&models.SavedPaymentMethod{},
		// Train vertical
		&models.Station{},
		&models.Train{},
		&models.TrainRouteStop{},
		&models.TrainSchedule{},
		&models.TrainClassAvailability{},
		&models.TrainBooking{},
		&models.TrainPassenger{},
		// Flight vertical
		&models.Airport{},
		&models.Airline{},
		&models.FlightSchedule{},
		&models.FlightBooking{},
		&models.FlightPassenger{},
		// Hotel vertical
		&models.Hotel{},
		&models.HotelRoom{},
		&models.HotelBooking{},
		// Concierge
		&models.ConciergeAlert{},
		&models.ConciergeSettings{},
		&models.ConciergeChatMessage{},
	)
}
