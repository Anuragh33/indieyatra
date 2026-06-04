package seed

import (
	"fmt"
	"log"
	"math"
	"math/rand"
	"time"

	"github.com/anuragh/indiebus/backend/internal/db"
	"github.com/anuragh/indiebus/backend/internal/models"
	"github.com/google/uuid"
)

var cities = []models.City{
	{Name: "Mumbai", State: "Maharashtra", Code: "MUM", Latitude: 19.076, Longitude: 72.8777,
		BusStands: "CSMT,Dadar,Borivali", ImageURL: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800", Popularity: 100},
	{Name: "Delhi", State: "Delhi", Code: "DEL", Latitude: 28.6139, Longitude: 77.2090,
		BusStands: "Kashmere Gate ISBT,Anand Vihar", ImageURL: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800", Popularity: 98},
	{Name: "Bangalore", State: "Karnataka", Code: "BLR", Latitude: 12.9716, Longitude: 77.5946,
		BusStands: "Majestic,Kempegowda", ImageURL: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800", Popularity: 95},
	{Name: "Goa", State: "Goa", Code: "GOA", Latitude: 15.2993, Longitude: 74.1240,
		BusStands: "Panaji,Mapusa", ImageURL: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800", Popularity: 93},
	{Name: "Manali", State: "Himachal Pradesh", Code: "MNL", Latitude: 32.2396, Longitude: 77.1887,
		BusStands: "Old Bus Stand", ImageURL: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800", Popularity: 88},
	{Name: "Jaipur", State: "Rajasthan", Code: "JAI", Latitude: 26.9124, Longitude: 75.7873,
		BusStands: "Sindhi Camp", ImageURL: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800", Popularity: 85},
	{Name: "Kochi", State: "Kerala", Code: "COK", Latitude: 9.9312, Longitude: 76.2673,
		BusStands: "KSRTC Bus Stand", ImageURL: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800", Popularity: 80},
	{Name: "Chennai", State: "Tamil Nadu", Code: "MAA", Latitude: 13.0827, Longitude: 80.2707,
		BusStands: "CMBT,Koyambedu", ImageURL: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800", Popularity: 82},
	{Name: "Hyderabad", State: "Telangana", Code: "HYD", Latitude: 17.3850, Longitude: 78.4867,
		BusStands: "MGBS,JBS", ImageURL: "https://images.unsplash.com/photo-1565374395542-0ce18882c857?w=800", Popularity: 87},
	{Name: "Pune", State: "Maharashtra", Code: "PNQ", Latitude: 18.5204, Longitude: 73.8567,
		BusStands: "Swargate,Shivajinagar", ImageURL: "https://images.unsplash.com/photo-1625730580977-7d4b3a7b8a4c?w=800", Popularity: 78},
	// Tier-2 & beyond
	{Name: "Ahmedabad", State: "Gujarat", Code: "AMD", Latitude: 23.0225, Longitude: 72.5714,
		BusStands: "Geeta Mandir,Paldi", ImageURL: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=800", Popularity: 75},
	{Name: "Lucknow", State: "Uttar Pradesh", Code: "LKO", Latitude: 26.8467, Longitude: 80.9462,
		BusStands: "Alambagh,Kaiserbagh", ImageURL: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800", Popularity: 70},
	{Name: "Agra", State: "Uttar Pradesh", Code: "AGR", Latitude: 27.1767, Longitude: 78.0081,
		BusStands: "Idgah Bus Stand", ImageURL: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800", Popularity: 82},
	{Name: "Varanasi", State: "Uttar Pradesh", Code: "VNS", Latitude: 25.3176, Longitude: 82.9739,
		BusStands: "Varanasi Junction Bus Stand", ImageURL: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=800", Popularity: 76},
	{Name: "Nagpur", State: "Maharashtra", Code: "NGP", Latitude: 21.1458, Longitude: 79.0882,
		BusStands: "Ganeshpeth Bus Stand", ImageURL: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=800", Popularity: 62},
	{Name: "Udaipur", State: "Rajasthan", Code: "UDR", Latitude: 24.5854, Longitude: 73.7125,
		BusStands: "Udaipur Bus Stand", ImageURL: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800", Popularity: 79},
	{Name: "Jodhpur", State: "Rajasthan", Code: "JDH", Latitude: 26.2389, Longitude: 73.0243,
		BusStands: "Raika Bagh Bus Stand", ImageURL: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800", Popularity: 71},
	{Name: "Amritsar", State: "Punjab", Code: "ATQ", Latitude: 31.6340, Longitude: 74.8723,
		BusStands: "ISBT Amritsar", ImageURL: "https://images.unsplash.com/photo-1609691534257-bfb1e7a1a9a5?w=800", Popularity: 77},
	{Name: "Chandigarh", State: "Punjab", Code: "CHD", Latitude: 30.7333, Longitude: 76.7794,
		BusStands: "ISBT 17,ISBT 43", ImageURL: "https://images.unsplash.com/photo-1558618047-3c8d00de6a37?w=800", Popularity: 68},
	{Name: "Mysuru", State: "Karnataka", Code: "MYQ", Latitude: 12.2958, Longitude: 76.6394,
		BusStands: "Central Bus Stand,City Bus Stand", ImageURL: "https://images.unsplash.com/photo-1601897823538-6ce0e73f5f7b?w=800", Popularity: 73},
	{Name: "Mangalore", State: "Karnataka", Code: "MAQ", Latitude: 12.9141, Longitude: 74.8560,
		BusStands: "KSRTC Bus Terminal", ImageURL: "https://images.unsplash.com/photo-1543832923-44667a44c804?w=800", Popularity: 60},
	{Name: "Coimbatore", State: "Tamil Nadu", Code: "CBE", Latitude: 11.0168, Longitude: 76.9558,
		BusStands: "TNSTC Central Bus Stand", ImageURL: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800", Popularity: 61},
	{Name: "Madurai", State: "Tamil Nadu", Code: "MDU", Latitude: 9.9252, Longitude: 78.1198,
		BusStands: "Mattuthavani Bus Stand", ImageURL: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800", Popularity: 67},
	{Name: "Visakhapatnam", State: "Andhra Pradesh", Code: "VZG", Latitude: 17.6868, Longitude: 83.2185,
		BusStands: "Jagadamba Junction,RTC Complex", ImageURL: "https://images.unsplash.com/photo-1543832923-44667a44c804?w=800", Popularity: 66},
	{Name: "Kolkata", State: "West Bengal", Code: "CCU", Latitude: 22.5726, Longitude: 88.3639,
		BusStands: "Esplanade,Babughat", ImageURL: "https://images.unsplash.com/photo-1558431382-27e303142255?w=800", Popularity: 84},
	{Name: "Rishikesh", State: "Uttarakhand", Code: "RSK", Latitude: 30.0869, Longitude: 78.2676,
		BusStands: "Main Bus Stand", ImageURL: "https://images.unsplash.com/photo-1588083949404-c4f1ed1323b3?w=800", Popularity: 74},
	{Name: "Dehradun", State: "Uttarakhand", Code: "DDN", Latitude: 30.3165, Longitude: 78.0322,
		BusStands: "ISBT Dehradun", ImageURL: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=800", Popularity: 65},
	{Name: "Indore", State: "Madhya Pradesh", Code: "IDR", Latitude: 22.7196, Longitude: 75.8577,
		BusStands: "Gangwal,Sarwate", ImageURL: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=800", Popularity: 60},
	{Name: "Bhopal", State: "Madhya Pradesh", Code: "BPL", Latitude: 23.2599, Longitude: 77.4126,
		BusStands: "Hamidia Road Bus Stand", ImageURL: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=800", Popularity: 58},
	{Name: "Nashik", State: "Maharashtra", Code: "NSK", Latitude: 19.9975, Longitude: 73.7898,
		BusStands: "Mahamarg Bus Terminal,CBS", ImageURL: "https://images.unsplash.com/photo-1625730580977-7d4b3a7b8a4c?w=800", Popularity: 56},
}

var operators = []models.Operator{
	{Name: "MSRTC", Slug: "msrtc", LogoURL: "https://logo.clearbit.com/msrtc.gov.in", Rating: 4.2, TotalReviews: 12450, IsGovernment: true},
	{Name: "KSRTC Karnataka", Slug: "ksrtc-ka", LogoURL: "https://logo.clearbit.com/ksrtc.in", Rating: 4.3, TotalReviews: 8920, IsGovernment: true},
	{Name: "KSRTC Kerala", Slug: "ksrtc-kl", LogoURL: "https://logo.clearbit.com/keralartc.com", Rating: 4.1, TotalReviews: 6200, IsGovernment: true},
	{Name: "UPSRTC", Slug: "upsrtc", LogoURL: "https://logo.clearbit.com/upsrtc.com", Rating: 3.9, TotalReviews: 9400, IsGovernment: true},
	{Name: "GSRTC", Slug: "gsrtc", LogoURL: "https://logo.clearbit.com/gsrtc.in", Rating: 4.0, TotalReviews: 7800, IsGovernment: true},
	{Name: "TNSTC", Slug: "tnstc", LogoURL: "https://logo.clearbit.com/tnstc.in", Rating: 4.1, TotalReviews: 8100, IsGovernment: true},
	{Name: "VRL Travels", Slug: "vrl", LogoURL: "https://logo.clearbit.com/vrlbus.in", Rating: 4.4, TotalReviews: 18230},
	{Name: "SRS Travels", Slug: "srs", LogoURL: "https://logo.clearbit.com/srsbus.com", Rating: 4.3, TotalReviews: 15640},
	{Name: "Parveen Travels", Slug: "parveen", LogoURL: "https://logo.clearbit.com/parveentravels.com", Rating: 4.5, TotalReviews: 9870},
	{Name: "IntrCity SmartBus", Slug: "intrcity", LogoURL: "https://logo.clearbit.com/intrcity.com", Rating: 4.6, TotalReviews: 21100},
	{Name: "Zingbus", Slug: "zingbus", LogoURL: "https://logo.clearbit.com/zingbus.com", Rating: 4.4, TotalReviews: 12300},
	{Name: "NueGo", Slug: "nuego", LogoURL: "https://logo.clearbit.com/nuego.com", Rating: 4.5, TotalReviews: 4500, IsElectric: true},
	{Name: "Orange Tours", Slug: "orange", LogoURL: "https://logo.clearbit.com/orangetours.co.in", Rating: 4.3, TotalReviews: 7600},
	{Name: "Chartered Speed", Slug: "chartered", LogoURL: "https://logo.clearbit.com/charteredbus.in", Rating: 4.2, TotalReviews: 5400},
	{Name: "Hans Travels", Slug: "hans", LogoURL: "https://logo.clearbit.com/hanstravels.com", Rating: 4.1, TotalReviews: 4200},
	{Name: "Kallada Travels", Slug: "kallada", LogoURL: "https://logo.clearbit.com/kalladatravels.com", Rating: 4.4, TotalReviews: 11200},
	{Name: "Sharma Transports", Slug: "sharma", LogoURL: "https://logo.clearbit.com/sharmatransports.com", Rating: 4.0, TotalReviews: 3800},
	{Name: "Paulo Travels", Slug: "paulo", LogoURL: "https://logo.clearbit.com/paulotravels.com", Rating: 4.2, TotalReviews: 6700},
}

var busTypes = []struct {
	Type     string
	Layout   string
	Seats    int
	IsAC     bool
	Sleeper  bool
	Amenities string
	FareMult  float64
}{
	{"Volvo Multi-Axle AC Sleeper", "2+1", 36, true, true, "wifi,usb,blanket,meals,tracking,water", 1.6},
	{"AC Semi-Sleeper", "2+2", 40, true, true, "usb,blanket,water,tracking", 1.0},
	{"Non-AC Sleeper", "2+1", 36, false, true, "blanket,water", 0.7},
	{"AC Seater", "2+2", 44, true, false, "usb,water,tracking", 0.85},
	{"Volvo Multi-Axle AC Seater", "2+2", 45, true, false, "wifi,usb,blanket,meals,tracking,water", 1.4},
	{"Electric AC Seater", "2+2", 40, true, false, "wifi,usb,water,tracking", 1.3},
}

func RunIfEmpty() error {
	var count int64
	db.DB.Model(&models.City{}).Count(&count)
	if count > 0 {
		log.Printf("✓ Bus seed skipped (already %d cities)", count)
		if err := SeedTrainsIfEmpty(); err != nil {
			return err
		}
		if err := SeedAdditionalTrains(); err != nil {
			log.Printf("⚠ additional trains: %v", err)
		}
		SeedFlights()
		if err := ExtendTrainSchedules(90); err != nil {
			log.Printf("⚠ extend train schedules: %v", err)
		}
		ExtendFlightSchedules(90)
		if err := ExtendBusSchedules(90); err != nil {
			log.Printf("⚠ extend bus schedules: %v", err)
		}
		if err := SeedHotelsIfEmpty(); err != nil {
			return err
		}
		return nil
	}
	log.Println("→ Seeding database with India data...")

	// Cities
	if err := db.DB.Create(&cities).Error; err != nil {
		return fmt.Errorf("seed cities: %w", err)
	}
	cityByCode := make(map[string]models.City)
	for _, c := range cities {
		cityByCode[c.Code] = c
	}

	// Operators
	if err := db.DB.Create(&operators).Error; err != nil {
		return fmt.Errorf("seed operators: %w", err)
	}

	// Routes — all popular pairs
	pairs := [][2]string{
		// Metro ↔ Metro
		{"MUM", "GOA"}, {"MUM", "PNQ"}, {"MUM", "DEL"}, {"DEL", "JAI"},
		{"DEL", "MNL"}, {"BLR", "MAA"}, {"BLR", "COK"}, {"HYD", "BLR"},
		{"HYD", "MAA"}, {"MAA", "COK"}, {"PNQ", "GOA"}, {"MUM", "HYD"},
		{"DEL", "BLR"}, {"MUM", "JAI"}, {"BLR", "GOA"}, {"DEL", "MAA"},
		// Metro → Tier-2
		{"MUM", "NGP"}, {"MUM", "AMD"}, {"MUM", "NSK"}, {"MUM", "VNS"},
		{"DEL", "LKO"}, {"DEL", "AGR"}, {"DEL", "CHD"}, {"DEL", "ATQ"},
		{"DEL", "UDR"}, {"DEL", "JDH"}, {"DEL", "DDN"}, {"DEL", "RSK"},
		{"BLR", "MYQ"}, {"BLR", "MAQ"}, {"BLR", "CBE"}, {"BLR", "MDU"},
		{"HYD", "VZG"}, {"HYD", "NGP"}, {"MAA", "CBE"}, {"MAA", "MDU"},
		// Tier-2 ↔ Tier-2
		{"PNQ", "NGP"}, {"PNQ", "NSK"}, {"AGR", "LKO"}, {"LKO", "VNS"},
		{"JAI", "UDR"}, {"JAI", "JDH"}, {"JAI", "ATQ"}, {"UDR", "JDH"},
		{"MYQ", "MAQ"}, {"CBE", "MDU"}, {"COK", "MDU"}, {"AMD", "IDR"},
		{"IDR", "BPL"}, {"NGP", "HYD"}, {"VZG", "HYD"}, {"DDN", "RSK"},
		{"CCU", "BLR"}, {"CCU", "DEL"}, {"AMD", "MUM"},
	}
	var routes []models.Route
	for _, p := range pairs {
		from, ok1 := cityByCode[p[0]]
		to, ok2 := cityByCode[p[1]]
		if !ok1 || !ok2 {
			continue
		}
		dist := haversine(from.Latitude, from.Longitude, to.Latitude, to.Longitude)
		dur := int(dist/55.0) * 60 // assume avg 55 km/h
		pop := 50 + rand.Intn(50)
		routes = append(routes, models.Route{
			FromCityID: from.ID, ToCityID: to.ID,
			DistanceKM: int(dist), AvgDurationMin: dur, Popularity: pop,
		})
	}
	if err := db.DB.Create(&routes).Error; err != nil {
		return fmt.Errorf("seed routes: %w", err)
	}

	// Buses (one per operator per bus type — gives us 48 buses)
	var buses []models.Bus
	for _, op := range operators {
		for _, bt := range busTypes {
			buses = append(buses, models.Bus{
				OperatorID:   op.ID,
				BusType:      bt.Type,
				Layout:       bt.Layout,
				TotalSeats:   bt.Seats,
				IsAC:         bt.IsAC,
				IsSleeper:    bt.Sleeper,
				Amenities:    bt.Amenities,
				Rating:       4.0 + rand.Float64()*0.6,
				TotalReviews: 500 + rand.Intn(5000),
			})
		}
	}
	if err := db.DB.Create(&buses).Error; err != nil {
		return fmt.Errorf("seed buses: %w", err)
	}

	// Schedules — for next 14 days, top 8 routes get ~6 buses/day
	now := time.Now()
	var schedules []models.Schedule
	for d := 0; d < 14; d++ {
		day := now.AddDate(0, 0, d)
		for ri, r := range routes[:8] {
			numBuses := 4 + rand.Intn(4)
			for bi := 0; bi < numBuses; bi++ {
				bus := buses[rand.Intn(len(buses))]
				op := operators[rand.Intn(len(operators))]
				depHour := 6 + rand.Intn(16) // 6am-10pm
				dep := time.Date(day.Year(), day.Month(), day.Day(), depHour, rand.Intn(60), 0, 0, time.UTC)
				dur := r.AvgDurationMin + (rand.Intn(60) - 30)
				arr := dep.Add(time.Duration(dur) * time.Minute)
				baseFare := 250.0 + float64(r.DistanceKM)*0.85*getFareMultForBus(bus, busTypes)
				baseFare = math.Round(baseFare/10) * 10

				schedule := models.Schedule{
					RouteID: r.ID, BusID: bus.ID, OperatorID: op.ID,
					DepartureAt: dep, ArrivalAt: arr,
					DurationMin: dur,
					Stops:       rand.Intn(3),
					BaseFare:    baseFare,
					Currency:    "INR",
					SeatsTotal:  bus.TotalSeats,
					SeatsAvailable: bus.TotalSeats - rand.Intn(8),
					IsActive:    true,
				}
				_ = ri
				schedules = append(schedules, schedule)
			}
		}
	}
	if err := db.DB.Create(&schedules).Error; err != nil {
		return fmt.Errorf("seed schedules: %w", err)
	}

	// Seats per schedule
	var seats []models.Seat
	for _, s := range schedules {
		var bus models.Bus
		if err := db.DB.First(&bus, "id = ?", s.BusID).Error; err != nil {
			continue
		}
		for i := 0; i < bus.TotalSeats; i++ {
			seatNum := generateSeatNumber(i, bus.Layout)
			berth := "lower"
			if i >= bus.TotalSeats/2 {
				berth = "upper"
			}
			seatClass := "seater"
			if bus.IsSleeper {
				seatClass = "sleeper"
			}
			price := s.BaseFare
			if berth == "lower" {
				price += 50
			}
			if seatClass == "sleeper" {
				price += 100
			}
			seats = append(seats, models.Seat{
				ScheduleID: s.ID, SeatNumber: seatNum,
				BerthType: berth, SeatClass: seatClass,
				Status: "available", Price: price,
			})
		}
	}
	if err := db.DB.CreateInBatches(&seats, 500).Error; err != nil {
		return fmt.Errorf("seed seats: %w", err)
	}

	// Price history (last 30 days) for top 6 routes
	var priceHistory []models.PriceHistory
	for _, r := range routes[:6] {
		for d := 0; d < 30; d++ {
			day := now.AddDate(0, 0, -d)
			base := 350.0 + float64(r.DistanceKM)*0.7
			jitter := (rand.Float64() - 0.5) * 100
			avg := math.Round((base+jitter)*100) / 100
			min := math.Round((avg-rand.Float64()*80)*100) / 100
			max := math.Round((avg+rand.Float64()*100)*100) / 100
			priceHistory = append(priceHistory, models.PriceHistory{
				RouteID: r.ID, Date: day,
				AvgPrice: avg, MinPrice: min, MaxPrice: max,
				Bookings: 5 + rand.Intn(40),
			})
		}
	}
	if err := db.DB.CreateInBatches(&priceHistory, 200).Error; err != nil {
		return fmt.Errorf("seed price history: %w", err)
	}

	// Reviews: ~4 reviews per operator with Indian names and realistic content
	var reviewUsers []models.User
	for i := 0; i < 30; i++ {
		reviewUsers = append(reviewUsers, models.User{
			Email:        fmt.Sprintf("seed_user_%d@example.com", i),
			PasswordHash: "$2a$12$placeholder", // not login-able
			FullName:     []string{"Priya Sharma", "Rahul Mehta", "Ananya Krishnan", "Vikram Singh", "Sneha Patel", "Arjun Reddy", "Kavya Iyer", "Rohit Joshi", "Meera Nair", "Karan Kapoor"}[i%10],
			RewardPoints: 0,
		})
	}
	if err := db.DB.CreateInBatches(&reviewUsers, 30).Error; err != nil {
		return fmt.Errorf("seed review users: %w", err)
	}

	reviewTitles := []string{
		"Smooth ride, will book again",
		"Best sleeper experience I've had",
		"On time and comfortable",
		"AC was strong, charging worked",
		"Driver was professional",
		"Clean bus, friendly staff",
		"Long but worth it",
		"Great value for money",
		"Seats were spotless",
		"Got upgraded for free!",
	}
	reviewBodies := []string{
		"Bus arrived 10 min early, AC working perfectly, blanket provided. Sleeper berth was clean. Took the 8pm departure and reached on time. Will use IndieBus again.",
		"Best Volvo sleeper I've taken in years. Reclined fully flat, charging at every seat, water bottle included. Driver took a single break which was reasonable.",
		"Smooth ride, polite staff. AC was cold which is what I want. The drop point was exactly where the app said. Minor issue: legroom is tight if you're 6ft+.",
		"Booked AC Seater but got upgraded to Semi-Sleeper at no extra cost. Live tracking worked throughout. Will recommend to friends.",
		"Took 30 min longer than expected due to highway work. Driver was courteous and the conductor kept everyone updated. Seats were clean.",
		"Booked VRL for Mumbai-Goa. Got Volvo Multi-Axle as expected. USB charging at every seat, WiFi worked for half the journey. Worth the price.",
		"Sleeper was comfortable but the aisle was narrow. Bring minimal luggage. Reading light was a nice touch. Overall 8/10.",
		"Government bus (KSRTC) and they were on time, AC working. Seats clean. Cheaper than private operators by 20%. Will book again.",
		"Took 12 hours Mumbai-Pune. Two stops, each 15 min. Felt safe. The conductor was helpful with my elderly mother. Highly recommend.",
		"App said Volvo but got a regular AC Seater. Customer care refunded the difference in 24h. Good service recovery.",
	}
	ratings := []int{5, 4, 5, 4, 3, 5, 4, 5, 4, 5}

	var reviews []models.Review
	reviewCount := 0
	for _, op := range operators {
		// 4-6 reviews per operator
		n := 4 + rand.Intn(3)
		for i := 0; i < n; i++ {
			uid := reviewUsers[rand.Intn(len(reviewUsers))].ID
			idx := rand.Intn(len(reviewTitles))
			helpful := rand.Intn(50)
			reviews = append(reviews, models.Review{
				UserID:     uid,
				OperatorID: op.ID,
				Rating:     ratings[idx%len(ratings)],
				Title:      reviewTitles[idx],
				Comment:    reviewBodies[idx],
				Helpful:    helpful,
				IsVerified: rand.Float64() > 0.3,
			})
			reviewCount++
		}
	}
	if err := db.DB.CreateInBatches(&reviews, 50).Error; err != nil {
		return fmt.Errorf("seed reviews: %w", err)
	}

	log.Printf("✓ Seed complete: %d cities, %d operators, %d routes, %d buses, %d schedules, %d seats, %d price points, %d reviews",
		len(cities), len(operators), len(routes), len(buses), len(schedules), len(seats), len(priceHistory), reviewCount)

	if err := SeedTrainsIfEmpty(); err != nil {
		return fmt.Errorf("seed trains: %w", err)
	}
	if err := SeedAdditionalTrains(); err != nil {
		log.Printf("⚠ additional trains: %v", err)
	}
	SeedFlights()
	if err := ExtendTrainSchedules(90); err != nil {
		log.Printf("⚠ extend train schedules: %v", err)
	}
	ExtendFlightSchedules(90)
	if err := ExtendBusSchedules(90); err != nil {
		log.Printf("⚠ extend bus schedules: %v", err)
	}
	if err := SeedHotelsIfEmpty(); err != nil {
		return fmt.Errorf("seed hotels: %w", err)
	}
	return nil
}

// ExtendBusSchedules creates bus schedules through today+days for routes that already
// have at least one schedule (i.e., the top-8 Go-seeded routes). Safe to call on
// every startup — routes already covered up to horizon are skipped.
func ExtendBusSchedules(days int) error {
	// All routes whose from-city uses a short Go-seed code (MUM, BLR, etc.)
	// This covers both routes that already have schedules and those that don't yet.
	var routeIDs []string
	if err := db.DB.Raw(`
		SELECT r.id::text
		FROM routes r
		JOIN cities fc ON fc.id = r.from_city_id
		WHERE LENGTH(fc.code) <= 4
		LIMIT 200
	`).Scan(&routeIDs).Error; err != nil {
		return err
	}
	if len(routeIDs) == 0 {
		return nil
	}

	var buses []models.Bus
	if err := db.DB.Limit(50).Find(&buses).Error; err != nil || len(buses) == 0 {
		return nil
	}
	var dbOps []models.Operator
	db.DB.Limit(20).Find(&dbOps)
	if len(dbOps) == 0 {
		return nil
	}

	today := time.Now().UTC().Truncate(24 * time.Hour)
	horizon := today.AddDate(0, 0, days)
	totalNew := 0

	for _, routeID := range routeIDs {
		var route models.Route
		if err := db.DB.First(&route, "id = ?", routeID).Error; err != nil {
			continue
		}

		var schedCount int64
		db.DB.Model(&models.Schedule{}).Where("route_id = ?", routeID).Count(&schedCount)

		var startDay time.Time
		if schedCount == 0 {
			startDay = today
		} else {
			var maxDep time.Time
			db.DB.Model(&models.Schedule{}).
				Where("route_id = ?", routeID).
				Select("MAX(departure_at)").
				Scan(&maxDep)
			startDay = time.Date(maxDep.Year(), maxDep.Month(), maxDep.Day(), 0, 0, 0, 0, time.UTC).
				AddDate(0, 0, 1)
			if startDay.Before(today) {
				startDay = today
			}
		}
		if !startDay.Before(horizon) {
			continue
		}

		var schedules []models.Schedule
		for d := startDay; d.Before(horizon); d = d.AddDate(0, 0, 1) {
			numBuses := 4 + rand.Intn(4)
			for bi := 0; bi < numBuses; bi++ {
				bus := buses[rand.Intn(len(buses))]
				op := dbOps[rand.Intn(len(dbOps))]
				depHour := 6 + rand.Intn(16)
				dep := time.Date(d.Year(), d.Month(), d.Day(), depHour, rand.Intn(60), 0, 0, time.UTC)
				dur := route.AvgDurationMin + (rand.Intn(60) - 30)
				if dur < 30 {
					dur = 30
				}
				arr := dep.Add(time.Duration(dur) * time.Minute)
				baseFare := 250.0 + float64(route.DistanceKM)*0.85*getFareMultForBus(bus, busTypes)
				baseFare = math.Round(baseFare/10) * 10
				schedules = append(schedules, models.Schedule{
					RouteID:        route.ID,
					BusID:          bus.ID,
					OperatorID:     op.ID,
					DepartureAt:    dep,
					ArrivalAt:      arr,
					DurationMin:    dur,
					Stops:          rand.Intn(3),
					BaseFare:       baseFare,
					Currency:       "INR",
					SeatsTotal:     bus.TotalSeats,
					SeatsAvailable: bus.TotalSeats - rand.Intn(8),
					IsActive:       true,
				})
				_ = bi
			}
		}

		if len(schedules) > 0 {
			if err := db.DB.CreateInBatches(&schedules, 200).Error; err != nil {
				log.Printf("  ✗ extend bus schedules for route %s: %v", routeID, err)
			} else {
				totalNew += len(schedules)
			}
		}
	}

	if totalNew > 0 {
		log.Printf("✓ Extended bus schedules: +%d entries (through %s)", totalNew, horizon.Format("2006-01-02"))
	} else {
		log.Printf("✓ Bus schedules already cover through %s", horizon.Format("2006-01-02"))
	}
	return nil
}

func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371.0
	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func generateSeatNumber(idx int, layout string) string {
	// 2+1 → A B C (lower berth first then upper)
	// 2+2 → A B C D
	// 0-9: lower, 10-19: upper
	row := idx / getColsPerRow(layout)
	isUpper := row%2 == 1
	actualRow := row / 2
	col := idx % getColsPerRow(layout)
	letter := string(rune('A' + col))
	side := "L"
	if isUpper {
		side = "U"
	}
	return fmt.Sprintf("%s%d%s", letter, actualRow+1, side)
}

func getColsPerRow(layout string) int {
	if layout == "2+1" {
		return 3
	}
	return 4
}

func getFareMultForBus(b models.Bus, types []struct {
	Type     string
	Layout   string
	Seats    int
	IsAC     bool
	Sleeper  bool
	Amenities string
	FareMult  float64
}) float64 {
	for _, t := range types {
		if t.Type == b.BusType && t.Layout == b.Layout && t.Seats == b.TotalSeats {
			return t.FareMult
		}
	}
	return 1.0
}

var _ = uuid.Nil
