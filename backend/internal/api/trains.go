package api

import (
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/anuragh/indieyatra/backend/internal/auth"
	"github.com/anuragh/indieyatra/backend/internal/db"
	"github.com/anuragh/indieyatra/backend/internal/models"
	"github.com/anuragh/indieyatra/backend/internal/seed"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// TrainStationsAutocomplete returns station suggestions matching query.
func (h *Handlers) TrainStationsAutocomplete(c echo.Context) error {
	q := strings.TrimSpace(c.QueryParam("q"))
	if len(q) < 2 {
		return c.JSON(http.StatusOK, []models.Station{})
	}
	qUpper := strings.ToUpper(q)
	qLower := strings.ToLower(q)

	var stations []models.Station
	db.DB.Where(
		"UPPER(code) LIKE ? OR LOWER(name) LIKE ? OR LOWER(city) LIKE ?",
		qUpper+"%", "%"+qLower+"%", "%"+qLower+"%",
	).Order("name ASC").Limit(10).Find(&stations)

	return c.JSON(http.StatusOK, stations)
}

type classInfo struct {
	Class      string  `json:"class"`
	Available  int     `json:"available"`
	RAC        int     `json:"rac"`
	Waitlist   int     `json:"waitlist"`
	Status     string  `json:"status"`
	Fare       float64 `json:"fare"`
	TatkalFare float64 `json:"tatkal_fare"`
}

type trainSearchResult struct {
	ScheduleID    string      `json:"schedule_id"`
	TrainID       string      `json:"train_id"`
	TrainNumber   string      `json:"train_number"`
	TrainName     string      `json:"train_name"`
	TrainType     string      `json:"train_type"`
	IsSuperfast   bool        `json:"is_superfast"`
	HasPantry     bool        `json:"has_pantry"`
	RunsOn        string      `json:"runs_on"`
	FromCode      string      `json:"from_code"`
	FromName      string      `json:"from_name"`
	ToCode        string      `json:"to_code"`
	ToName        string      `json:"to_name"`
	DepartureTime string      `json:"departure_time"`
	ArrivalTime   string      `json:"arrival_time"`
	ArrivalDay    int         `json:"arrival_day"`
	DurationMin   int         `json:"duration_min"`
	DurationStr   string      `json:"duration_str"`
	Date          string      `json:"date"`
	Classes       []classInfo `json:"classes"`
}

// SearchTrains handles GET /api/trains/search
func (h *Handlers) SearchTrains(c echo.Context) error {
	from := strings.ToUpper(strings.TrimSpace(c.QueryParam("from")))
	to := strings.ToUpper(strings.TrimSpace(c.QueryParam("to")))
	dateStr := c.QueryParam("date")
	classFilter := strings.ToUpper(strings.TrimSpace(c.QueryParam("class")))

	if from == "" || to == "" || dateStr == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "from, to, date are required"})
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid date format (YYYY-MM-DD)"})
	}

	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
	endOfDay := startOfDay.Add(24 * time.Hour)

	if c.QueryParam("fare_calendar") != "" {
		return fareCalendarResponse(c, db.DB.Model(&models.TrainSchedule{}).
			Select("to_char(train_schedules.journey_date, 'YYYY-MM-DD') AS date, MIN(tca.base_fare) AS min_fare").
			Joins(`JOIN train_route_stops from_stop ON from_stop.train_id::uuid = train_schedules.train_id
				AND from_stop.deleted_at IS NULL
				AND from_stop.station_id = (SELECT id FROM stations WHERE code = ? AND deleted_at IS NULL LIMIT 1)`, from).
			Joins(`JOIN train_route_stops to_stop ON to_stop.train_id::uuid = train_schedules.train_id
				AND to_stop.deleted_at IS NULL
				AND to_stop.station_id = (SELECT id FROM stations WHERE code = ? AND deleted_at IS NULL LIMIT 1)`, to).
			Joins("JOIN train_class_availabilities tca ON tca.schedule_id = train_schedules.id AND tca.available > 0").
			Where("from_stop.stop_number < to_stop.stop_number").
			Where("train_schedules.is_active = true"),
			"train_schedules.journey_date", startOfDay, calendarDays(c))
	}

	// Search by route stops so any intermediate station pair works (not just origin→terminus).
	// train_route_stops.train_id is stored as text; cast to uuid for the join.
	var schedules []models.TrainSchedule
	db.DB.Preload("Train").
		Preload("FromStation").
		Preload("ToStation").
		Joins(`JOIN train_route_stops from_stop ON from_stop.train_id::uuid = train_schedules.train_id
			AND from_stop.deleted_at IS NULL
			AND from_stop.station_id = (SELECT id FROM stations WHERE code = ? AND deleted_at IS NULL LIMIT 1)`, from).
		Joins(`JOIN train_route_stops to_stop ON to_stop.train_id::uuid = train_schedules.train_id
			AND to_stop.deleted_at IS NULL
			AND to_stop.station_id = (SELECT id FROM stations WHERE code = ? AND deleted_at IS NULL LIMIT 1)`, to).
		Where("from_stop.stop_number < to_stop.stop_number").
		Where("train_schedules.journey_date >= ? AND train_schedules.journey_date < ?", startOfDay, endOfDay).
		Where("train_schedules.is_active = ?", true).
		Order("train_schedules.departure_time ASC").
		Find(&schedules)

	results := make([]trainSearchResult, 0, len(schedules))
	for _, s := range schedules {
		var classes []models.TrainClassAvailability
		q := db.DB.Where("schedule_id = ?", s.ID)
		if classFilter != "" {
			q = q.Where("class = ?", classFilter)
		}
		q.Order("CASE class WHEN '1A' THEN 1 WHEN '2A' THEN 2 WHEN '3A' THEN 3 WHEN 'SL' THEN 4 WHEN 'EC' THEN 5 WHEN 'CC' THEN 6 WHEN '2S' THEN 7 ELSE 8 END").
			Find(&classes)

		classInfos := make([]classInfo, 0, len(classes))
		for _, cl := range classes {
			classInfos = append(classInfos, classInfo{
				Class:      cl.Class,
				Available:  cl.Available,
				RAC:        cl.RAC,
				Waitlist:   cl.WaitlistCount,
				Status:     cl.Status,
				Fare:       cl.BaseFare,
				TatkalFare: cl.TatkalFare,
			})
		}

		dh := s.DurationMin / 60
		dm := s.DurationMin % 60
		durStr := fmt.Sprintf("%dh %02dm", dh, dm)

		results = append(results, trainSearchResult{
			ScheduleID:    s.ID.String(),
			TrainID:       s.TrainID.String(),
			TrainNumber:   s.Train.Number,
			TrainName:     s.Train.Name,
			TrainType:     s.Train.TrainType,
			IsSuperfast:   s.Train.IsSuperfast,
			HasPantry:     s.Train.HasPantry,
			RunsOn:        s.Train.RunsOn,
			FromCode:      s.FromStation.Code,
			FromName:      s.FromStation.Name,
			ToCode:        s.ToStation.Code,
			ToName:        s.ToStation.Name,
			DepartureTime: s.DepartureTime,
			ArrivalTime:   s.ArrivalTime,
			ArrivalDay:    s.ArrivalDay,
			DurationMin:   s.DurationMin,
			DurationStr:   durStr,
			Date:          s.JourneyDate.Format("2006-01-02"),
			Classes:       classInfos,
		})
	}

	return c.JSON(http.StatusOK, results)
}

type trainDetailResponse struct {
	Schedule models.TrainSchedule            `json:"schedule"`
	Stops    []models.TrainRouteStop         `json:"stops"`
	Classes  []models.TrainClassAvailability `json:"classes"`
}

// GetTrainSchedule handles GET /api/trains/schedule/:id
func (h *Handlers) GetTrainSchedule(c echo.Context) error {
	id := c.Param("id")

	var schedule models.TrainSchedule
	if err := db.DB.Preload("Train").Preload("FromStation").Preload("ToStation").
		Where("id = ?", id).First(&schedule).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "schedule not found"})
	}

	var stops []models.TrainRouteStop
	db.DB.Preload("Station").
		Where("train_id = ?", schedule.TrainID).
		Order("stop_number ASC").
		Find(&stops)

	var classes []models.TrainClassAvailability
	db.DB.Where("schedule_id = ?", id).
		Order("CASE class WHEN '1A' THEN 1 WHEN '2A' THEN 2 WHEN '3A' THEN 3 WHEN 'SL' THEN 4 WHEN 'EC' THEN 5 WHEN 'CC' THEN 6 WHEN '2S' THEN 7 ELSE 8 END").
		Find(&classes)

	return c.JSON(http.StatusOK, trainDetailResponse{
		Schedule: schedule,
		Stops:    stops,
		Classes:  classes,
	})
}

// GetPNRStatus handles GET /api/trains/pnr/:pnr
func (h *Handlers) GetPNRStatus(c echo.Context) error {
	pnr := strings.TrimSpace(c.Param("pnr"))

	var booking models.TrainBooking
	if err := db.DB.
		Preload("Schedule.Train").
		Preload("Schedule.FromStation").
		Preload("Schedule.ToStation").
		Preload("Passengers").
		Where("pnr = ?", pnr).First(&booking).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "PNR not found"})
	}

	return c.JSON(http.StatusOK, booking)
}

type createTrainBookingReq struct {
	ScheduleID string `json:"schedule_id"`
	Class      string `json:"class"`
	Quota      string `json:"quota"`
	Passengers []struct {
		FullName        string `json:"full_name"`
		Age             int    `json:"age"`
		Gender          string `json:"gender"`
		BerthPreference string `json:"berth_preference"`
		IDType          string `json:"id_type"`
		IDNumber        string `json:"id_number"`
		IsSenior        bool   `json:"is_senior"`
		MealPreference  string `json:"meal_preference"`
	} `json:"passengers"`
	ContactEmail string `json:"contact_email"`
	ContactPhone string `json:"contact_phone"`
	Insurance    bool   `json:"insurance"`
}

// CreateTrainBooking handles POST /api/trains/bookings/create (auth required)
func (h *Handlers) CreateTrainBooking(c echo.Context) error {
	userIDStr, ok := c.Get(auth.UserIDKey).(string)
	if !ok || userIDStr == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid user id"})
	}

	var req createTrainBookingReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}
	if req.ScheduleID == "" || req.Class == "" || len(req.Passengers) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "schedule_id, class, and passengers are required"})
	}
	if len(req.Passengers) > 6 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "max 6 passengers per booking"})
	}

	schedID, err := uuid.Parse(req.ScheduleID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid schedule_id"})
	}

	var avail models.TrainClassAvailability
	if err := db.DB.Where("schedule_id = ? AND class = ?", schedID, req.Class).
		First(&avail).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "class not available for this schedule"})
	}

	if avail.Available < len(req.Passengers) && avail.RAC == 0 && avail.WaitlistCount >= 200 {
		return c.JSON(http.StatusConflict, map[string]string{"error": "no availability in requested class"})
	}

	var schedule models.TrainSchedule
	if err := db.DB.Preload("Train").Preload("FromStation").Preload("ToStation").
		Where("id = ?", schedID).First(&schedule).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "schedule not found"})
	}

	quota := req.Quota
	if quota == "" {
		quota = "GN"
	}

	// Fare calculation
	fare := avail.BaseFare
	if quota == "TQ" {
		fare = avail.TatkalFare
	}
	reservationFee := 60.0
	superfastFee := 0.0
	if schedule.Train.IsSuperfast {
		superfastFee = 45.0
	}
	irctcFee := 15.0 * float64(len(req.Passengers))
	insuranceFee := 0.0
	if req.Insurance {
		insuranceFee = 35.0 * float64(len(req.Passengers))
	}

	baseTotal := fare * float64(len(req.Passengers))
	gst := math.Round((baseTotal+reservationFee+superfastFee)*0.05*100) / 100
	total := math.Round((baseTotal+reservationFee+superfastFee+gst+irctcFee+insuranceFee)*100) / 100

	booking := models.TrainBooking{
		UserID:         userID,
		ScheduleID:     schedID,
		BookingRef:     seed.GenerateTrainRef(),
		PNR:            seed.GenerateTrainPNR(),
		Class:          req.Class,
		Quota:          quota,
		Status:         "confirmed",
		TotalAmount:    total,
		BaseFare:       baseTotal,
		ReservationFee: reservationFee,
		SuperfastFee:   superfastFee,
		GSTAmount:      gst,
		IRCTCFee:       irctcFee,
		InsuranceFee:   insuranceFee,
		Currency:       "INR",
		ContactEmail:   req.ContactEmail,
		ContactPhone:   req.ContactPhone,
	}

	coaches := []string{"S1", "S2", "S3", "B1", "B2", "A1"}
	berthTypes := []string{"Lower", "Middle", "Upper", "Side Lower", "Side Upper"}

	var passengers []models.TrainPassenger
	for i, p := range req.Passengers {
		status := "CNF"
		coach := coaches[rand.Intn(len(coaches))]
		berth := fmt.Sprintf("%d", 1+rand.Intn(72))
		if avail.Available <= i {
			if avail.RAC > 0 {
				status = fmt.Sprintf("RAC%d", i+1)
				coach = "S1"
				berth = "RAC"
			} else {
				status = fmt.Sprintf("WL%d", avail.WaitlistCount+i+1)
				coach = ""
				berth = ""
			}
		}
		bp := p.BerthPreference
		if bp == "" {
			bp = berthTypes[rand.Intn(len(berthTypes))]
		}
		passengers = append(passengers, models.TrainPassenger{
			TrainBookingID:  booking.ID,
			FullName:        p.FullName,
			Age:             p.Age,
			Gender:          p.Gender,
			BerthPreference: bp,
			IDType:          p.IDType,
			IDNumber:        p.IDNumber,
			IsSenior:        p.IsSenior,
			MealPreference:  p.MealPreference,
			Coach:           coach,
			BerthNumber:     berth,
			Status:          status,
		})
	}

	booking.Passengers = passengers

	if err := db.DB.Create(&booking).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to create booking"})
	}

	// Decrement availability
	if avail.Available >= len(req.Passengers) {
		db.DB.Model(&avail).Update("available", avail.Available-len(req.Passengers))
	}
	db.DB.Model(&avail).Update("status",
		func() string {
			if avail.Available-len(req.Passengers) > 0 {
				return "AVAILABLE"
			}
			if avail.RAC > 0 {
				return "RAC"
			}
			return "WL"
		}(),
	)

	if err := db.DB.Preload("Schedule.Train").Preload("Schedule.FromStation").
		Preload("Schedule.ToStation").Preload("Passengers").
		First(&booking, "id = ?", booking.ID).Error; err == nil {
		// best-effort: booking reloaded with preloads
	}

	go SendTrainBookingNotifications(h.EmailSvc, booking, req.ContactEmail, req.ContactPhone)

	return c.JSON(http.StatusCreated, booking)
}

// GET /api/trains/bookings/:id
func (h *Handlers) GetTrainBooking(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid id"})
	}
	var booking models.TrainBooking
	if err := db.DB.Preload("Schedule.Train").Preload("Schedule.FromStation").
		Preload("Schedule.ToStation").Preload("Passengers").
		Where("id = ? AND user_id = ?", id, uid).First(&booking).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "booking not found"})
	}
	return c.JSON(http.StatusOK, booking)
}

// GET /api/trains/bookings/user/me
func (h *Handlers) ListUserTrainBookings(c echo.Context) error {
	uid := auth.GetUserID(c)
	if uid == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	var bookings []models.TrainBooking
	db.DB.Preload("Schedule.Train").
		Preload("Schedule.FromStation").
		Preload("Schedule.ToStation").
		Preload("Passengers").
		Where("user_id = ?", uid).
		Order("created_at DESC").
		Find(&bookings)
	if bookings == nil {
		bookings = []models.TrainBooking{}
	}
	return c.JSON(http.StatusOK, bookings)
}
