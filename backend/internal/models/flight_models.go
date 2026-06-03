package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Airport struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	IATA      string         `gorm:"uniqueIndex;not null" json:"iata"` // BOM, DEL
	Name      string         `gorm:"not null" json:"name"`
	City      string         `json:"city"`
	State     string         `json:"state"`
	Terminal  string         `json:"terminal"` // T1, T2, T3
	Latitude  float64        `json:"latitude"`
	Longitude float64        `json:"longitude"`
	Timezone  string         `gorm:"default:'Asia/Kolkata'" json:"timezone"`
}

type Airline struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Code      string         `gorm:"uniqueIndex;not null" json:"code"` // 6E, AI, SG
	Name      string         `gorm:"not null" json:"name"`
	LogoURL   string         `json:"logo_url"`
	Color     string         `json:"color"` // hex brand color
}

type FlightSchedule struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
	FlightNumber    string         `gorm:"index;not null" json:"flight_number"` // 6E-204
	AirlineID       uuid.UUID      `gorm:"index;not null" json:"airline_id"`
	Airline         Airline        `gorm:"foreignKey:AirlineID" json:"airline"`
	FromAirportID   uuid.UUID      `gorm:"index;not null" json:"from_airport_id"`
	FromAirport     Airport        `gorm:"foreignKey:FromAirportID" json:"from_airport"`
	ToAirportID     uuid.UUID      `gorm:"index;not null" json:"to_airport_id"`
	ToAirport       Airport        `gorm:"foreignKey:ToAirportID" json:"to_airport"`
	JourneyDate     time.Time      `gorm:"index" json:"journey_date"`
	DepartureTime   string         `json:"departure_time"` // HH:MM
	ArrivalTime     string         `json:"arrival_time"`
	DurationMin     int            `json:"duration_min"`
	Aircraft        string         `json:"aircraft"`    // A320, B737, ATR-72
	CabinClass      string         `json:"cabin_class"` // Economy/Business
	TotalSeats      int            `json:"total_seats"`
	AvailableSeats  int            `json:"available_seats"`
	BaseFare        float64        `json:"base_fare"`         // per adult
	TaxesAndFees    float64        `json:"taxes_and_fees"`    // per adult
	BaggageKg       int            `json:"baggage_kg"`        // free check-in baggage
	HasMeal         bool           `json:"has_meal"`
	HasWifi         bool           `json:"has_wifi"`
	HasUSB          bool           `json:"has_usb"`
	OnTimePercent   int            `json:"on_time_percent"`
	FareType        string         `json:"fare_type"` // Saver/Value/Flexi
	RefundPolicy    string         `json:"refund_policy"`
	IsActive        bool           `gorm:"default:true" json:"is_active"`
}

type FlightBooking struct {
	ID              uuid.UUID          `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt       time.Time          `json:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at"`
	DeletedAt       gorm.DeletedAt     `gorm:"index" json:"-"`
	UserID          uuid.UUID          `gorm:"index;not null" json:"user_id"`
	User            User               `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ScheduleID      uuid.UUID          `gorm:"index;not null" json:"schedule_id"`
	Schedule        FlightSchedule     `gorm:"foreignKey:ScheduleID" json:"schedule,omitempty"`
	BookingRef      string             `gorm:"uniqueIndex;not null" json:"booking_ref"` // IY-FLT-XXXXXX
	PNR             string             `gorm:"uniqueIndex" json:"pnr"`                  // 6-char
	CabinClass      string             `json:"cabin_class"`
	Status          string             `gorm:"default:'pending'" json:"status"`
	TotalAmount     float64            `json:"total_amount"`
	BaseFare        float64            `json:"base_fare"`
	TaxesAndFees    float64            `json:"taxes_and_fees"`
	MealFee         float64            `json:"meal_fee"`
	BaggageFee      float64            `json:"baggage_fee"`
	InsuranceFee    float64            `json:"insurance_fee"`
	PlatformFee     float64            `json:"platform_fee"`
	GSTAmount       float64            `json:"gst_amount"`
	Currency        string             `gorm:"default:'INR'" json:"currency"`
	ContactEmail    string             `json:"contact_email"`
	ContactPhone    string             `json:"contact_phone"`
	ETicketSent     bool               `json:"e_ticket_sent"`
	WhatsAppSent    bool               `json:"whatsapp_sent"`
	PaymentID       *uuid.UUID         `gorm:"index" json:"payment_id"`
	Passengers      []FlightPassenger  `gorm:"foreignKey:FlightBookingID" json:"passengers"`
}

type FlightPassenger struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
	FlightBookingID uuid.UUID      `gorm:"index;not null" json:"flight_booking_id"`
	Title           string         `json:"title"` // Mr/Mrs/Ms/Dr
	FirstName       string         `json:"first_name"`
	LastName        string         `json:"last_name"`
	DOB             string         `json:"dob"`
	Gender          string         `json:"gender"` // M/F
	Nationality     string         `gorm:"default:'IN'" json:"nationality"`
	IDType          string         `json:"id_type"` // aadhaar/passport
	IDNumber        string         `json:"id_number"`
	FrequentFlyer   string         `json:"frequent_flyer"`
	MealPreference  string         `json:"meal_preference"` // veg/nonveg/jain/none
	SeatNumber      string         `json:"seat_number"`
	ExtraBaggage    int            `json:"extra_baggage_kg"`
	Status          string         `gorm:"default:'confirmed'" json:"status"`
}
