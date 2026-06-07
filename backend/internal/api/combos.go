package api

import (
	"math"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/anuragh/indieyatra/backend/internal/db"
	"github.com/anuragh/indieyatra/backend/internal/models"
	"github.com/labstack/echo/v4"
)

// hotelCityAlias maps an optimizer city name to the name used in the hotel
// seed where they differ (e.g. the hotels table uses "Bengaluru").
var hotelCityAlias = map[string]string{
	"bangalore": "Bengaluru",
}

// lookupBusFare returns the cheapest active bus fare between two city codes on
// a date, plus an operator label and duration.
func lookupBusFare(fromCode, toCode, dateStr string) (float64, string, int, bool) {
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return 0, "", 0, false
	}
	end := date.Add(24 * time.Hour)
	var s models.Schedule
	if err := db.DB.Preload("Operator").
		Joins("JOIN routes r ON r.id = schedules.route_id").
		Joins("JOIN cities fc ON fc.id = r.from_city_id AND fc.code = ?", fromCode).
		Joins("JOIN cities tc ON tc.id = r.to_city_id AND tc.code = ?", toCode).
		Where("schedules.departure_at >= ? AND schedules.departure_at < ?", date, end).
		Where("schedules.is_active = true AND schedules.seats_available > 0").
		Order("schedules.base_fare ASC").
		First(&s).Error; err != nil {
		return 0, "", 0, false
	}
	return s.BaseFare, s.Operator.Name, s.DurationMin, true
}

// lookupCheapestHotel returns the cheapest available hotel in a city and its
// lowest per-night room price.
func lookupCheapestHotel(city string) (*models.Hotel, float64, bool) {
	if alias, ok := hotelCityAlias[strings.ToLower(city)]; ok {
		city = alias
	}
	var hotels []models.Hotel
	db.DB.Where("is_active = true AND LOWER(city) = ?", strings.ToLower(city)).Find(&hotels)
	var best *models.Hotel
	bestPrice := 0.0
	for i := range hotels {
		var room models.HotelRoom
		if err := db.DB.Where("hotel_id = ? AND is_active = true AND available_rooms > 0", hotels[i].ID).
			Order("price_per_night ASC").First(&room).Error; err != nil {
			continue
		}
		if best == nil || room.PricePerNight < bestPrice {
			best = &hotels[i]
			bestPrice = room.PricePerNight
		}
	}
	if best == nil {
		return nil, 0, false
	}
	return best, bestPrice, true
}

type comboReq struct {
	From      string `json:"from"`
	To        string `json:"to"`
	Date      string `json:"date"`
	Travelers int    `json:"travelers"`
	Nights    int    `json:"nights"`
}

type comboTransport struct {
	Vertical    string  `json:"vertical"`
	Operator    string  `json:"operator"`
	From        string  `json:"from"`
	To          string  `json:"to"`
	DurationMin int     `json:"duration_min"`
	FarePerHead float64 `json:"fare_per_head"`
}

type comboHotel struct {
	HotelID       string  `json:"hotel_id"`
	Name          string  `json:"name"`
	City          string  `json:"city"`
	StarRating    int     `json:"star_rating"`
	Rating        float64 `json:"rating"`
	ImageURL      string  `json:"image_url"`
	PricePerNight float64 `json:"price_per_night"`
}

type comboDeal struct {
	Tag           string         `json:"tag"` // "Flight + Hotel"
	Transport     comboTransport `json:"transport"`
	Hotel         comboHotel     `json:"hotel"`
	Travelers     int            `json:"travelers"`
	Nights        int            `json:"nights"`
	TransportCost float64        `json:"transport_cost"` // fare * travelers
	HotelCost     float64        `json:"hotel_cost"`     // price * nights
	BundleSaving  float64        `json:"bundle_saving"`
	TotalCost     float64        `json:"total_cost"`
}

// POST /api/combos/search — transport + hotel "Bundle & Save" deals.
func (h *Handlers) SearchCombos(c echo.Context) error {
	var req comboReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}
	if req.From == "" || req.To == "" || req.Date == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "from, to, date are required"})
	}
	if req.Travelers <= 0 {
		req.Travelers = 1
	}
	if req.Nights <= 0 {
		req.Nights = 2
	}

	fromMeta, _ := normalizeCity(req.From)
	toMeta, ok := normalizeCity(req.To)
	if fromMeta.Name == "" {
		fromMeta = cityMeta{Name: req.From, BusName: req.From}
	}
	if !ok {
		toMeta = cityMeta{Name: req.To, BusName: req.To}
	}

	hotel, hotelPrice, hotelOK := lookupCheapestHotel(toMeta.Name)
	if !hotelOK {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"deals":   []comboDeal{},
			"from":    fromMeta.Name,
			"to":      toMeta.Name,
			"message": "No hotels available at the destination to bundle.",
		})
	}

	hotelLeg := comboHotel{
		HotelID:       hotel.ID.String(),
		Name:          hotel.Name,
		City:          hotel.City,
		StarRating:    hotel.StarRating,
		Rating:        hotel.Rating,
		ImageURL:      hotel.ImageURL,
		PricePerNight: hotelPrice,
	}
	hotelCost := hotelPrice * float64(req.Nights)

	// Bundle discount: 10% off the stay when booked with transport.
	bundleSaving := math.Round(hotelCost*0.10*100) / 100

	var deals []comboDeal
	addDeal := func(vertical, tag, operator, fromLabel, toLabel string, farePerHead float64, dur int) {
		transportCost := farePerHead * float64(req.Travelers)
		deals = append(deals, comboDeal{
			Tag: tag,
			Transport: comboTransport{
				Vertical: vertical, Operator: operator,
				From: fromLabel, To: toLabel,
				DurationMin: dur, FarePerHead: farePerHead,
			},
			Hotel:         hotelLeg,
			Travelers:     req.Travelers,
			Nights:        req.Nights,
			TransportCost: math.Round(transportCost*100) / 100,
			HotelCost:     math.Round(hotelCost*100) / 100,
			BundleSaving:  bundleSaving,
			TotalCost:     math.Round((transportCost+hotelCost-bundleSaving)*100) / 100,
		})
	}

	if fromMeta.IATA != "" && toMeta.IATA != "" {
		if fare, op, dur, ok := lookupFlightFare(fromMeta.IATA, toMeta.IATA, req.Date); ok {
			addDeal("flight", "Flight + Hotel", op, fromMeta.Name, toMeta.Name, fare, dur)
		}
	}
	if fromMeta.STN != "" && toMeta.STN != "" {
		if fare, op, dur, ok := lookupTrainFare(fromMeta.STN, toMeta.STN, req.Date); ok {
			addDeal("train", "Train + Hotel", op, fromMeta.Name, toMeta.Name, fare, dur)
		}
	}
	if fare, op, dur, ok := lookupBusFare(busCityCode(fromMeta.Name), busCityCode(toMeta.Name), req.Date); ok {
		addDeal("bus", "Bus + Hotel", op, fromMeta.Name, toMeta.Name, fare, dur)
	}

	sort.Slice(deals, func(i, j int) bool { return deals[i].TotalCost < deals[j].TotalCost })

	return c.JSON(http.StatusOK, map[string]interface{}{
		"deals":     deals,
		"from":      fromMeta.Name,
		"to":        toMeta.Name,
		"date":      req.Date,
		"travelers": req.Travelers,
		"nights":    req.Nights,
	})
}

// busCityCode resolves a city name to its bus city code from the cities table.
func busCityCode(name string) string {
	var city models.City
	if err := db.DB.Where("LOWER(name) = ?", strings.ToLower(name)).First(&city).Error; err != nil {
		return ""
	}
	return city.Code
}
