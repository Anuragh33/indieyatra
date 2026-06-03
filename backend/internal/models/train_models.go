package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Station struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Name      string         `gorm:"not null" json:"name"`
	Code      string         `gorm:"uniqueIndex;not null" json:"code"`
	City      string         `json:"city"`
	State     string         `json:"state"`
	Zone      string         `json:"zone"`
	Latitude  float64        `json:"latitude"`
	Longitude float64        `json:"longitude"`
}

type Train struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Number      string         `gorm:"uniqueIndex;not null" json:"number"`
	Name        string         `gorm:"not null" json:"name"`
	TrainType   string         `json:"train_type"`
	RunsOn      string         `json:"runs_on"`   // "Daily", "Mon,Thu", etc.
	Classes     string         `json:"classes"`   // CSV: "1A,2A,3A,SL"
	IsSuperfast bool           `json:"is_superfast"`
	HasPantry   bool           `json:"has_pantry"`
}

// TrainRouteStop is a stop on a train's permanent route schedule.
type TrainRouteStop struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	TrainID       uuid.UUID      `gorm:"index;not null" json:"train_id"`
	StationID     uuid.UUID      `gorm:"index;not null" json:"station_id"`
	Station       Station        `gorm:"foreignKey:StationID" json:"station"`
	StopNumber    int            `json:"stop_number"`    // 1=origin
	ArrivalTime   string         `json:"arrival_time"`   // "HH:MM" or "--" for origin
	DepartureTime string         `json:"departure_time"` // "HH:MM" or "--" for terminus
	HaltMin       int            `json:"halt_min"`
	DistanceKM    int            `json:"distance_km"` // from origin
	DayNumber     int            `gorm:"default:1" json:"day_number"`
	Platform      string         `json:"platform"`
}

// TrainSchedule is a specific run of a train on a particular journey date
// between two stations (search segment).
type TrainSchedule struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	TrainID       uuid.UUID      `gorm:"index;not null" json:"train_id"`
	Train         Train          `gorm:"foreignKey:TrainID" json:"train"`
	FromStationID uuid.UUID      `gorm:"index;not null" json:"from_station_id"`
	FromStation   Station        `gorm:"foreignKey:FromStationID" json:"from_station"`
	ToStationID   uuid.UUID      `gorm:"index;not null" json:"to_station_id"`
	ToStation     Station        `gorm:"foreignKey:ToStationID" json:"to_station"`
	JourneyDate   time.Time      `gorm:"index" json:"journey_date"`
	DepartureTime string         `json:"departure_time"` // "HH:MM"
	ArrivalTime   string         `json:"arrival_time"`   // "HH:MM"
	ArrivalDay    int            `gorm:"default:1" json:"arrival_day"` // 1=same, 2=next, 3=day after
	DurationMin   int            `json:"duration_min"`
	IsActive      bool           `gorm:"default:true" json:"is_active"`
}

// TrainClassAvailability tracks availability and fare per class for a schedule.
type TrainClassAvailability struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	ScheduleID    uuid.UUID      `gorm:"index;not null" json:"schedule_id"`
	Class         string         `json:"class"`         // 1A/2A/3A/SL/CC/EC/2S
	TotalBerths   int            `json:"total_berths"`
	Available     int            `json:"available"`
	RAC           int            `json:"rac"`
	WaitlistCount int            `json:"waitlist_count"`
	BaseFare      float64        `json:"base_fare"`
	TatkalFare    float64        `json:"tatkal_fare"`
	Status        string         `json:"status"` // AVAILABLE/RAC/WL/REGRET
}

type TrainBooking struct {
	ID             uuid.UUID        `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt      time.Time        `json:"created_at"`
	UpdatedAt      time.Time        `json:"updated_at"`
	DeletedAt      gorm.DeletedAt   `gorm:"index" json:"-"`
	UserID         uuid.UUID        `gorm:"index;not null" json:"user_id"`
	User           User             `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ScheduleID     uuid.UUID        `gorm:"index;not null" json:"schedule_id"`
	Schedule       TrainSchedule    `gorm:"foreignKey:ScheduleID" json:"schedule,omitempty"`
	BookingRef     string           `gorm:"uniqueIndex;not null" json:"booking_ref"` // IY-TRN-XXXXXX
	PNR            string           `gorm:"uniqueIndex" json:"pnr"`                  // 10-digit
	Class          string           `json:"class"`
	Quota          string           `gorm:"default:'GN'" json:"quota"` // GN/TQ/LD/SS/HP
	Status         string           `gorm:"default:'pending'" json:"status"`
	TotalAmount    float64          `json:"total_amount"`
	BaseFare       float64          `json:"base_fare"`
	ReservationFee float64          `json:"reservation_fee"`
	SuperfastFee   float64          `json:"superfast_fee"`
	GSTAmount      float64          `json:"gst_amount"`
	IRCTCFee       float64          `json:"irctc_fee"`
	InsuranceFee   float64          `json:"insurance_fee"`
	Currency       string           `gorm:"default:'INR'" json:"currency"`
	ContactEmail   string           `json:"contact_email"`
	ContactPhone   string           `json:"contact_phone"`
	ChartPrepared  bool             `json:"chart_prepared"`
	ETicketSent    bool             `json:"e_ticket_sent"`
	WhatsAppSent   bool             `json:"whatsapp_sent"`
	PaymentID      *uuid.UUID       `gorm:"index" json:"payment_id"`
	Passengers     []TrainPassenger `gorm:"foreignKey:TrainBookingID" json:"passengers"`
}

type TrainPassenger struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
	TrainBookingID  uuid.UUID      `gorm:"index;not null" json:"train_booking_id"`
	FullName        string         `json:"full_name"`
	Age             int            `json:"age"`
	Gender          string         `json:"gender"`          // M/F/Other
	BerthPreference string         `json:"berth_preference"` // Lower/Middle/Upper/Side Lower/Side Upper/Any
	IDType          string         `json:"id_type"`          // aadhaar/pan/passport
	IDNumber        string         `json:"id_number"`
	IsSenior        bool           `json:"is_senior"`
	MealPreference  string         `json:"meal_preference"` // veg/nonveg/none
	Coach           string         `json:"coach"`
	BerthNumber     string         `json:"berth_number"`
	Status          string         `gorm:"default:'CNF'" json:"status"` // CNF/RAC/WL#
}
