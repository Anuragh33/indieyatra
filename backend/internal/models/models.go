package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Base contains common fields for all models
type Base struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// User represents a registered IndieYatra user
type User struct {
	Base
	ClerkID          string         `gorm:"uniqueIndex;default:null" json:"-"`
	Email            string         `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash     string         `json:"-"`
	FullName         string         `json:"full_name"`
	Phone            string         `json:"phone"`
	AvatarURL        string         `json:"avatar_url"`
	GoogleID         string         `gorm:"index" json:"-"`
	EmailVerified    bool           `json:"email_verified"`
	IsPremium        bool           `json:"is_premium"`
	PremiumExpiresAt *time.Time     `json:"premium_expires_at"`
	RewardPoints     int            `json:"reward_points"`
	Preferences      UserPreference `gorm:"embedded;embeddedPrefix:pref_" json:"preferences"`
}

type UserPreference struct {
	SeatType        string `json:"seat_type"`         // sleeper/seater/any
	BerthPreference string `json:"berth_preference"`  // lower/upper/any
	MealPreference  string `json:"meal_preference"`   // veg/nonveg/any
	PreferredOps    string `json:"preferred_ops"`     // CSV of operator IDs
	Language        string `json:"language"`          // en/hi/mr/ta/kn
}

// Operator — a bus company (MSRTC, VRL, etc.)
type Operator struct {
	Base
	Name        string `gorm:"not null" json:"name"`
	Slug        string `gorm:"uniqueIndex" json:"slug"`
	LogoURL     string `json:"logo_url"`
	Rating      float64 `json:"rating"`
	TotalReviews int    `json:"total_reviews"`
	Description string  `json:"description"`
	IsGovernment bool   `json:"is_government"`
	IsElectric   bool   `json:"is_electric"`
}

// City — Indian cities served
type City struct {
	Base
	Name       string  `gorm:"not null" json:"name"`
	State      string  `json:"state"`
	Code       string  `gorm:"uniqueIndex" json:"code"` // MUM, DEL, BLR
	Latitude   float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
	BusStands  string  `json:"bus_stands"` // CSV: "CSMT,Dadar,Borivali"
	ImageURL   string  `json:"image_url"`
	Popularity int     `json:"popularity"`
}

// Route — a published route between two cities
type Route struct {
	Base
	FromCityID uuid.UUID `gorm:"index;not null" json:"from_city_id"`
	ToCityID   uuid.UUID `gorm:"index;not null" json:"to_city_id"`
	FromCity   City      `gorm:"foreignKey:FromCityID" json:"from_city"`
	ToCity     City      `gorm:"foreignKey:ToCityID" json:"to_city"`
	DistanceKM int       `json:"distance_km"`
	AvgDurationMin int   `json:"avg_duration_min"`
	Popularity  int      `json:"popularity"`
}

// Schedule — a specific bus running on a route on a specific date
type Schedule struct {
	Base
	RouteID     uuid.UUID `gorm:"index;not null" json:"route_id"`
	BusID       uuid.UUID `gorm:"index;not null" json:"bus_id"`
	Route       Route     `gorm:"foreignKey:RouteID" json:"route"`
	Bus         Bus       `gorm:"foreignKey:BusID" json:"bus"`
	OperatorID  uuid.UUID `gorm:"index;not null" json:"operator_id"`
	Operator    Operator  `gorm:"foreignKey:OperatorID" json:"operator"`
	DepartureAt time.Time `gorm:"index" json:"departure_at"`
	ArrivalAt   time.Time `json:"arrival_at"`
	DurationMin int       `json:"duration_min"`
	Stops       int       `json:"stops"`         // 0=non-stop
	BaseFare    float64   `json:"base_fare"`
	Currency    string    `gorm:"default:'INR'" json:"currency"`
	SeatsTotal  int       `json:"seats_total"`
	SeatsAvailable int    `json:"seats_available"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
}

// Bus — a specific vehicle (type, layout, amenities)
type Bus struct {
	Base
	OperatorID uuid.UUID `gorm:"index;not null" json:"operator_id"`
	Operator   Operator  `gorm:"foreignKey:OperatorID" json:"operator"`
	BusType    string    `json:"bus_type"`    // "Volvo Multi-Axle AC Sleeper"
	Layout     string    `json:"layout"`      // "2+1", "2+2"
	TotalSeats int       `json:"total_seats"`
	IsAC       bool      `json:"is_ac"`
	IsSleeper  bool      `json:"is_sleeper"`
	Amenities  string    `json:"amenities"`    // CSV: "wifi,usb,blanket,meals,tracking"
	Rating     float64   `json:"rating"`
	TotalReviews int     `json:"total_reviews"`
}

// Seat — a single seat on a schedule (per-departure inventory)
type Seat struct {
	Base
	ScheduleID uuid.UUID `gorm:"index;not null" json:"schedule_id"`
	SeatNumber string    `gorm:"not null" json:"seat_number"` // "A1", "L12"
	BerthType  string    `json:"berth_type"`  // "lower"/"upper"
	SeatClass  string    `json:"seat_class"`  // "sleeper"/"seater"
	Status     string    `gorm:"default:'available'" json:"status"` // available/booked/locked/ladies
	Price      float64   `json:"price"`
	LockedBy   *uuid.UUID `json:"locked_by"`
	LockedAt   *time.Time `json:"locked_at"`
}

// Booking — a confirmed or pending booking
type Booking struct {
	Base
	UserID         uuid.UUID  `gorm:"index;not null" json:"user_id"`
	User           User       `gorm:"foreignKey:UserID" json:"user"`
	ScheduleID     uuid.UUID  `gorm:"index;not null" json:"schedule_id"`
	Schedule       Schedule   `gorm:"foreignKey:ScheduleID" json:"schedule"`
	BookingRef     string     `gorm:"uniqueIndex;not null" json:"booking_ref"` // IB-XXXXXX
	Status         string     `gorm:"default:'pending'" json:"status"`         // pending/confirmed/cancelled/completed
	TotalAmount    float64    `json:"total_amount"`
	TaxAmount      float64    `json:"tax_amount"`
	BaseAmount     float64    `json:"base_amount"`
	Currency       string     `gorm:"default:'INR'" json:"currency"`
	PaymentID      *uuid.UUID `gorm:"index" json:"payment_id"`
	Payment        *Payment   `gorm:"foreignKey:PaymentID" json:"payment,omitempty"`
	Passengers     []Passenger `gorm:"foreignKey:BookingID" json:"passengers"`
	ContactEmail   string     `json:"contact_email"`
	ContactPhone   string     `json:"contact_phone"`
	WhatsAppEnabled bool      `json:"whatsapp_enabled"`
	ETicketSent    bool       `json:"e_ticket_sent"`
	WhatsAppSent   bool       `json:"whatsapp_sent"`
}

// Passenger — a traveler on a booking
type Passenger struct {
	Base
	BookingID uuid.UUID `gorm:"index;not null" json:"booking_id"`
	FullName  string    `json:"full_name"`
	Age       int       `json:"age"`
	Gender    string    `json:"gender"` // M/F/Other
	IDType    string    `json:"id_type"` // aadhaar/pan/passport
	IDNumber  string    `json:"id_number"`
	SeatID    *uuid.UUID `json:"seat_id"`
	SeatNumber string   `json:"seat_number"`
}

// Payment — a payment attempt
type Payment struct {
	Base
	BookingID        uuid.UUID `gorm:"index;not null" json:"booking_id"`
	RazorpayOrderID  string    `gorm:"index" json:"razorpay_order_id"`
	RazorpayPaymentID string   `gorm:"index" json:"razorpay_payment_id"`
	RazorpaySignature string   `json:"razorpay_signature"`
	Amount           float64   `json:"amount"`
	Currency         string    `gorm:"default:'INR'" json:"currency"`
	Method           string    `json:"method"`   // upi/card/netbanking/wallet/emi
	Status           string    `gorm:"default:'initiated'" json:"status"` // initiated/paid/failed/refunded
	PaidAt           *time.Time `json:"paid_at"`
}

// PriceAlert — user-set price watcher
type PriceAlert struct {
	Base
	UserID         uuid.UUID `gorm:"index;not null" json:"user_id"`
	FromCityID     uuid.UUID `gorm:"index;not null" json:"from_city_id"`
	ToCityID       uuid.UUID `gorm:"index;not null" json:"to_city_id"`
	DateFrom       time.Time `json:"date_from"`
	DateTo         time.Time `json:"date_to"`
	PriceThreshold float64   `json:"price_threshold"`
	CurrentPrice   float64   `json:"current_price"`
	IsActive       bool      `gorm:"default:true" json:"is_active"`
	LastChecked    *time.Time `json:"last_checked"`
}

// PriceHistory — daily price snapshots for ML/trends
type PriceHistory struct {
	Base
	RouteID   uuid.UUID `gorm:"index;not null" json:"route_id"`
	Date      time.Time `gorm:"index" json:"date"`
	AvgPrice  float64   `json:"avg_price"`
	MinPrice  float64   `json:"min_price"`
	MaxPrice  float64   `json:"max_price"`
	Bookings  int       `json:"bookings"`
}

// Wishlist — saved destinations
type Wishlist struct {
	Base
	UserID     uuid.UUID `gorm:"index;not null" json:"user_id"`
	CityID     uuid.UUID `gorm:"index;not null" json:"city_id"`
	City       City      `gorm:"foreignKey:CityID" json:"city"`
	Notes      string    `json:"notes"`
	TargetPrice float64  `json:"target_price"`
}

// Review — a review of a bus/operator
type Review struct {
	Base
	UserID     uuid.UUID `gorm:"index;not null" json:"user_id"`
	User       User      `gorm:"foreignKey:UserID" json:"user"`
	OperatorID uuid.UUID `gorm:"index" json:"operator_id"`
	Operator   Operator  `gorm:"foreignKey:OperatorID" json:"operator"`
	ScheduleID *uuid.UUID `gorm:"index" json:"schedule_id"`
	Rating     int       `gorm:"not null" json:"rating"` // 1-5
	Title      string    `json:"title"`
	Comment    string    `gorm:"type:text" json:"comment"`
	Helpful    int       `json:"helpful"`
	IsVerified bool      `json:"is_verified"`
}

// AITripPlan — stored AI planner results
// SavedPaymentMethod — tokenized payment info saved by user
type SavedPaymentMethod struct {
	Base
	UserID    uuid.UUID `gorm:"index;not null" json:"user_id"`
	Type      string    `json:"type"`       // upi, card, netbanking
	Label     string    `json:"label"`      // "UPI • name@oksbi", "HDFC •• 4242"
	Network   string    `json:"network"`    // Visa, MC, Rupay, GPay, etc.
	IsDefault bool      `json:"is_default"`
}

type AITripPlan struct {
	Base
	UserID     uuid.UUID `gorm:"index" json:"user_id"`
	Prompt     string    `gorm:"type:text" json:"prompt"`
	ParsedTags string    `gorm:"type:text" json:"parsed_tags"` // JSON
	Response   string    `gorm:"type:text" json:"response"`   // JSON
	MatchScore int       `json:"match_score"`
}
