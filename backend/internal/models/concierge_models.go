package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ConciergeAlert is a feed item shown to the user in their concierge panel.
type ConciergeAlert struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	UserID      uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	Type        string         `json:"type"` // price_drop/delay/tatkal/suggestion/auto_action
	Title       string         `json:"title"`
	Body        string         `json:"body"`
	ActionURL   string         `json:"action_url"`
	ActionLabel string         `json:"action_label"`
	Meta        string         `json:"meta"` // JSON blob for extra data
	IsRead      bool           `gorm:"default:false" json:"is_read"`
	IsDismissed bool           `gorm:"default:false" json:"is_dismissed"`
	Priority    int            `gorm:"default:2" json:"priority"` // 1=high 2=medium 3=low
}

// ConciergeSettings stores per-user preferences for the concierge.
type ConciergeSettings struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
	UserID          uuid.UUID      `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	AutoRebook      bool           `gorm:"default:false" json:"auto_rebook"`
	AutoCheckin     bool           `gorm:"default:false" json:"auto_checkin"`
	BriefingTime    string         `gorm:"default:'06:00'" json:"briefing_time"`
	WhatsAppAlerts  bool           `gorm:"default:true" json:"whatsapp_alerts"`
	DelayAlerts     bool           `gorm:"default:true" json:"delay_alerts"`
	PriceDropAlerts bool           `gorm:"default:true" json:"price_drop_alerts"`
	TatkalAlerts    bool           `gorm:"default:true" json:"tatkal_alerts"`
}

// ConciergeChatMessage stores chat history per user session.
type ConciergeChatMessage struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	UserID    uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	Role      string         `json:"role"` // user/assistant
	Content   string         `json:"content"`
	SessionID string         `gorm:"index" json:"session_id"`
}
