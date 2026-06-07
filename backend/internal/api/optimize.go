package api

import (
	"fmt"
	"math"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/anuragh/indieyatra/backend/internal/db"
	"github.com/anuragh/indieyatra/backend/internal/models"
	"github.com/labstack/echo/v4"
)

// RouteLeg is one segment of a multi-modal journey.
type RouteLeg struct {
	Vertical      string  `json:"vertical"`        // flight/train/bus
	Operator      string  `json:"operator"`
	FlightNumber  string  `json:"flight_number,omitempty"`
	From          string  `json:"from"`
	FromCode      string  `json:"from_code"`
	To            string  `json:"to"`
	ToCode        string  `json:"to_code"`
	DepartureTime string  `json:"departure_time"`
	ArrivalTime   string  `json:"arrival_time"`
	DurationMin   int     `json:"duration_min"`
	Fare          float64 `json:"fare"`
	LayoverMin    int     `json:"layover_min"`   // wait before next leg
	LayoverNote   string  `json:"layover_note,omitempty"`
	IsOvernight   bool    `json:"is_overnight"`
}

// RouteOption is one complete multi-modal route.
type RouteOption struct {
	Label          string     `json:"label"`
	Tag            string     `json:"tag"` // e.g. "Flight + Bus"
	Legs           []RouteLeg `json:"legs"`
	TotalDurationMin int      `json:"total_duration_min"`
	TotalFare      float64    `json:"total_fare"`
	ComfortScore   int        `json:"comfort_score"` // 1–5
	CO2Kg          float64    `json:"co2_kg"`
	Warnings       []string   `json:"warnings"`
}

type optimizeReq struct {
	From        string `json:"from"`
	To          string `json:"to"`
	Date        string `json:"date"`
	Travelers   int    `json:"travelers"`
	OptimizeFor string `json:"optimize_for"` // cheapest/fastest/comfortable
}

// cityMeta holds normalization data for major Indian cities.
type cityMeta struct {
	Name       string
	IATA       string // flight airport code
	STN        string // train station code
	BusName    string // bus search city name
}

var cityMap = map[string]cityMeta{
	"bangalore": {Name: "Bangalore", IATA: "BLR", STN: "SBC", BusName: "Bangalore"},
	"bengaluru": {Name: "Bangalore", IATA: "BLR", STN: "SBC", BusName: "Bangalore"},
	"blr":       {Name: "Bangalore", IATA: "BLR", STN: "SBC", BusName: "Bangalore"},
	"mumbai":    {Name: "Mumbai", IATA: "BOM", STN: "CSMT", BusName: "Mumbai"},
	"bom":       {Name: "Mumbai", IATA: "BOM", STN: "CSMT", BusName: "Mumbai"},
	"delhi":     {Name: "Delhi", IATA: "DEL", STN: "NDLS", BusName: "Delhi"},
	"new delhi": {Name: "Delhi", IATA: "DEL", STN: "NDLS", BusName: "Delhi"},
	"del":       {Name: "Delhi", IATA: "DEL", STN: "NDLS", BusName: "Delhi"},
	"hyderabad": {Name: "Hyderabad", IATA: "HYD", STN: "SC", BusName: "Hyderabad"},
	"hyd":       {Name: "Hyderabad", IATA: "HYD", STN: "SC", BusName: "Hyderabad"},
	"chennai":   {Name: "Chennai", IATA: "MAA", STN: "MAS", BusName: "Chennai"},
	"maa":       {Name: "Chennai", IATA: "MAA", STN: "MAS", BusName: "Chennai"},
	"kolkata":   {Name: "Kolkata", IATA: "CCU", STN: "HWH", BusName: "Kolkata"},
	"ccu":       {Name: "Kolkata", IATA: "CCU", STN: "HWH", BusName: "Kolkata"},
	"goa":       {Name: "Goa", IATA: "GOI", STN: "MAO", BusName: "Goa"},
	"goi":       {Name: "Goa", IATA: "GOI", STN: "MAO", BusName: "Goa"},
	"pune":      {Name: "Pune", IATA: "PNQ", STN: "PUNE", BusName: "Pune"},
	"pnq":       {Name: "Pune", IATA: "PNQ", STN: "PUNE", BusName: "Pune"},
	"jaipur":    {Name: "Jaipur", IATA: "JAI", STN: "JP", BusName: "Jaipur"},
	"jai":       {Name: "Jaipur", IATA: "JAI", STN: "JP", BusName: "Jaipur"},
	"ahmedabad": {Name: "Ahmedabad", IATA: "AMD", STN: "ADI", BusName: "Ahmedabad"},
	"amd":       {Name: "Ahmedabad", IATA: "AMD", STN: "ADI", BusName: "Ahmedabad"},
	"leh":       {Name: "Leh", IATA: "IXL", STN: "", BusName: "Leh"},
	"ixl":       {Name: "Leh", IATA: "IXL", STN: "", BusName: "Leh"},
	"manali":    {Name: "Manali", IATA: "", STN: "", BusName: "Manali"},
	"srinagar":  {Name: "Srinagar", IATA: "SXR", STN: "", BusName: "Srinagar"},
	"sxr":       {Name: "Srinagar", IATA: "SXR", STN: "", BusName: "Srinagar"},
	"kochi":     {Name: "Kochi", IATA: "COK", STN: "ERS", BusName: "Kochi"},
	"cok":       {Name: "Kochi", IATA: "COK", STN: "ERS", BusName: "Kochi"},
	"varanasi":  {Name: "Varanasi", IATA: "VNS", STN: "BSB", BusName: "Varanasi"},
	"vns":       {Name: "Varanasi", IATA: "VNS", STN: "BSB", BusName: "Varanasi"},
}

func normalizeCity(name string) (cityMeta, bool) {
	key := strings.ToLower(strings.TrimSpace(name))
	m, ok := cityMap[key]
	return m, ok
}

func comfortForVertical(v string) int {
	switch v {
	case "flight":
		return 5
	case "train":
		return 4
	default:
		return 3
	}
}

func co2ForLeg(v string, durationMin int) float64 {
	speedKmh := map[string]float64{"flight": 800, "train": 80, "bus": 60}
	emissionsPerKm := map[string]float64{"flight": 0.255, "train": 0.041, "bus": 0.089}
	spd := speedKmh[v]
	em := emissionsPerKm[v]
	if spd == 0 {
		return 0
	}
	return math.Round(spd*(float64(durationMin)/60)*em*10) / 10
}

func buildWarnings(legs []RouteLeg) []string {
	var w []string
	for _, l := range legs {
		if l.LayoverMin > 0 && l.LayoverMin < 90 && l.Vertical == "flight" {
			w = append(w, fmt.Sprintf("%.0fh %02.0fm connection at %s — tight if flight is delayed",
				float64(l.LayoverMin)/60, math.Mod(float64(l.LayoverMin), 60), l.To))
		} else if l.LayoverMin >= 180 {
			w = append(w, fmt.Sprintf("%.0fh layover at %s — comfortable connection time", float64(l.LayoverMin)/60, l.To))
		}
		if l.IsOvernight {
			w = append(w, fmt.Sprintf("Overnight %s leg to %s — saves hotel cost", l.Vertical, l.To))
		}
	}
	return w
}

func scoreRoute(opt RouteOption, maxCost, maxTime float64, criterion string) float64 {
	costScore := 0.0
	timeScore := 0.0
	comfortScore := float64(opt.ComfortScore) / 5.0

	if maxCost > 0 {
		costScore = (maxCost - opt.TotalFare) / maxCost
	}
	if maxTime > 0 {
		timeScore = (maxTime - float64(opt.TotalDurationMin)) / maxTime
	}

	switch criterion {
	case "fastest":
		return timeScore*0.7 + costScore*0.2 + comfortScore*0.1
	case "comfortable":
		return comfortScore*0.6 + timeScore*0.3 + costScore*0.1
	default: // cheapest
		return costScore*0.7 + timeScore*0.2 + comfortScore*0.1
	}
}

// lookupFlightFare queries the DB for cheapest flight on a given date between IATA codes.
func lookupFlightFare(fromIATA, toIATA, dateStr string) (float64, string, int, bool) {
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return 0, "", 0, false
	}
	end := date.Add(24 * time.Hour)
	var s models.FlightSchedule
	if err := db.DB.Preload("Airline").
		Joins("JOIN airports fa ON fa.id = flight_schedules.from_airport_id AND fa.iata = ?", fromIATA).
		Joins("JOIN airports ta ON ta.id = flight_schedules.to_airport_id AND ta.iata = ?", toIATA).
		Where("flight_schedules.journey_date >= ? AND flight_schedules.journey_date < ?", date, end).
		Where("flight_schedules.is_active = true AND flight_schedules.available_seats > 0").
		Order("flight_schedules.base_fare + flight_schedules.taxes_and_fees ASC").
		First(&s).Error; err != nil {
		return 0, "", 0, false
	}
	return s.BaseFare + s.TaxesAndFees, s.Airline.Name, s.DurationMin, true
}

// lookupTrainFare queries the DB for cheapest available train fare on a given date.
func lookupTrainFare(fromCode, toCode, dateStr string) (float64, string, int, bool) {
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return 0, "", 0, false
	}
	end := date.Add(24 * time.Hour)
	var classes []models.TrainClassAvailability
	db.DB.Joins("JOIN train_schedules ts ON ts.id = train_class_availabilities.schedule_id").
		Joins("JOIN stations fs ON fs.id = ts.from_station_id AND fs.code = ?", fromCode).
		Joins("JOIN stations ts2 ON ts2.id = ts.to_station_id AND ts2.code = ?", toCode).
		Where("ts.journey_date >= ? AND ts.journey_date < ?", date, end).
		Where("ts.is_active = true AND train_class_availabilities.available > 0").
		Order("train_class_availabilities.base_fare ASC").
		Limit(1).Find(&classes)
	if len(classes) == 0 {
		return 0, "", 0, false
	}
	var sched models.TrainSchedule
	if err := db.DB.Preload("Train").First(&sched, "id = ?", classes[0].ScheduleID).Error; err != nil {
		return 0, "", 0, false
	}
	return classes[0].BaseFare, sched.Train.Name, sched.DurationMin, true
}

// populateLegsWithRealFares tries to fill fare/operator from the DB, falling back to estimates.
func populateLegsWithRealFares(legs []RouteLeg, date string, travelers int) []RouteLeg {
	for i := range legs {
		leg := &legs[i]
		switch leg.Vertical {
		case "flight":
			if fare, op, dur, ok := lookupFlightFare(leg.FromCode, leg.ToCode, date); ok {
				leg.Fare = fare * float64(travelers)
				leg.Operator = op
				leg.DurationMin = dur
			} else {
				leg.Fare = leg.Fare * float64(travelers)
			}
		case "train":
			if fare, op, dur, ok := lookupTrainFare(leg.FromCode, leg.ToCode, date); ok {
				leg.Fare = fare * float64(travelers)
				leg.Operator = op
				leg.DurationMin = dur
			} else {
				leg.Fare = leg.Fare * float64(travelers)
			}
		default:
			leg.Fare = leg.Fare * float64(travelers)
		}
	}
	return legs
}

// popularRouteTemplates returns multi-modal templates for well-known long-distance routes.
func popularRouteTemplates(fromCity, toCity string) [][]RouteLeg {
	from := strings.ToLower(fromCity)
	to := strings.ToLower(toCity)

	type routeKey struct{ from, to string }
	templates := map[routeKey][][]RouteLeg{
		{"bangalore", "leh"}: {
			{
				{Vertical: "flight", From: "Bangalore", FromCode: "BLR", To: "Delhi", ToCode: "DEL", DurationMin: 165, Fare: 4200, LayoverMin: 105, LayoverNote: "comfortable connection at Delhi"},
				{Vertical: "bus", Operator: "HRTC / Volvo", From: "Delhi", FromCode: "DEL", To: "Manali", ToCode: "MNL", DurationMin: 720, Fare: 850, LayoverMin: 720, LayoverNote: "overnight in Manali recommended", IsOvernight: true},
				{Vertical: "bus", Operator: "HRTC", From: "Manali", FromCode: "MNL", To: "Leh", ToCode: "IXL", DurationMin: 720, Fare: 620},
			},
			{
				{Vertical: "flight", From: "Bangalore", FromCode: "BLR", To: "Delhi", ToCode: "DEL", DurationMin: 165, Fare: 4200, LayoverMin: 180, LayoverNote: "comfortable connection"},
				{Vertical: "flight", Operator: "Air India", From: "Delhi", FromCode: "DEL", To: "Leh", ToCode: "IXL", DurationMin: 75, Fare: 6800},
			},
			{
				{Vertical: "train", From: "Bangalore", FromCode: "SBC", To: "Delhi", ToCode: "NDLS", DurationMin: 2160, Fare: 1850, LayoverMin: 240, LayoverNote: "comfortable layover at Delhi", IsOvernight: true},
				{Vertical: "bus", Operator: "HRTC / Volvo", From: "Delhi", FromCode: "DEL", To: "Manali", ToCode: "MNL", DurationMin: 720, Fare: 850, LayoverMin: 720, LayoverNote: "overnight in Manali", IsOvernight: true},
				{Vertical: "bus", Operator: "HRTC", From: "Manali", FromCode: "MNL", To: "Leh", ToCode: "IXL", DurationMin: 720, Fare: 620},
			},
		},
		{"mumbai", "goa"}: {
			{
				{Vertical: "flight", Operator: "IndiGo", From: "Mumbai", FromCode: "BOM", To: "Goa", ToCode: "GOI", DurationMin: 65, Fare: 3200},
			},
			{
				{Vertical: "train", From: "Mumbai", FromCode: "CSMT", To: "Goa", ToCode: "MAO", DurationMin: 510, Fare: 720, IsOvernight: true},
			},
			{
				{Vertical: "bus", Operator: "Paulo Travels", From: "Mumbai", FromCode: "BOM", To: "Goa", ToCode: "GOI", DurationMin: 720, Fare: 850, IsOvernight: true},
			},
		},
		{"delhi", "manali"}: {
			{
				{Vertical: "bus", Operator: "HRTC Volvo", From: "Delhi", FromCode: "NDLS", To: "Manali", ToCode: "MNL", DurationMin: 780, Fare: 950, IsOvernight: true},
			},
			{
				{Vertical: "flight", Operator: "SpiceJet", From: "Delhi", FromCode: "DEL", To: "Kullu", ToCode: "KUU", DurationMin: 75, Fare: 4500, LayoverMin: 90},
				{Vertical: "bus", Operator: "Local bus", From: "Kullu", FromCode: "KUU", To: "Manali", ToCode: "MNL", DurationMin: 90, Fare: 120},
			},
			{
				{Vertical: "bus", Operator: "HRTC ordinary", From: "Delhi", FromCode: "NDLS", To: "Manali", ToCode: "MNL", DurationMin: 840, Fare: 600, IsOvernight: true},
			},
		},
	}

	if routes, ok := templates[routeKey{from, to}]; ok {
		return routes
	}
	if routes, ok := templates[routeKey{to, from}]; ok {
		// reverse not ideal but fallback
		return routes
	}
	return nil
}

// buildGenericOptions builds route options when no template is found using available DB data.
func buildGenericOptions(fromMeta, toMeta cityMeta, date string, travelers int) []RouteOption {
	var options []RouteOption

	// Try direct flight
	if fromMeta.IATA != "" && toMeta.IATA != "" {
		if fare, op, dur, ok := lookupFlightFare(fromMeta.IATA, toMeta.IATA, date); ok {
			options = append(options, RouteOption{
				Tag: "Direct Flight",
				Legs: []RouteLeg{{
					Vertical: "flight", Operator: op,
					From: fromMeta.Name, FromCode: fromMeta.IATA,
					To: toMeta.Name, ToCode: toMeta.IATA,
					DurationMin: dur, Fare: fare * float64(travelers),
					DepartureTime: "06:00", ArrivalTime: "—",
				}},
				TotalDurationMin: dur,
				TotalFare:        fare * float64(travelers),
				ComfortScore:     5,
				CO2Kg:            co2ForLeg("flight", dur),
			})
		}
	}

	// Try direct train
	if fromMeta.STN != "" && toMeta.STN != "" {
		if fare, op, dur, ok := lookupTrainFare(fromMeta.STN, toMeta.STN, date); ok {
			options = append(options, RouteOption{
				Tag: "Direct Train",
				Legs: []RouteLeg{{
					Vertical: "train", Operator: op,
					From: fromMeta.Name, FromCode: fromMeta.STN,
					To: toMeta.Name, ToCode: toMeta.STN,
					DurationMin: dur, Fare: fare * float64(travelers),
					DepartureTime: "07:00", ArrivalTime: "—",
					IsOvernight: dur > 480,
				}},
				TotalDurationMin: dur,
				TotalFare:        fare * float64(travelers),
				ComfortScore:     4,
				CO2Kg:            co2ForLeg("train", dur),
			})
		}
	}

	// Generic bus estimate
	if len(options) < 3 {
		// Estimate ~500 km journey at ₹0.8/km/person base, 8h drive
		busEstFare := 800.0 * float64(travelers)
		busDur := 540
		options = append(options, RouteOption{
			Tag: "Bus",
			Legs: []RouteLeg{{
				Vertical: "bus", Operator: "Multiple operators",
				From: fromMeta.Name, FromCode: fromMeta.BusName,
				To: toMeta.Name, ToCode: toMeta.BusName,
				DurationMin: busDur, Fare: busEstFare,
				DepartureTime: "21:00", IsOvernight: true,
			}},
			TotalDurationMin: busDur,
			TotalFare:        busEstFare,
			ComfortScore:     3,
			CO2Kg:            co2ForLeg("bus", busDur),
		})
	}

	return options
}

// POST /api/optimize/routes
func (h *Handlers) OptimizeRoutes(c echo.Context) error {
	var req optimizeReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	if req.From == "" || req.To == "" || req.Date == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "from, to, date are required"})
	}
	if req.Travelers <= 0 {
		req.Travelers = 1
	}
	if req.OptimizeFor == "" {
		req.OptimizeFor = "cheapest"
	}

	fromMeta, fromOK := normalizeCity(req.From)
	toMeta, toOK := normalizeCity(req.To)
	if !fromOK {
		fromMeta = cityMeta{Name: req.From, BusName: req.From}
	}
	if !toOK {
		toMeta = cityMeta{Name: req.To, BusName: req.To}
	}

	var options []RouteOption

	// Try template-based popular routes first
	templates := popularRouteTemplates(fromMeta.Name, toMeta.Name)
	if len(templates) > 0 {
		for i, legDefs := range templates {
			legs := populateLegsWithRealFares(legDefs, req.Date, req.Travelers)
			total := 0.0
			dur := 0
			co2 := 0.0
			comfort := 5
			tag := ""
			var tagParts []string
			for _, l := range legs {
				total += l.Fare
				dur += l.DurationMin + l.LayoverMin
				co2 += co2ForLeg(l.Vertical, l.DurationMin)
				if comfortForVertical(l.Vertical) < comfort {
					comfort = comfortForVertical(l.Vertical)
				}
				tagParts = append(tagParts, strings.Title(l.Vertical)) //nolint:staticcheck
			}
			// deduplicate tag parts
			seen := map[string]bool{}
			var uniqueParts []string
			for _, p := range tagParts {
				if !seen[p] {
					uniqueParts = append(uniqueParts, p)
					seen[p] = true
				}
			}
			tag = strings.Join(uniqueParts, " + ")
			options = append(options, RouteOption{
				Label:          fmt.Sprintf("Option %d — %s", i+1, tag),
				Tag:            tag,
				Legs:           legs,
				TotalDurationMin: dur,
				TotalFare:      math.Round(total*100) / 100,
				ComfortScore:   comfort,
				CO2Kg:          math.Round(co2*10) / 10,
				Warnings:       buildWarnings(legs),
			})
		}
	} else {
		// Generic: query DB for direct options
		options = buildGenericOptions(fromMeta, toMeta, req.Date, req.Travelers)
		for i := range options {
			options[i].Label = fmt.Sprintf("Option %d — %s", i+1, options[i].Tag)
			options[i].Warnings = buildWarnings(options[i].Legs)
		}
	}

	if len(options) == 0 {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"options": []RouteOption{},
			"from":    fromMeta.Name,
			"to":      toMeta.Name,
			"date":    req.Date,
			"message": "No routes found for this combination. Try different cities or dates.",
		})
	}

	// Score and sort by criterion
	maxCost := 0.0
	maxTime := 0.0
	for _, o := range options {
		if o.TotalFare > maxCost {
			maxCost = o.TotalFare
		}
		if float64(o.TotalDurationMin) > maxTime {
			maxTime = float64(o.TotalDurationMin)
		}
	}
	sort.Slice(options, func(i, j int) bool {
		si := scoreRoute(options[i], maxCost, maxTime, req.OptimizeFor)
		sj := scoreRoute(options[j], maxCost, maxTime, req.OptimizeFor)
		return si > sj
	})

	// Re-label after sort
	for i := range options {
		tagPart := options[i].Tag
		options[i].Label = fmt.Sprintf("Option %d — %s", i+1, tagPart)
	}

	// Cap at 3 options
	if len(options) > 3 {
		options = options[:3]
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"options":      options,
		"from":         fromMeta.Name,
		"to":           toMeta.Name,
		"date":         req.Date,
		"travelers":    req.Travelers,
		"optimize_for": req.OptimizeFor,
	})
}

// GET /api/optimize/popular-combinations
func (h *Handlers) PopularCombinations(c echo.Context) error {
	popular := []map[string]interface{}{
		{"from": "Bangalore", "to": "Leh", "tag": "Flight + Bus", "savings": "₹3,200"},
		{"from": "Mumbai", "to": "Goa", "tag": "Train (overnight)", "savings": "₹2,100"},
		{"from": "Delhi", "to": "Manali", "tag": "Volvo Bus", "savings": "₹4,500"},
		{"from": "Chennai", "to": "Bangalore", "tag": "Train + Metro", "savings": "₹800"},
		{"from": "Hyderabad", "to": "Goa", "tag": "Flight + Bus", "savings": "₹1,800"},
		{"from": "Delhi", "to": "Jaipur", "tag": "Bus", "savings": "₹600"},
		{"from": "Mumbai", "to": "Pune", "tag": "Bus / Train", "savings": "₹400"},
		{"from": "Bangalore", "to": "Kochi", "tag": "Train", "savings": "₹1,200"},
		{"from": "Delhi", "to": "Varanasi", "tag": "Train overnight", "savings": "₹2,800"},
		{"from": "Kolkata", "to": "Darjeeling", "tag": "Train + Bus", "savings": "₹1,500"},
	}
	return c.JSON(http.StatusOK, popular)
}
