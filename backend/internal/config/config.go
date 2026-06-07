package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port      string
	AppEnv    string
	AppURL    string
	APIURL    string

	DatabaseURL string
	RedisURL    string

	JWTSecret           string
	JWTExpiry           time.Duration
	RefreshTokenExpiry  time.Duration

	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string

	ClerkSecretKey string

	RazorpayKeyID     string
	RazorpayKeySecret string

	OpenAIKey      string
	AnthropicKey   string
	LLMProvider    string
	OllamaURL      string
	OllamaModel    string

	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	EmailFrom    string

	WhatsAppAPIURL string
	WhatsAppToken  string
	WhatsAppPhone  string

	TwilioSID   string
	TwilioToken string
	TwilioFrom  string
}

var Cfg *Config

func Load() *Config {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := &Config{
		Port:      getEnv("PORT", "8080"),
		AppEnv:    getEnv("APP_ENV", "development"),
		AppURL:    getEnv("APP_URL", "http://localhost:3000"),
		APIURL:    getEnv("API_URL", "http://localhost:8080"),

		DatabaseURL: getEnv("DATABASE_URL", ""),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),

		JWTSecret:          getEnv("JWT_SECRET", "indieyatra-dev-secret-change-me"),
		JWTExpiry:          getDurationEnv("JWT_EXPIRY", 24*time.Hour),
		RefreshTokenExpiry: getDurationEnv("REFRESH_TOKEN_EXPIRY", 7*24*time.Hour),

		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/auth/google/callback"),

		ClerkSecretKey: getEnv("CLERK_SECRET_KEY", ""),

		RazorpayKeyID:     getEnv("RAZORPAY_KEY_ID", ""),
		RazorpayKeySecret: getEnv("RAZORPAY_KEY_SECRET", ""),

		OpenAIKey:    getEnv("OPENAI_API_KEY", ""),
		AnthropicKey: getEnv("ANTHROPIC_API_KEY", ""),
		LLMProvider:  getEnv("LLM_PROVIDER", "mock"),
		OllamaURL:    getEnv("OLLAMA_URL", "http://localhost:11434"),
		OllamaModel:  getEnv("OLLAMA_MODEL", "llama3"),

		SMTPHost:     getEnv("SMTP_HOST", ""),
		SMTPPort:     getEnv("SMTP_PORT", "587"),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		EmailFrom:    getEnv("EMAIL_FROM", "tickets@indieyatra.in"),

		WhatsAppAPIURL: getEnv("WHATSAPP_API_URL", ""),
		WhatsAppToken:  getEnv("WHATSAPP_TOKEN", ""),
		WhatsAppPhone:  getEnv("WHATSAPP_PHONE_ID", ""),

		TwilioSID:   getEnv("TWILIO_ACCOUNT_SID", ""),
		TwilioToken: getEnv("TWILIO_AUTH_TOKEN", ""),
		TwilioFrom:  getEnv("TWILIO_FROM_NUMBER", ""),
	}

	Cfg = cfg
	return cfg
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func getDurationEnv(key string, fallback time.Duration) time.Duration {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			return d
		}
	}
	return fallback
}
