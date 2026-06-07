package seed

import (
	"log"
	"math/rand"
	"time"

	"github.com/anuragh/indieyatra/backend/internal/db"
	"github.com/anuragh/indieyatra/backend/internal/models"
	"github.com/google/uuid"
)

// GenerateTrainSchedules creates TrainSchedule + TrainClassAvailability records
// for the next `days` days using the imported trains and route stops.
// Safe to call repeatedly — skips if schedules already exist.
func GenerateTrainSchedules(days int) error {
	var schedCount int64
	db.DB.Model(&models.TrainSchedule{}).Count(&schedCount)
	if schedCount > 10000 {
		log.Printf("✓ Train schedules already generated (%d), skipping", schedCount)
		return nil
	}

	// Load all trains
	var trains []models.Train
	if err := db.DB.Find(&trains).Error; err != nil {
		return err
	}
	if len(trains) == 0 {
		log.Println("⚠ No trains found, skipping schedule generation")
		return nil
	}

	// For each train, get its first and last route stop to use as from/to
	type trainEndpoints struct {
		TrainID       uuid.UUID
		FromStationID uuid.UUID
		ToStationID   uuid.UUID
		DepTime       string
		ArrTime       string
		DurationMin   int
		ArrivalDay    int
	}

	var endpoints []trainEndpoints

	type stopRow struct {
		TrainID       uuid.UUID
		StationID     uuid.UUID
		StopNumber    int
		DepartureTime string
		ArrivalTime   string
		DayNumber     int
	}

	// Fetch first and last stop per train. train_id stored as text → cast to uuid.
	var firstStops []stopRow
	db.DB.Raw(`
		SELECT DISTINCT ON (train_id::uuid)
			train_id::uuid AS train_id, station_id, stop_number, departure_time, arrival_time, day_number
		FROM train_route_stops
		WHERE deleted_at IS NULL
		ORDER BY train_id::uuid, stop_number ASC
	`).Scan(&firstStops)

	var lastStops []stopRow
	db.DB.Raw(`
		SELECT DISTINCT ON (train_id::uuid)
			train_id::uuid AS train_id, station_id, stop_number, departure_time, arrival_time, day_number
		FROM train_route_stops
		WHERE deleted_at IS NULL
		ORDER BY train_id::uuid, stop_number DESC
	`).Scan(&lastStops)

	lastMap := make(map[uuid.UUID]stopRow, len(lastStops))
	for _, s := range lastStops {
		lastMap[s.TrainID] = s
	}

	for _, first := range firstStops {
		last, ok := lastMap[first.TrainID]
		if !ok || first.StationID == last.StationID {
			continue
		}
		depTime := first.DepartureTime
		if depTime == "--" || depTime == "" {
			depTime = "06:00"
		}
		arrTime := last.ArrivalTime
		if arrTime == "--" || arrTime == "" {
			arrTime = "20:00"
		}
		// Rough duration from stop count × 30 min average halt
		stops := last.StopNumber - first.StopNumber
		durMin := stops * 30
		if durMin < 30 {
			durMin = 120
		}
		arrDay := last.DayNumber
		if arrDay < 1 {
			arrDay = 1
		}
		endpoints = append(endpoints, trainEndpoints{
			TrainID:       first.TrainID,
			FromStationID: first.StationID,
			ToStationID:   last.StationID,
			DepTime:       depTime,
			ArrTime:       arrTime,
			DurationMin:   durMin,
			ArrivalDay:    arrDay,
		})
	}

	log.Printf("→ Generating schedules for %d trains × %d days...", len(endpoints), days)

	// Train type → class list mapping
	classesForTrain := func(t *models.Train) []string {
		if t.Classes != "" {
			return splitCSV(t.Classes)
		}
		switch t.TrainType {
		case "Rajdhani":
			return []string{"1A", "2A", "3A"}
		case "Shatabdi", "Jan Shatabdi":
			return []string{"CC", "EC"}
		case "Vande Bharat":
			return []string{"CC", "EC"}
		case "Duronto", "Humsafar":
			return []string{"2A", "3A", "SL"}
		default:
			return []string{"SL", "3A", "2A"}
		}
	}

	fareBase := func(class string, durMin int) float64 {
		distEst := float64(durMin) / 60.0 * 80 // ~80 km/h avg
		switch class {
		case "1A":
			return distEst * 4.5
		case "2A":
			return distEst * 2.8
		case "3A":
			return distEst * 1.9
		case "SL":
			return distEst * 0.7
		case "CC":
			return distEst * 1.4
		case "EC":
			return distEst * 2.2
		case "2S":
			return distEst * 0.4
		default:
			return distEst * 1.0
		}
	}

	trainMap := make(map[uuid.UUID]*models.Train, len(trains))
	for i := range trains {
		trainMap[trains[i].ID] = &trains[i]
	}

	base := time.Now().Truncate(24 * time.Hour)
	batchSize := 500
	schedBatch := make([]models.TrainSchedule, 0, batchSize)
	availBatch := make([]models.TrainClassAvailability, 0, batchSize*4)
	total := 0

	for _, ep := range endpoints {
		train := trainMap[ep.TrainID]
		if train == nil {
			continue
		}
		classes := classesForTrain(train)

		for d := 0; d < days; d++ {
			journeyDate := base.AddDate(0, 0, d)
			sched := models.TrainSchedule{
				TrainID:       ep.TrainID,
				FromStationID: ep.FromStationID,
				ToStationID:   ep.ToStationID,
				JourneyDate:   journeyDate,
				DepartureTime: ep.DepTime,
				ArrivalTime:   ep.ArrTime,
				ArrivalDay:    ep.ArrivalDay,
				DurationMin:   ep.DurationMin,
				IsActive:      true,
			}
			sched.ID = uuid.New()
			sched.CreatedAt = time.Now()
			sched.UpdatedAt = time.Now()
			schedBatch = append(schedBatch, sched)

			for _, class := range classes {
				baseFareVal := fareBase(class, ep.DurationMin)
				totalBerths := 40 + rand.Intn(40)
				ca := models.TrainClassAvailability{
					ScheduleID:    sched.ID,
					Class:         class,
					TotalBerths:   totalBerths,
					Available:     totalBerths - rand.Intn(10),
					RAC:           0,
					WaitlistCount: 0,
					BaseFare:      roundFare(baseFareVal),
					TatkalFare:    roundFare(baseFareVal * 1.3),
					Status:        "AVAILABLE",
				}
				ca.ID = uuid.New()
				ca.CreatedAt = time.Now()
				ca.UpdatedAt = time.Now()
				availBatch = append(availBatch, ca)
			}

			if len(schedBatch) >= batchSize {
				if err := db.DB.CreateInBatches(&schedBatch, batchSize).Error; err != nil {
					log.Printf("⚠ train schedule batch: %v", err)
				}
				if err := db.DB.CreateInBatches(&availBatch, batchSize).Error; err != nil {
					log.Printf("⚠ class avail batch: %v", err)
				}
				total += len(schedBatch)
				schedBatch = schedBatch[:0]
				availBatch = availBatch[:0]
			}
		}
	}

	if len(schedBatch) > 0 {
		db.DB.CreateInBatches(&schedBatch, batchSize)
		db.DB.CreateInBatches(&availBatch, batchSize)
		total += len(schedBatch)
	}

	log.Printf("✓ Generated %d train schedules", total)
	return nil
}

func roundFare(f float64) float64 {
	return float64(int(f/10+0.5)) * 10
}

func splitCSV(s string) []string {
	var out []string
	for _, p := range splitString(s, ",") {
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func splitString(s, sep string) []string {
	var result []string
	start := 0
	for i := 0; i <= len(s)-len(sep); i++ {
		if s[i:i+len(sep)] == sep {
			result = append(result, s[start:i])
			start = i + len(sep)
		}
	}
	result = append(result, s[start:])
	return result
}
