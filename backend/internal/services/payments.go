package services

import (
	"context"
	"fmt"
	"log"

	"github.com/anuragh/indiebus/backend/internal/config"
	"github.com/razorpay/razorpay-go"
)

type PaymentService struct {
	client *razorpay.Client
	cfg    *config.Config
}

func NewPaymentService() *PaymentService {
	cfg := config.Cfg
	if cfg.RazorpayKeyID == "" || cfg.RazorpayKeySecret == "" {
		log.Println("⚠ Razorpay keys not set — payment endpoints will be no-op")
		return &PaymentService{cfg: cfg}
	}
	client := razorpay.NewClient(cfg.RazorpayKeyID, cfg.RazorpayKeySecret)
	return &PaymentService{client: client, cfg: cfg}
}

type CreateOrderInput struct {
	Amount   float64
	Currency string
	Receipt  string
	Notes    map[string]interface{}
}

func (s *PaymentService) CreateOrder(ctx context.Context, in CreateOrderInput) (string, error) {
	if s.client == nil {
		return "", fmt.Errorf("razorpay not configured")
	}

	amountPaise := int64(in.Amount * 100)
	data := map[string]interface{}{
		"amount":   amountPaise,
		"currency": in.Currency,
		"receipt":  in.Receipt,
	}
	if in.Notes != nil {
		data["notes"] = in.Notes
	}

	body, err := s.client.Order.Create(data, nil)
	if err != nil {
		return "", fmt.Errorf("razorpay order create failed: %w", err)
	}
	orderID, _ := body["id"].(string)
	return orderID, nil
}

type VerifyInput struct {
	OrderID   string
	PaymentID string
	Signature string
}

func (s *PaymentService) VerifySignature(in VerifyInput) bool {
	// Standard HMAC SHA256 verification per Razorpay docs
	expected := computeHmacSHA256(in.OrderID + "|" + in.PaymentID, s.cfg.RazorpayKeySecret)
	return expected == in.Signature
}

func (s *PaymentService) FetchPayment(paymentID string) (map[string]interface{}, error) {
	if s.client == nil {
		return nil, fmt.Errorf("razorpay not configured")
	}
	return s.client.Payment.Fetch(paymentID, nil, nil)
}

func (s *PaymentService) Refund(paymentID string, amount float64) (map[string]interface{}, error) {
	if s.client == nil {
		return nil, fmt.Errorf("razorpay not configured")
	}
	data := map[string]interface{}{
		"amount": int64(amount * 100),
	}
	return s.client.Payment.Refund(paymentID, int(amount*100), data, nil)
}

// computeHmacSHA256 is implemented in payments_hmac.go
