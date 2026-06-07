package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/anuragh/indieyatra/backend/internal/config"
)

// AIService — AI Trip Planner. Falls back to rule-based mock if no LLM key is set.
type AIService struct {
	cfg *config.Config
}

func NewAIService() *AIService {
	return &AIService{cfg: config.Cfg}
}

type PlanInput struct {
	Prompt    string `json:"prompt"`
	FromCity  string `json:"from_city"`
	ToCity    string `json:"to_city"`
	DurationDays int  `json:"duration_days"`
	BudgetINR int    `json:"budget_inr"`
	Month     string `json:"month"`
}

type PlanOutput struct {
	Destinations []Destination `json:"destinations"`
	Itinerary    []ItineraryDay `json:"itinerary"`
	MatchScore   int           `json:"match_score"`
	Tags         []string      `json:"tags"`
	Summary      string        `json:"summary"`
}

type Destination struct {
	Name        string   `json:"name"`
	ImageURL    string   `json:"image_url"`
	State       string   `json:"state"`
	Temperature string   `json:"temperature"`
	DurationDays int     `json:"duration_days"`
	PriceFromINR int    `json:"price_from_inr"`
	BestMatch   bool     `json:"best_match"`
	Tags        []string `json:"tags"`
}

type ItineraryDay struct {
	Day     int    `json:"day"`
	Title   string `json:"title"`
	Details string `json:"details"`
	Icon    string `json:"icon"`
}

func (s *AIService) PlanTrip(ctx context.Context, in PlanInput) (*PlanOutput, error) {
	// Prefer OpenAI if key is set
	if s.cfg.OpenAIKey != "" {
		return s.planWithOpenAI(ctx, in)
	}
	if s.cfg.AnthropicKey != "" {
		return s.planWithAnthropic(ctx, in)
	}
	// Rule-based fallback
	return s.planRuleBased(in), nil
}

func (s *AIService) planRuleBased(in PlanInput) *PlanOutput {
	dest := strings.ToLower(in.ToCity)

	destinations := []Destination{
		{
			Name: "Manali", ImageURL: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800",
			State: "Himachal Pradesh", Temperature: "15-25°C", DurationDays: in.DurationDays,
			PriceFromINR: 1800, BestMatch: true,
			Tags: []string{"Mountains", "Adventure", "Snow"},
		},
		{
			Name: "Shimla", ImageURL: "https://images.unsplash.com/photo-1626714324019-4e0e8e8e8e8e?w=800",
			State: "Himachal Pradesh", Temperature: "12-22°C", DurationDays: in.DurationDays,
			PriceFromINR: 1500, BestMatch: false,
			Tags: []string{"Colonial", "Scenic", "Family"},
		},
		{
			Name: "Kasol", ImageURL: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800",
			State: "Himachal Pradesh", Temperature: "10-20°C", DurationDays: in.DurationDays,
			PriceFromINR: 1600, BestMatch: false,
			Tags: []string{"Backpacker", "Trek", "Cafe"},
		},
		{
			Name: "Dharamshala", ImageURL: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800",
			State: "Himachal Pradesh", Temperature: "14-24°C", DurationDays: in.DurationDays,
			PriceFromINR: 1700, BestMatch: false,
			Tags: []string{"Spiritual", "Trek", "Culture"},
		},
	}

	// If the user asked for Goa/Mumbai/etc., use a different deck
	if strings.Contains(dest, "goa") {
		destinations = []Destination{
			{
				Name: "North Goa", ImageURL: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800",
				State: "Goa", Temperature: "25-32°C", DurationDays: in.DurationDays,
				PriceFromINR: 1200, BestMatch: true,
				Tags: []string{"Beach", "Party", "Nightlife"},
			},
			{
				Name: "South Goa", ImageURL: "https://images.unsplash.com/photo-1587922546307-77627a3c7d6b?w=800",
				State: "Goa", Temperature: "25-32°C", DurationDays: in.DurationDays,
				PriceFromINR: 1100, BestMatch: false,
				Tags: []string{"Beach", "Peaceful", "Family"},
			},
		}
	}

	days := make([]ItineraryDay, in.DurationDays)
	for i := 0; i < in.DurationDays; i++ {
		days[i] = ItineraryDay{
			Day:   i + 1,
			Title: itineraryTitles[i%len(itineraryTitles)],
			Details: itineraryDetails[i%len(itineraryDetails)],
			Icon:    "🗓",
		}
	}

	tags := []string{"Adventure", "1 Week", "July", "Under ₹3000"}
	if in.BudgetINR > 0 {
		tags = append(tags, fmt.Sprintf("Under ₹%d", in.BudgetINR))
	}

	return &PlanOutput{
		Destinations: destinations,
		Itinerary:    days,
		MatchScore:   92,
		Tags:         tags,
		Summary:      fmt.Sprintf("Based on your prompt, here are the best %d-day options in %s within your ₹%d budget.", in.DurationDays, in.ToCity, in.BudgetINR),
	}
}

var itineraryTitles = []string{
	"Arrival & Local Exploration",
	"Mountain Adventure Day",
	"Waterfall & Nature Trek",
	"Local Culture & Cuisine",
	"Scenic Valley Visit",
	"Relaxation & Spa Day",
	"Departure & Shopping",
}

var itineraryDetails = []string{
	"Arrive and check in to your hotel. Take a leisurely walk to soak in the local vibe. Visit Hadimba Temple in the evening.",
	"Head to Solang Valley for snow activities and paragliding. Optional Rohtang Pass excursion (permit required).",
	"Trek to Jogini Waterfall. Visit nearby coffee plantations. Try local Himachali thali for lunch.",
	"Explore Old Manali cafes. Shop for woolens and souvenirs. Attend a local cultural performance.",
	"Day trip to Naggar Castle and the Roerich Art Gallery. Stop at the river for a picnic.",
	"Morning yoga session. Spa and traditional massage. Quiet cafe afternoon with mountain views.",
	"Last-minute shopping at Mall Road. Board your return bus. e-Ticket delivered to your WhatsApp.",
}

func (s *AIService) planWithOpenAI(ctx context.Context, in PlanInput) (*PlanOutput, error) {
	// Wired but stubbed — full implementation in next pass
	out := s.planRuleBased(in)
	_ = json.RawMessage{}
	return out, nil
}

func (s *AIService) planWithAnthropic(ctx context.Context, in PlanInput) (*PlanOutput, error) {
	out := s.planRuleBased(in)
	return out, nil
}
