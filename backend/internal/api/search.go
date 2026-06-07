package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/anuragh/indieyatra/backend/internal/db"
	"github.com/anuragh/indieyatra/backend/internal/models"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// calendarDays parses the &days= query param for fare-calendar requests,
// clamped to [1, 60]. Defaults to 14.
func calendarDays(c echo.Context) int {
	n, err := strconv.Atoi(c.QueryParam("days"))
	if err != nil || n < 1 {
		return 14
	}
	if n > 60 {
		return 60
	}
	return n
}

type fareCalendarDay struct {
	Date    string  `json:"date"`
	MinFare float64 `json:"min_fare"`
}

// fareCalendarResponse runs a grouped MIN(fare)-per-day query over a date
// window and returns [{date, min_fare}] for the PriceCalendar widget. The
// caller supplies a pre-filtered query, the fully-qualified date column, the
// window start, and the number of days.
func fareCalendarResponse(c echo.Context, q *gorm.DB, dateCol string, start time.Time, days int) error {
	end := start.Add(time.Duration(days) * 24 * time.Hour)
	var rows []fareCalendarDay
	q.Where(dateCol+" >= ? AND "+dateCol+" < ?", start, end).
		Group("1").Order("1").Scan(&rows)
	return c.JSON(http.StatusOK, rows)
}

func (h *Handlers) SearchSuggestions(c echo.Context) error {
	q := strings.ToLower(strings.TrimSpace(c.QueryParam("q")))
	if q == "" || len(q) < 2 {
		return c.JSON(http.StatusOK, []models.City{})
	}

	var cities []models.City
	db.DB.Where("LOWER(name) LIKE ? OR LOWER(state) LIKE ?", q+"%", "%"+q+"%").
		Order("popularity DESC").
		Limit(8).
		Find(&cities)
	return c.JSON(http.StatusOK, cities)
}

func (h *Handlers) SearchBuses(c echo.Context) error {
	from := strings.ToUpper(c.QueryParam("from"))
	to := strings.ToUpper(c.QueryParam("to"))
	dateStr := c.QueryParam("date")
	travelersStr := c.QueryParam("travelers")

	if from == "" || to == "" || dateStr == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "from, to, date are required"})
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid date format (YYYY-MM-DD)"})
	}
	travelers := 1
	if travelersStr != "" {
		// best-effort parse
		for _, ch := range travelersStr {
			if ch < '0' || ch > '9' {
				break
			}
			travelers = travelers*10 + int(ch-'0')
		}
	}

	if c.QueryParam("fare_calendar") != "" {
		return fareCalendarResponse(c, db.DB.Model(&models.Schedule{}).
			Select("to_char(schedules.departure_at, 'YYYY-MM-DD') AS date, MIN(schedules.base_fare) AS min_fare").
			Joins("JOIN routes r ON r.id = schedules.route_id").
			Joins("JOIN cities fc ON fc.id = r.from_city_id AND fc.code = ?", from).
			Joins("JOIN cities tc ON tc.id = r.to_city_id AND tc.code = ?", to).
			Where("schedules.is_active = true AND schedules.seats_available > 0"),
			"schedules.departure_at", date.Truncate(24*time.Hour), calendarDays(c))
	}

	cacheKey := from + "|" + to + "|" + dateStr + "|" + travelersStr
	if cached, _ := db.GetCachedSearch(c.Request().Context(), cacheKey); cached != "" {
		c.Response().Header().Set("Content-Type", "application/json")
		c.Response().Header().Set("X-Cache", "HIT")
		return c.String(http.StatusOK, cached)
	}

	var routes []models.Route
	db.DB.Where("from_city_id IN (SELECT id FROM cities WHERE code = ?) AND to_city_id IN (SELECT id FROM cities WHERE code = ?)", from, to).
		Find(&routes)

	if len(routes) == 0 {
		return c.JSON(http.StatusOK, []models.Schedule{})
	}

	routeIDs := make([]string, len(routes))
	for i, r := range routes {
		routeIDs[i] = r.ID.String()
	}

	startOfDay := date
	endOfDay := date.Add(24 * time.Hour)

	var schedules []models.Schedule
	db.DB.Preload("Route.FromCity").
		Preload("Route.ToCity").
		Preload("Bus").
		Preload("Operator").
		Where("route_id IN ? AND departure_at >= ? AND departure_at < ?", routeIDs, startOfDay, endOfDay).
		Where("seats_available >= ?", travelers).
		Where("is_active = ?", true).
		Order("base_fare ASC").
		Find(&schedules)

	if b, err := json.Marshal(schedules); err == nil {
		_ = db.CacheSearch(c.Request().Context(), cacheKey, string(b))
	}
	c.Response().Header().Set("X-Cache", "MISS")
	// Cosmetic: the Bus.Operator preloaded by GORM is a zero-value Operator
	// (Bus.OperatorID is a separate ID from the schedule's operator), and
	// rendering that empty bubble in the UI looks wrong. Strip it on the way out
	// by overriding the response with DTOs that don't include the nested field.
	out := make([]scheduleResponse, len(schedules))
	for i, s := range schedules {
		// Strip the empty operator we just zeroed so it doesn't JSON-serialize.
		s.Bus.Operator = models.Operator{}
		out[i] = scheduleResponse{Schedule: s}
	}
	return c.JSON(http.StatusOK, out)
}

// scheduleResponse is a wire-level wrapper that hides Bus.Operator on the
// search response. We embed Schedule but override the Bus field to drop the
// nested operator preloaded by GORM.
type scheduleResponse struct {
	models.Schedule
	Bus busWithoutOperator `json:"bus"`
}

type busWithoutOperator struct {
	models.Bus
	// Override the Operator field with one that omits when zero.
	Operator *models.Operator `json:"operator,omitempty"`
}

func (h *Handlers) PopularRoutes(c echo.Context) error {
	var routes []models.Route
	db.DB.Preload("FromCity").Preload("ToCity").
		Order("popularity DESC").Limit(8).Find(&routes)
	return c.JSON(http.StatusOK, routes)
}

func (h *Handlers) TopDestinations(c echo.Context) error {
	var cities []models.City
	db.DB.Order("popularity DESC").Limit(8).Find(&cities)
	return c.JSON(http.StatusOK, cities)
}

func (h *Handlers) GetBus(c echo.Context) error {
	id := c.Param("id")
	var bus models.Bus
	if err := db.DB.Preload("Operator").Where("id = ?", id).First(&bus).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "bus not found"})
	}
	return c.JSON(http.StatusOK, bus)
}

func (h *Handlers) GetBusSeats(c echo.Context) error {
	scheduleID := c.Param("id")
	dateStr := c.QueryParam("date")

	var seats []models.Seat
	q := db.DB.Where("schedule_id = ?", scheduleID)
	if dateStr != "" {
		// in our model seats are per-schedule (recurring), filter by date if needed
		_ = dateStr
	}
	q.Find(&seats)
	return c.JSON(http.StatusOK, seats)
}
