package models

import (
	"time"

	"github.com/google/uuid"
)

type Hotel struct {
	Base
	Name         string  `gorm:"not null" json:"name"`
	Slug         string  `gorm:"uniqueIndex" json:"slug"`
	City         string  `gorm:"not null;index" json:"city"`
	State        string  `json:"state"`
	Address      string  `json:"address"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	StarRating   int     `json:"star_rating"`   // 1-5
	Rating       float64 `json:"rating"`        // 0-5 aggregated
	TotalReviews int     `json:"total_reviews"`
	Description  string  `json:"description"`
	ImageURL     string  `json:"image_url"`
	Images       string  `json:"images"`        // comma-separated URLs
	Amenities    string  `json:"amenities"`     // comma-separated: wifi,pool,spa,gym,restaurant,parking,ac,bar,beach,mountain
	Tags         string  `json:"tags"`          // Heritage/Beach/Mountain/Boutique/Budget/Luxury
	PropertyType string  `json:"property_type"` // Hotel/Resort/Homestay/Hostel/Villa
	CheckInTime  string  `json:"check_in_time"` // "14:00"
	CheckOutTime string  `json:"check_out_time"`
	Policies     string  `json:"policies"`
	IsActive     bool    `gorm:"default:true" json:"is_active"`
}

type HotelRoom struct {
	Base
	HotelID       uuid.UUID `gorm:"type:uuid;not null;index" json:"hotel_id"`
	Hotel         *Hotel    `gorm:"foreignKey:HotelID" json:"hotel,omitempty"`
	RoomType      string    `json:"room_type"`      // Standard/Deluxe/Suite/Premium/Presidential
	BedType       string    `json:"bed_type"`       // Single/Double/Twin/King/Queen
	MaxOccupancy  int       `json:"max_occupancy"`
	Sizesqft      int       `json:"size_sqft"`
	PricePerNight float64   `json:"price_per_night"`
	OriginalPrice float64   `json:"original_price"`
	TaxPercent    float64   `json:"tax_percent"`
	TotalRooms    int       `json:"total_rooms"`
	AvailableRooms int      `json:"available_rooms"`
	Amenities     string    `json:"amenities"` // tv,ac,minibar,bathtub,balcony,cityview,poolview,wifi
	Images        string    `json:"images"`
	BreakfastIncl bool      `json:"breakfast_incl"`
	FreeCancellation bool   `json:"free_cancellation"`
	CancellationHours int   `json:"cancellation_hours"` // hours before checkin
	IsActive      bool      `gorm:"default:true" json:"is_active"`
}

type HotelBooking struct {
	Base
	UserID        uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	HotelID       uuid.UUID  `gorm:"type:uuid;not null;index" json:"hotel_id"`
	Hotel         *Hotel     `gorm:"foreignKey:HotelID" json:"hotel,omitempty"`
	RoomID        uuid.UUID  `gorm:"type:uuid;not null" json:"room_id"`
	Room          *HotelRoom `gorm:"foreignKey:RoomID" json:"room,omitempty"`
	BookingRef    string     `gorm:"uniqueIndex;not null" json:"booking_ref"`
	CheckIn       time.Time  `json:"check_in"`
	CheckOut      time.Time  `json:"check_out"`
	Nights        int        `json:"nights"`
	Guests        int        `json:"guests"`
	RoomCount     int        `json:"room_count"`
	GuestName     string     `json:"guest_name"`
	GuestEmail    string     `json:"guest_email"`
	GuestPhone    string     `json:"guest_phone"`
	SpecialRequests string   `json:"special_requests"`
	Status        string     `gorm:"default:confirmed" json:"status"` // confirmed/cancelled/checked_in/checked_out
	RoomPrice     float64    `json:"room_price"`
	TaxAmount     float64    `json:"tax_amount"`
	PlatformFee   float64    `json:"platform_fee"`
	TotalAmount   float64    `json:"total_amount"`
	PaymentMethod string     `json:"payment_method"`
	EarlyCheckin  bool       `json:"early_checkin"`
	LateCheckout  bool       `json:"late_checkout"`
}
