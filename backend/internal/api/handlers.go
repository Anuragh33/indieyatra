package api

import (
	"github.com/anuragh/indiebus/backend/internal/services"
)

type Handlers struct {
	PaymentSvc  *services.PaymentService
	AISvc       *services.AIService
	EmailSvc    *services.EmailService
	FrontendURL string
	OllamaURL   string
	OllamaModel string
}
