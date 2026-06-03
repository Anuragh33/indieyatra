package api

import (
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

// ParseVoiceRequest parses a voice transcript into structured search parameters.
// POST /api/voice/parse  (no auth required — stateless NLP)
func (h *Handlers) ParseVoice(c echo.Context) error {
	var req struct {
		Transcript string `json:"transcript"`
	}
	if err := c.Bind(&req); err != nil || req.Transcript == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "transcript required"})
	}

	result := parseTranscript(req.Transcript)
	return c.JSON(http.StatusOK, result)
}

type VoiceParseResult struct {
	From      string `json:"from"`
	To        string `json:"to"`
	Date      string `json:"date"`      // YYYY-MM-DD
	Travelers int    `json:"travelers"`
	Vertical  string `json:"vertical"`  // bus | train | flight | hotel
}

var (
	// Route patterns: "from X to Y", "X to Y"
	routeRe = regexp.MustCompile(`(?i)(?:from\s+)?([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s+on|\s+for|\s+tomorrow|\s*$)`)

	// Traveler count: "2 people", "3 passengers", "for 4"
	travelersRe = regexp.MustCompile(`(?i)(\d+)\s+(?:people|persons?|passengers?|travelers?|tickets?|of us)|(?:for\s+)(\d+)`)

	// Date patterns
	tomorrowRe = regexp.MustCompile(`(?i)\btomorrow\b`)
	todayRe    = regexp.MustCompile(`(?i)\btoday\b`)
	// "on 15th", "on 20 June", "on June 20"
	dateRe = regexp.MustCompile(`(?i)on\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s+)?([a-z]+)?|on\s+([a-z]+)\s+(\d{1,2})`)

	// Vertical keywords
	flightWords = regexp.MustCompile(`(?i)\b(?:flight|fly|flying|plane|air)\b`)
	trainWords  = regexp.MustCompile(`(?i)\b(?:train|rail|railway|express|rajdhani|shatabdi|duronto)\b`)
	hotelWords  = regexp.MustCompile(`(?i)\b(?:hotel|stay|room|accommodation|hostel)\b`)
)

// City name normalization — maps common spoken forms to canonical names
var cityAliases = map[string]string{
	"bombay":    "Mumbai",
	"calcutta":  "Kolkata",
	"madras":    "Chennai",
	"bangalore": "Bengaluru",
	"bengaluru": "Bengaluru",
	"pune":      "Pune",
	"delhi":     "New Delhi",
	"new delhi": "New Delhi",
	"hyderabad": "Hyderabad",
	"ahmedabad": "Ahmedabad",
	"jaipur":    "Jaipur",
	"lucknow":   "Lucknow",
	"kochi":     "Kochi",
	"cochin":    "Kochi",
	"goa":       "Goa",
	"panaji":    "Goa",
	"surat":     "Surat",
	"nagpur":    "Nagpur",
	"nashik":    "Nashik",
	"varanasi":  "Varanasi",
	"benaras":   "Varanasi",
	"patna":     "Patna",
	"chandigarh": "Chandigarh",
	"bhopal":    "Bhopal",
	"indore":    "Indore",
	"coimbatore": "Coimbatore",
	"mysore":    "Mysuru",
	"mysuru":    "Mysuru",
	"visakhapatnam": "Visakhapatnam",
	"vizag":     "Visakhapatnam",
}

func normalizeCityName(s string) string {
	s = strings.TrimSpace(strings.ToLower(s))
	if v, ok := cityAliases[s]; ok {
		return v
	}
	// Title-case it
	words := strings.Fields(s)
	for i, w := range words {
		if len(w) > 0 {
			words[i] = strings.ToUpper(w[:1]) + w[1:]
		}
	}
	return strings.Join(words, " ")
}

var monthNames = map[string]int{
	"january": 1, "jan": 1,
	"february": 2, "feb": 2,
	"march": 3, "mar": 3,
	"april": 4, "apr": 4,
	"may": 5,
	"june": 6, "jun": 6,
	"july": 7, "jul": 7,
	"august": 8, "aug": 8,
	"september": 9, "sep": 9, "sept": 9,
	"october": 10, "oct": 10,
	"november": 11, "nov": 11,
	"december": 12, "dec": 12,
}

func parseTranscript(t string) VoiceParseResult {
	result := VoiceParseResult{Travelers: 1, Vertical: "bus"}

	// Detect vertical
	if flightWords.MatchString(t) {
		result.Vertical = "flight"
	} else if trainWords.MatchString(t) {
		result.Vertical = "train"
	} else if hotelWords.MatchString(t) {
		result.Vertical = "hotel"
	}

	// Extract route
	if m := routeRe.FindStringSubmatch(t); len(m) >= 3 {
		result.From = normalizeCityName(m[1])
		result.To = normalizeCityName(m[2])
	}

	// Extract travelers
	if m := travelersRe.FindStringSubmatch(t); len(m) > 0 {
		n := 0
		if m[1] != "" {
			for _, c := range m[1] {
				n = n*10 + int(c-'0')
			}
		} else if m[2] != "" {
			for _, c := range m[2] {
				n = n*10 + int(c-'0')
			}
		}
		if n > 0 && n <= 9 {
			result.Travelers = n
		}
	}

	// Extract date
	now := time.Now()
	if todayRe.MatchString(t) {
		result.Date = now.Format("2006-01-02")
	} else if tomorrowRe.MatchString(t) {
		result.Date = now.AddDate(0, 0, 1).Format("2006-01-02")
	} else if m := dateRe.FindStringSubmatch(t); len(m) > 0 {
		day, month := 0, 0
		if m[1] != "" {
			for _, c := range m[1] {
				day = day*10 + int(c-'0')
			}
			if m[2] != "" {
				month = monthNames[strings.ToLower(m[2])]
			}
		} else if m[4] != "" {
			for _, c := range m[4] {
				day = day*10 + int(c-'0')
			}
			month = monthNames[strings.ToLower(m[3])]
		}
		if day > 0 && day <= 31 {
			if month == 0 {
				month = int(now.Month())
			}
			year := now.Year()
			d := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.Local)
			if d.Before(now) {
				d = d.AddDate(1, 0, 0) // bump to next year if past
			}
			result.Date = d.Format("2006-01-02")
		}
	}

	// Default date: 7 days from now
	if result.Date == "" {
		result.Date = now.AddDate(0, 0, 7).Format("2006-01-02")
	}

	return result
}
