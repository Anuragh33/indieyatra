package seed

import (
	"fmt"
	"log"
	"math"
	"math/rand"
	"strings"
	"time"

	"github.com/anuragh/indiebus/backend/internal/db"
	"github.com/anuragh/indiebus/backend/internal/models"
	"github.com/google/uuid"
)

var trainStations = []models.Station{
	{Name: "New Delhi", Code: "NDLS", City: "New Delhi", State: "Delhi", Zone: "NR", Latitude: 28.6418, Longitude: 77.2193},
	{Name: "Hazrat Nizamuddin", Code: "NZM", City: "New Delhi", State: "Delhi", Zone: "NR", Latitude: 28.5881, Longitude: 77.2541},
	{Name: "Chhatrapati Shivaji Maharaj Terminus", Code: "CSTM", City: "Mumbai", State: "Maharashtra", Zone: "CR", Latitude: 18.9402, Longitude: 72.8351},
	{Name: "Lokmanya Tilak Terminus", Code: "LTT", City: "Mumbai", State: "Maharashtra", Zone: "CR", Latitude: 19.0736, Longitude: 72.9061},
	{Name: "Mumbai Central", Code: "MMCT", City: "Mumbai", State: "Maharashtra", Zone: "WR", Latitude: 18.9693, Longitude: 72.8194},
	{Name: "Howrah Junction", Code: "HWH", City: "Kolkata", State: "West Bengal", Zone: "ER", Latitude: 22.5839, Longitude: 88.3421},
	{Name: "Chennai Central", Code: "MAS", City: "Chennai", State: "Tamil Nadu", Zone: "SR", Latitude: 13.0826, Longitude: 80.2753},
	{Name: "KSR Bengaluru City", Code: "SBC", City: "Bengaluru", State: "Karnataka", Zone: "SWR", Latitude: 12.9766, Longitude: 77.5714},
	{Name: "Secunderabad Junction", Code: "SC", City: "Hyderabad", State: "Telangana", Zone: "SCR", Latitude: 17.4362, Longitude: 78.4985},
	{Name: "Pune Junction", Code: "PUNE", City: "Pune", State: "Maharashtra", Zone: "CR", Latitude: 18.5283, Longitude: 73.8744},
	{Name: "Ahmedabad Junction", Code: "ADI", City: "Ahmedabad", State: "Gujarat", Zone: "WR", Latitude: 23.0258, Longitude: 72.5989},
	{Name: "Jaipur Junction", Code: "JP", City: "Jaipur", State: "Rajasthan", Zone: "NWR", Latitude: 26.9190, Longitude: 75.7870},
	{Name: "Lucknow NE Junction", Code: "LKO", City: "Lucknow", State: "Uttar Pradesh", Zone: "NER", Latitude: 26.8567, Longitude: 80.9462},
	{Name: "Patna Junction", Code: "PNBE", City: "Patna", State: "Bihar", Zone: "ECR", Latitude: 25.6053, Longitude: 85.1390},
	{Name: "Bhopal Junction", Code: "BPL", City: "Bhopal", State: "Madhya Pradesh", Zone: "WCR", Latitude: 23.2696, Longitude: 77.4093},
	{Name: "Vijayawada Junction", Code: "BZA", City: "Vijayawada", State: "Andhra Pradesh", Zone: "SCR", Latitude: 16.5177, Longitude: 80.6339},
	{Name: "Ernakulam Junction", Code: "ERS", City: "Kochi", State: "Kerala", Zone: "SR", Latitude: 9.9781, Longitude: 76.2906},
	{Name: "Thiruvananthapuram Central", Code: "TVC", City: "Thiruvananthapuram", State: "Kerala", Zone: "SR", Latitude: 8.4891, Longitude: 76.9521},
	{Name: "Gorakhpur Junction", Code: "GKP", City: "Gorakhpur", State: "Uttar Pradesh", Zone: "NER", Latitude: 26.7606, Longitude: 83.3732},
	{Name: "Kanpur Central", Code: "CNB", City: "Kanpur", State: "Uttar Pradesh", Zone: "NCR", Latitude: 26.4416, Longitude: 80.3516},
	{Name: "Varanasi Junction", Code: "BSB", City: "Varanasi", State: "Uttar Pradesh", Zone: "NR", Latitude: 25.3195, Longitude: 83.0099},
	{Name: "Agra Cantt", Code: "AGC", City: "Agra", State: "Uttar Pradesh", Zone: "NCR", Latitude: 27.1581, Longitude: 78.0108},
	{Name: "Amritsar Junction", Code: "ASR", City: "Amritsar", State: "Punjab", Zone: "NR", Latitude: 31.6340, Longitude: 74.8723},
	{Name: "Vadodara Junction", Code: "BRC", City: "Vadodara", State: "Gujarat", Zone: "WR", Latitude: 22.3119, Longitude: 73.1803},
	{Name: "Nagpur Junction", Code: "NGP", City: "Nagpur", State: "Maharashtra", Zone: "SECR", Latitude: 21.1458, Longitude: 79.0882},
	// Tier-2 & regional stations
	{Name: "Indore Junction", Code: "INDB", City: "Indore", State: "Madhya Pradesh", Zone: "WR", Latitude: 22.7196, Longitude: 75.8408},
	{Name: "Surat Junction", Code: "ST", City: "Surat", State: "Gujarat", Zone: "WR", Latitude: 21.1950, Longitude: 72.8313},
	{Name: "Ahmedabad Junction", Code: "ADI", City: "Ahmedabad", State: "Gujarat", Zone: "WR", Latitude: 23.0258, Longitude: 72.5989},
	{Name: "Rajkot Junction", Code: "RJT", City: "Rajkot", State: "Gujarat", Zone: "WR", Latitude: 22.3003, Longitude: 70.7960},
	{Name: "Udaipur City", Code: "UDZ", City: "Udaipur", State: "Rajasthan", Zone: "NWR", Latitude: 24.5854, Longitude: 73.7125},
	{Name: "Jodhpur Junction", Code: "JU", City: "Jodhpur", State: "Rajasthan", Zone: "NWR", Latitude: 26.2518, Longitude: 73.0243},
	{Name: "Bikaner Junction", Code: "BKN", City: "Bikaner", State: "Rajasthan", Zone: "NWR", Latitude: 28.0229, Longitude: 73.3119},
	{Name: "Agra Cantt", Code: "AGC", City: "Agra", State: "Uttar Pradesh", Zone: "NCR", Latitude: 27.1581, Longitude: 78.0108},
	{Name: "Dehradun Junction", Code: "DDN", City: "Dehradun", State: "Uttarakhand", Zone: "NR", Latitude: 30.3165, Longitude: 78.0322},
	{Name: "Haridwar Junction", Code: "HW", City: "Haridwar", State: "Uttarakhand", Zone: "NR", Latitude: 29.9457, Longitude: 78.1642},
	{Name: "Chandigarh Junction", Code: "CDG", City: "Chandigarh", State: "Punjab", Zone: "NR", Latitude: 30.7046, Longitude: 76.8041},
	{Name: "Ludhiana Junction", Code: "LDH", City: "Ludhiana", State: "Punjab", Zone: "NR", Latitude: 30.9010, Longitude: 75.8573},
	{Name: "Jammu Tawi", Code: "JAT", City: "Jammu", State: "Jammu & Kashmir", Zone: "NR", Latitude: 32.7266, Longitude: 74.8570},
	{Name: "Mysuru Junction", Code: "MYS", City: "Mysuru", State: "Karnataka", Zone: "SWR", Latitude: 12.3051, Longitude: 76.6551},
	{Name: "Mangaluru Central", Code: "MAQ", City: "Mangaluru", State: "Karnataka", Zone: "SR", Latitude: 12.8688, Longitude: 74.8421},
	{Name: "Hubli Junction", Code: "UBL", City: "Hubli", State: "Karnataka", Zone: "SWR", Latitude: 15.3647, Longitude: 75.1240},
	{Name: "Coimbatore Junction", Code: "CBE", City: "Coimbatore", State: "Tamil Nadu", Zone: "SR", Latitude: 11.0013, Longitude: 76.9641},
	{Name: "Madurai Junction", Code: "MDU", City: "Madurai", State: "Tamil Nadu", Zone: "SR", Latitude: 9.9195, Longitude: 78.1193},
	{Name: "Tiruchirappalli Junction", Code: "TPJ", City: "Tiruchirappalli", State: "Tamil Nadu", Zone: "SR", Latitude: 10.8172, Longitude: 78.6838},
	{Name: "Kozhikode", Code: "CLT", City: "Kozhikode", State: "Kerala", Zone: "SR", Latitude: 11.2475, Longitude: 75.7778},
	{Name: "Visakhapatnam Junction", Code: "VSKP", City: "Visakhapatnam", State: "Andhra Pradesh", Zone: "ECoR", Latitude: 17.6869, Longitude: 83.2185},
	{Name: "Vijayawada Junction", Code: "BZA", City: "Vijayawada", State: "Andhra Pradesh", Zone: "SCR", Latitude: 16.5177, Longitude: 80.6339},
	{Name: "Bhubaneswar Junction", Code: "BBS", City: "Bhubaneswar", State: "Odisha", Zone: "ECoR", Latitude: 20.2960, Longitude: 85.8245},
	{Name: "Puri Junction", Code: "PURI", City: "Puri", State: "Odisha", Zone: "ECoR", Latitude: 19.8126, Longitude: 85.8315},
	{Name: "Ranchi Junction", Code: "RNC", City: "Ranchi", State: "Jharkhand", Zone: "SER", Latitude: 23.3441, Longitude: 85.3096},
	{Name: "Guwahati Junction", Code: "GHY", City: "Guwahati", State: "Assam", Zone: "NFR", Latitude: 26.1769, Longitude: 91.7381},
	{Name: "Siliguri Junction", Code: "SGUJ", City: "Siliguri", State: "West Bengal", Zone: "NFR", Latitude: 26.7271, Longitude: 88.3953},
	{Name: "Kolkata Chitpur", Code: "KOAA", City: "Kolkata", State: "West Bengal", Zone: "ER", Latitude: 22.5897, Longitude: 88.3697},
	{Name: "Nashik Road", Code: "NK", City: "Nashik", State: "Maharashtra", Zone: "CR", Latitude: 19.9975, Longitude: 73.7898},
	{Name: "Aurangabad Junction", Code: "AWB", City: "Aurangabad", State: "Maharashtra", Zone: "SCR", Latitude: 19.8762, Longitude: 75.3433},
}

type stopDef struct {
	Code string
	Num  int
	Arr  string // "--" = origin
	Dep  string // "--" = terminus
	Halt int
	Dist int
	Day  int
	Plt  string
}

type trainDef struct {
	Number    string
	Name      string
	TType     string
	Super     bool
	Pantry    bool
	RunsOn    string
	Classes   []string
	DepTime   string // origin departure time
	ArrTime   string // terminus arrival time
	ArrDay    int    // 1=same day, 2=next day, etc.
	DurMin    int
	Stops     []stopDef
}

// classFares returns base fare and tatkal fare for a given class and distance.
func classFares(class string, distKM int) (base, tatkal float64) {
	dist := float64(distKM)
	switch class {
	case "1A":
		base = math.Round((dist*5.4+380)/10) * 10
		tatkal = math.Round(base*1.3/10) * 10
	case "2A":
		base = math.Round((dist*2.75+200)/10) * 10
		tatkal = math.Round(base*1.25/10) * 10
	case "3A":
		base = math.Round((dist*1.35+120)/10) * 10
		tatkal = math.Round(base*1.3/10) * 10
	case "SL":
		base = math.Round((dist*0.55+60)/10) * 10
		tatkal = math.Round(base*1.5/10) * 10
	case "EC":
		base = math.Round((dist*2.4+180)/10) * 10
		tatkal = math.Round(base*1.25/10) * 10
	case "CC":
		base = math.Round((dist*1.15+90)/10) * 10
		tatkal = math.Round(base*1.3/10) * 10
	case "2S":
		base = math.Round((dist*0.28+30)/10) * 10
		tatkal = math.Round(base*1.6/10) * 10
	default:
		base = 500
		tatkal = 650
	}
	return
}

func classCapacity(class string) int {
	switch class {
	case "1A":
		return 24
	case "2A":
		return 48
	case "3A":
		return 72
	case "SL":
		return 72
	case "EC":
		return 56
	case "CC":
		return 78
	case "2S":
		return 100
	default:
		return 60
	}
}

func availStatus(avail, rac, wl int) string {
	if avail > 0 {
		return "AVAILABLE"
	}
	if rac > 0 {
		return "RAC"
	}
	if wl > 0 {
		return "WL"
	}
	return "REGRET"
}

var trainDefs = []trainDef{
	{
		Number: "12301", Name: "Howrah Rajdhani Express", TType: "Rajdhani",
		Super: true, Pantry: true, RunsOn: "Daily", Classes: []string{"1A", "2A", "3A"},
		DepTime: "16:55", ArrTime: "10:05", ArrDay: 2, DurMin: 790,
		Stops: []stopDef{
			{Code: "HWH", Num: 1, Arr: "--", Dep: "16:55", Day: 1, Dist: 0, Plt: "9"},
			{Code: "CNB", Num: 2, Arr: "02:55", Dep: "03:05", Halt: 10, Day: 2, Dist: 955, Plt: "1"},
			{Code: "NDLS", Num: 3, Arr: "10:05", Dep: "--", Day: 2, Dist: 1447, Plt: "16"},
		},
	},
	{
		Number: "12302", Name: "New Delhi - Howrah Rajdhani Express", TType: "Rajdhani",
		Super: true, Pantry: true, RunsOn: "Daily", Classes: []string{"1A", "2A", "3A"},
		DepTime: "16:25", ArrTime: "09:55", ArrDay: 2, DurMin: 810,
		Stops: []stopDef{
			{Code: "NDLS", Num: 1, Arr: "--", Dep: "16:25", Day: 1, Dist: 0, Plt: "16"},
			{Code: "CNB", Num: 2, Arr: "22:45", Dep: "22:55", Halt: 10, Day: 1, Dist: 492, Plt: "1"},
			{Code: "HWH", Num: 3, Arr: "09:55", Dep: "--", Day: 2, Dist: 1447, Plt: "9"},
		},
	},
	{
		Number: "12951", Name: "Mumbai Central Rajdhani Express", TType: "Rajdhani",
		Super: true, Pantry: true, RunsOn: "Daily", Classes: []string{"1A", "2A", "3A"},
		DepTime: "17:00", ArrTime: "08:35", ArrDay: 2, DurMin: 935,
		Stops: []stopDef{
			{Code: "MMCT", Num: 1, Arr: "--", Dep: "17:00", Day: 1, Dist: 0, Plt: "5"},
			{Code: "BRC", Num: 2, Arr: "21:15", Dep: "21:20", Halt: 5, Day: 1, Dist: 392, Plt: "1"},
			{Code: "NZM", Num: 3, Arr: "08:35", Dep: "--", Day: 2, Dist: 1384, Plt: "7"},
		},
	},
	{
		Number: "12952", Name: "Mumbai Central Rajdhani Express (Return)", TType: "Rajdhani",
		Super: true, Pantry: true, RunsOn: "Daily", Classes: []string{"1A", "2A", "3A"},
		DepTime: "16:35", ArrTime: "08:15", ArrDay: 2, DurMin: 940,
		Stops: []stopDef{
			{Code: "NZM", Num: 1, Arr: "--", Dep: "16:35", Day: 1, Dist: 0, Plt: "7"},
			{Code: "BRC", Num: 2, Arr: "04:35", Dep: "04:40", Halt: 5, Day: 2, Dist: 992, Plt: "1"},
			{Code: "MMCT", Num: 3, Arr: "08:15", Dep: "--", Day: 2, Dist: 1384, Plt: "5"},
		},
	},
	{
		Number: "22439", Name: "New Delhi - Varanasi Vande Bharat Express", TType: "Vande Bharat",
		Super: true, Pantry: true, RunsOn: "Mon,Tue,Wed,Thu,Fri,Sat", Classes: []string{"CC", "EC"},
		DepTime: "06:00", ArrTime: "14:30", ArrDay: 1, DurMin: 510,
		Stops: []stopDef{
			{Code: "NDLS", Num: 1, Arr: "--", Dep: "06:00", Day: 1, Dist: 0, Plt: "8"},
			{Code: "AGC", Num: 2, Arr: "08:10", Dep: "08:12", Halt: 2, Day: 1, Dist: 195, Plt: "1"},
			{Code: "CNB", Num: 3, Arr: "10:40", Dep: "10:42", Halt: 2, Day: 1, Dist: 492, Plt: "2"},
			{Code: "BSB", Num: 4, Arr: "14:30", Dep: "--", Day: 1, Dist: 763, Plt: "3"},
		},
	},
	{
		Number: "22440", Name: "Varanasi - New Delhi Vande Bharat Express", TType: "Vande Bharat",
		Super: true, Pantry: true, RunsOn: "Mon,Tue,Wed,Thu,Fri,Sat", Classes: []string{"CC", "EC"},
		DepTime: "15:30", ArrTime: "23:00", ArrDay: 1, DurMin: 510,
		Stops: []stopDef{
			{Code: "BSB", Num: 1, Arr: "--", Dep: "15:30", Day: 1, Dist: 0, Plt: "3"},
			{Code: "CNB", Num: 2, Arr: "18:50", Dep: "18:52", Halt: 2, Day: 1, Dist: 271, Plt: "2"},
			{Code: "AGC", Num: 3, Arr: "21:05", Dep: "21:07", Halt: 2, Day: 1, Dist: 568, Plt: "1"},
			{Code: "NDLS", Num: 4, Arr: "23:00", Dep: "--", Day: 1, Dist: 763, Plt: "8"},
		},
	},
	{
		Number: "12002", Name: "New Delhi - Bhopal Shatabdi Express", TType: "Shatabdi",
		Super: true, Pantry: true, RunsOn: "Mon,Tue,Wed,Thu,Fri,Sat,Sun", Classes: []string{"CC", "EC"},
		DepTime: "06:00", ArrTime: "14:00", ArrDay: 1, DurMin: 480,
		Stops: []stopDef{
			{Code: "NDLS", Num: 1, Arr: "--", Dep: "06:00", Day: 1, Dist: 0, Plt: "3"},
			{Code: "AGC", Num: 2, Arr: "08:10", Dep: "08:12", Halt: 2, Day: 1, Dist: 195, Plt: "4"},
			{Code: "BPL", Num: 3, Arr: "14:00", Dep: "--", Day: 1, Dist: 702, Plt: "1"},
		},
	},
	{
		Number: "12028", Name: "Chennai - Bangalore Shatabdi Express", TType: "Shatabdi",
		Super: true, Pantry: true, RunsOn: "Mon,Tue,Wed,Thu,Fri,Sat,Sun", Classes: []string{"CC", "EC"},
		DepTime: "06:00", ArrTime: "11:00", ArrDay: 1, DurMin: 300,
		Stops: []stopDef{
			{Code: "MAS", Num: 1, Arr: "--", Dep: "06:00", Day: 1, Dist: 0, Plt: "7"},
			{Code: "SBC", Num: 2, Arr: "11:00", Dep: "--", Day: 1, Dist: 362, Plt: "5"},
		},
	},
	{
		Number: "22691", Name: "New Delhi - Bangalore Rajdhani Express", TType: "Rajdhani",
		Super: true, Pantry: true, RunsOn: "Mon,Wed,Fri,Sun", Classes: []string{"1A", "2A", "3A"},
		DepTime: "20:15", ArrTime: "11:00", ArrDay: 2, DurMin: 885,
		Stops: []stopDef{
			{Code: "NZM", Num: 1, Arr: "--", Dep: "20:15", Day: 1, Dist: 0, Plt: "7"},
			{Code: "NGP", Num: 2, Arr: "07:00", Dep: "07:10", Halt: 10, Day: 2, Dist: 1100, Plt: "2"},
			{Code: "SC", Num: 3, Arr: "06:25", Dep: "06:35", Halt: 10, Day: 2, Dist: 1476, Plt: "4"},
			{Code: "SBC", Num: 4, Arr: "11:00", Dep: "--", Day: 2, Dist: 2150, Plt: "5"},
		},
	},
	{
		Number: "12621", Name: "Tamil Nadu Express", TType: "Superfast",
		Super: true, Pantry: true, RunsOn: "Daily", Classes: []string{"1A", "2A", "3A", "SL"},
		DepTime: "22:30", ArrTime: "07:10", ArrDay: 3, DurMin: 2920,
		Stops: []stopDef{
			{Code: "NZM", Num: 1, Arr: "--", Dep: "22:30", Day: 1, Dist: 0, Plt: "7"},
			{Code: "CNB", Num: 2, Arr: "04:45", Dep: "04:55", Halt: 10, Day: 2, Dist: 492, Plt: "1"},
			{Code: "NGP", Num: 3, Arr: "12:35", Dep: "12:45", Halt: 10, Day: 2, Dist: 1095, Plt: "1"},
			{Code: "SC", Num: 4, Arr: "21:10", Dep: "21:20", Halt: 10, Day: 2, Dist: 1516, Plt: "6"},
			{Code: "MAS", Num: 5, Arr: "07:10", Dep: "--", Day: 3, Dist: 2183, Plt: "9"},
		},
	},
	{
		Number: "12622", Name: "Tamil Nadu Express (Return)", TType: "Superfast",
		Super: true, Pantry: true, RunsOn: "Daily", Classes: []string{"1A", "2A", "3A", "SL"},
		DepTime: "23:00", ArrTime: "07:00", ArrDay: 3, DurMin: 2880,
		Stops: []stopDef{
			{Code: "MAS", Num: 1, Arr: "--", Dep: "23:00", Day: 1, Dist: 0, Plt: "9"},
			{Code: "SC", Num: 2, Arr: "08:15", Dep: "08:25", Halt: 10, Day: 2, Dist: 667, Plt: "6"},
			{Code: "NGP", Num: 3, Arr: "17:10", Dep: "17:20", Halt: 10, Day: 2, Dist: 1088, Plt: "1"},
			{Code: "CNB", Num: 4, Arr: "01:25", Dep: "01:35", Halt: 10, Day: 3, Dist: 1691, Plt: "1"},
			{Code: "NZM", Num: 5, Arr: "07:00", Dep: "--", Day: 3, Dist: 2183, Plt: "7"},
		},
	},
	{
		Number: "12259", Name: "Sealdah Duronto Express", TType: "Duronto",
		Super: true, Pantry: true, RunsOn: "Mon,Wed,Fri", Classes: []string{"1A", "2A", "3A"},
		DepTime: "22:15", ArrTime: "17:40", ArrDay: 2, DurMin: 1165,
		Stops: []stopDef{
			{Code: "HWH", Num: 1, Arr: "--", Dep: "22:15", Day: 1, Dist: 0, Plt: "3"},
			{Code: "NZM", Num: 2, Arr: "17:40", Dep: "--", Day: 2, Dist: 1447, Plt: "7"},
		},
	},
	{
		Number: "12431", Name: "Thiruvananthapuram Central Rajdhani Express", TType: "Rajdhani",
		Super: true, Pantry: true, RunsOn: "Tue,Fri,Sun", Classes: []string{"1A", "2A", "3A"},
		DepTime: "11:00", ArrTime: "05:30", ArrDay: 3, DurMin: 2910,
		Stops: []stopDef{
			{Code: "NZM", Num: 1, Arr: "--", Dep: "11:00", Day: 1, Dist: 0, Plt: "7"},
			{Code: "NGP", Num: 2, Arr: "20:05", Dep: "20:15", Halt: 10, Day: 1, Dist: 1100, Plt: "2"},
			{Code: "SC", Num: 3, Arr: "04:30", Dep: "04:40", Halt: 10, Day: 2, Dist: 1516, Plt: "4"},
			{Code: "ERS", Num: 4, Arr: "21:50", Dep: "21:55", Halt: 5, Day: 2, Dist: 2590, Plt: "2"},
			{Code: "TVC", Num: 5, Arr: "05:30", Dep: "--", Day: 3, Dist: 2906, Plt: "1"},
		},
	},
	{
		Number: "12029", Name: "New Delhi - Amritsar Shatabdi Express", TType: "Shatabdi",
		Super: true, Pantry: true, RunsOn: "Mon,Tue,Wed,Thu,Fri,Sat,Sun", Classes: []string{"CC", "EC"},
		DepTime: "16:00", ArrTime: "22:40", ArrDay: 1, DurMin: 400,
		Stops: []stopDef{
			{Code: "NDLS", Num: 1, Arr: "--", Dep: "16:00", Day: 1, Dist: 0, Plt: "3"},
			{Code: "ASR", Num: 2, Arr: "22:40", Dep: "--", Day: 1, Dist: 449, Plt: "1"},
		},
	},
	{
		Number: "12030", Name: "Amritsar - New Delhi Shatabdi Express", TType: "Shatabdi",
		Super: true, Pantry: true, RunsOn: "Mon,Tue,Wed,Thu,Fri,Sat,Sun", Classes: []string{"CC", "EC"},
		DepTime: "06:20", ArrTime: "13:00", ArrDay: 1, DurMin: 400,
		Stops: []stopDef{
			{Code: "ASR", Num: 1, Arr: "--", Dep: "06:20", Day: 1, Dist: 0, Plt: "1"},
			{Code: "NDLS", Num: 2, Arr: "13:00", Dep: "--", Day: 1, Dist: 449, Plt: "3"},
		},
	},
	{
		Number: "12303", Name: "Poorva Express", TType: "Superfast",
		Super: true, Pantry: true, RunsOn: "Mon,Wed,Fri,Sun", Classes: []string{"1A", "2A", "3A", "SL"},
		DepTime: "08:00", ArrTime: "04:55", ArrDay: 2, DurMin: 1255,
		Stops: []stopDef{
			{Code: "HWH", Num: 1, Arr: "--", Dep: "08:00", Day: 1, Dist: 0, Plt: "3"},
			{Code: "CNB", Num: 2, Arr: "23:25", Dep: "23:35", Halt: 10, Day: 1, Dist: 955, Plt: "2"},
			{Code: "AGC", Num: 3, Arr: "02:25", Dep: "02:30", Halt: 5, Day: 2, Dist: 1252, Plt: "4"},
			{Code: "NDLS", Num: 4, Arr: "04:55", Dep: "--", Day: 2, Dist: 1447, Plt: "10"},
		},
	},
	{
		Number: "12565", Name: "Bihar Sampark Kranti Express", TType: "Superfast",
		Super: true, Pantry: false, RunsOn: "Daily", Classes: []string{"2A", "3A", "SL"},
		DepTime: "19:55", ArrTime: "22:20", ArrDay: 2, DurMin: 1585,
		Stops: []stopDef{
			{Code: "NZM", Num: 1, Arr: "--", Dep: "19:55", Day: 1, Dist: 0, Plt: "7"},
			{Code: "CNB", Num: 2, Arr: "02:30", Dep: "02:40", Halt: 10, Day: 2, Dist: 492, Plt: "1"},
			{Code: "LKO", Num: 3, Arr: "05:30", Dep: "05:40", Halt: 10, Day: 2, Dist: 638, Plt: "2"},
			{Code: "GKP", Num: 4, Arr: "12:30", Dep: "12:40", Halt: 10, Day: 2, Dist: 916, Plt: "3"},
			{Code: "PNBE", Num: 5, Arr: "22:20", Dep: "--", Day: 2, Dist: 1204, Plt: "1"},
		},
	},
	{
		Number: "12909", Name: "Garib Rath Express", TType: "Garib Rath",
		Super: true, Pantry: false, RunsOn: "Mon,Thu", Classes: []string{"3A"},
		DepTime: "17:25", ArrTime: "16:05", ArrDay: 2, DurMin: 1360,
		Stops: []stopDef{
			{Code: "CSTM", Num: 1, Arr: "--", Dep: "17:25", Day: 1, Dist: 0, Plt: "1"},
			{Code: "NGP", Num: 2, Arr: "03:05", Dep: "03:15", Halt: 10, Day: 2, Dist: 1083, Plt: "2"},
			{Code: "NZM", Num: 3, Arr: "16:05", Dep: "--", Day: 2, Dist: 1524, Plt: "7"},
		},
	},
	{
		Number: "12721", Name: "Dakshin Express", TType: "Superfast",
		Super: true, Pantry: true, RunsOn: "Daily", Classes: []string{"2A", "3A", "SL"},
		DepTime: "23:00", ArrTime: "06:45", ArrDay: 2, DurMin: 465,
		Stops: []stopDef{
			{Code: "NZM", Num: 1, Arr: "--", Dep: "23:00", Day: 1, Dist: 0, Plt: "7"},
			{Code: "NGP", Num: 2, Arr: "08:30", Dep: "08:40", Halt: 10, Day: 2, Dist: 1100, Plt: "1"},
			{Code: "SC", Num: 3, Arr: "06:45", Dep: "--", Day: 2, Dist: 1516, Plt: "4"},
		},
	},
	{
		Number: "12163", Name: "Mumbai - Chennai Superfast Express", TType: "Superfast",
		Super: true, Pantry: false, RunsOn: "Daily", Classes: []string{"2A", "3A", "SL"},
		DepTime: "13:15", ArrTime: "15:10", ArrDay: 2, DurMin: 1555,
		Stops: []stopDef{
			{Code: "CSTM", Num: 1, Arr: "--", Dep: "13:15", Day: 1, Dist: 0, Plt: "2"},
			{Code: "PUNE", Num: 2, Arr: "15:55", Dep: "16:05", Halt: 10, Day: 1, Dist: 192, Plt: "3"},
			{Code: "SC", Num: 3, Arr: "03:00", Dep: "03:10", Halt: 10, Day: 2, Dist: 1079, Plt: "6"},
			{Code: "MAS", Num: 4, Arr: "15:10", Dep: "--", Day: 2, Dist: 1279, Plt: "9"},
		},
	},
	{
		Number: "12311", Name: "Kalka Mail", TType: "Mail",
		Super: false, Pantry: false, RunsOn: "Daily", Classes: []string{"1A", "2A", "3A", "SL"},
		DepTime: "19:40", ArrTime: "14:05", ArrDay: 2, DurMin: 1105,
		Stops: []stopDef{
			{Code: "HWH", Num: 1, Arr: "--", Dep: "19:40", Day: 1, Dist: 0, Plt: "8"},
			{Code: "CNB", Num: 2, Arr: "10:55", Dep: "11:05", Halt: 10, Day: 2, Dist: 955, Plt: "2"},
			{Code: "AGC", Num: 3, Arr: "13:00", Dep: "13:05", Halt: 5, Day: 2, Dist: 1252, Plt: "4"},
			{Code: "NDLS", Num: 4, Arr: "14:05", Dep: "--", Day: 2, Dist: 1447, Plt: "10"},
		},
	},
	{
		Number: "12483", Name: "Amritsar Express", TType: "Express",
		Super: false, Pantry: false, RunsOn: "Daily", Classes: []string{"2A", "3A", "SL"},
		DepTime: "18:30", ArrTime: "09:00", ArrDay: 2, DurMin: 870,
		Stops: []stopDef{
			{Code: "NDLS", Num: 1, Arr: "--", Dep: "18:30", Day: 1, Dist: 0, Plt: "3"},
			{Code: "ASR", Num: 2, Arr: "09:00", Dep: "--", Day: 2, Dist: 449, Plt: "1"},
		},
	},
	// Additional trains for tier-2 connectivity
	{
		Number: "12993", Name: "Vande Bharat Express (Mumbai–Gandhinagar)", TType: "Vande Bharat",
		Super: true, Pantry: true, RunsOn: "Mon,Tue,Wed,Thu,Fri,Sat,Sun", Classes: []string{"CC", "EC"},
		DepTime: "06:10", ArrTime: "12:30", ArrDay: 1, DurMin: 380,
		Stops: []stopDef{
			{Code: "MMCT", Num: 1, Arr: "--", Dep: "06:10", Day: 1, Dist: 0, Plt: "1"},
			{Code: "ST", Num: 2, Arr: "08:55", Dep: "08:57", Halt: 2, Day: 1, Dist: 263, Plt: "2"},
			{Code: "ADI", Num: 3, Arr: "12:30", Dep: "--", Day: 1, Dist: 492, Plt: "1"},
		},
	},
	{
		Number: "12994", Name: "Gandhinagar–Mumbai Vande Bharat Express", TType: "Vande Bharat",
		Super: true, Pantry: true, RunsOn: "Mon,Tue,Wed,Thu,Fri,Sat,Sun", Classes: []string{"CC", "EC"},
		DepTime: "14:05", ArrTime: "20:25", ArrDay: 1, DurMin: 380,
		Stops: []stopDef{
			{Code: "ADI", Num: 1, Arr: "--", Dep: "14:05", Day: 1, Dist: 0, Plt: "1"},
			{Code: "ST", Num: 2, Arr: "17:30", Dep: "17:32", Halt: 2, Day: 1, Dist: 229, Plt: "2"},
			{Code: "MMCT", Num: 3, Arr: "20:25", Dep: "--", Day: 1, Dist: 492, Plt: "1"},
		},
	},
	{
		Number: "16529", Name: "Udyan Express", TType: "Superfast",
		Super: false, Pantry: true, RunsOn: "Daily", Classes: []string{"1A", "2A", "3A", "SL"},
		DepTime: "08:00", ArrTime: "07:30", ArrDay: 2, DurMin: 1410,
		Stops: []stopDef{
			{Code: "SBC", Num: 1, Arr: "--", Dep: "08:00", Day: 1, Dist: 0, Plt: "1"},
			{Code: "UBL", Num: 2, Arr: "14:40", Dep: "14:50", Halt: 10, Day: 1, Dist: 400, Plt: "2"},
			{Code: "PUNE", Num: 3, Arr: "03:15", Dep: "03:25", Halt: 10, Day: 2, Dist: 1044, Plt: "5"},
			{Code: "CSTM", Num: 4, Arr: "07:30", Dep: "--", Day: 2, Dist: 1236, Plt: "3"},
		},
	},
	{
		Number: "12637", Name: "West Coast Express", TType: "Superfast",
		Super: true, Pantry: false, RunsOn: "Daily", Classes: []string{"2A", "3A", "SL"},
		DepTime: "19:45", ArrTime: "21:00", ArrDay: 2, DurMin: 1515,
		Stops: []stopDef{
			{Code: "MAS", Num: 1, Arr: "--", Dep: "19:45", Day: 1, Dist: 0, Plt: "9"},
			{Code: "CBE", Num: 2, Arr: "02:15", Dep: "02:20", Halt: 5, Day: 2, Dist: 497, Plt: "1"},
			{Code: "MAQ", Num: 3, Arr: "08:00", Dep: "08:10", Halt: 10, Day: 2, Dist: 819, Plt: "1"},
			{Code: "ERS", Num: 4, Arr: "21:00", Dep: "--", Day: 2, Dist: 1112, Plt: "2"},
		},
	},
	{
		Number: "12223", Name: "Mumbai–Hyderabad Duronto Express", TType: "Duronto",
		Super: true, Pantry: true, RunsOn: "Mon,Thu,Sat", Classes: []string{"1A", "2A", "3A"},
		DepTime: "23:25", ArrTime: "15:45", ArrDay: 2, DurMin: 980,
		Stops: []stopDef{
			{Code: "CSTM", Num: 1, Arr: "--", Dep: "23:25", Day: 1, Dist: 0, Plt: "1"},
			{Code: "SC", Num: 2, Arr: "15:45", Dep: "--", Day: 2, Dist: 735, Plt: "6"},
		},
	},
	{
		Number: "12841", Name: "Coromandel Express", TType: "Superfast",
		Super: true, Pantry: true, RunsOn: "Daily", Classes: []string{"1A", "2A", "3A", "SL"},
		DepTime: "08:45", ArrTime: "09:05", ArrDay: 2, DurMin: 1460,
		Stops: []stopDef{
			{Code: "HWH", Num: 1, Arr: "--", Dep: "08:45", Day: 1, Dist: 0, Plt: "5"},
			{Code: "BBS", Num: 2, Arr: "18:55", Dep: "19:00", Halt: 5, Day: 1, Dist: 441, Plt: "1"},
			{Code: "VSKP", Num: 3, Arr: "22:40", Dep: "22:50", Halt: 10, Day: 1, Dist: 716, Plt: "2"},
			{Code: "BZA", Num: 4, Arr: "05:40", Dep: "05:50", Halt: 10, Day: 2, Dist: 1057, Plt: "1"},
			{Code: "MAS", Num: 5, Arr: "09:05", Dep: "--", Day: 2, Dist: 1662, Plt: "9"},
		},
	},
	{
		Number: "12057", Name: "New Delhi–Dehradun Shatabdi Express", TType: "Shatabdi",
		Super: true, Pantry: true, RunsOn: "Mon,Tue,Wed,Thu,Fri,Sat,Sun", Classes: []string{"CC", "EC"},
		DepTime: "06:45", ArrTime: "12:05", ArrDay: 1, DurMin: 320,
		Stops: []stopDef{
			{Code: "NDLS", Num: 1, Arr: "--", Dep: "06:45", Day: 1, Dist: 0, Plt: "5"},
			{Code: "HW", Num: 2, Arr: "11:15", Dep: "11:20", Halt: 5, Day: 1, Dist: 249, Plt: "1"},
			{Code: "DDN", Num: 3, Arr: "12:05", Dep: "--", Day: 1, Dist: 302, Plt: "1"},
		},
	},
	{
		Number: "12215", Name: "Delhi–Mysuru Garib Rath Express", TType: "Garib Rath",
		Super: true, Pantry: false, RunsOn: "Fri,Sun", Classes: []string{"3A"},
		DepTime: "21:40", ArrTime: "16:00", ArrDay: 3, DurMin: 2540,
		Stops: []stopDef{
			{Code: "NDLS", Num: 1, Arr: "--", Dep: "21:40", Day: 1, Dist: 0, Plt: "10"},
			{Code: "NGP", Num: 2, Arr: "08:10", Dep: "08:20", Halt: 10, Day: 2, Dist: 1100, Plt: "1"},
			{Code: "SC", Num: 3, Arr: "17:05", Dep: "17:15", Halt: 10, Day: 2, Dist: 1516, Plt: "4"},
			{Code: "SBC", Num: 4, Arr: "23:15", Dep: "23:25", Halt: 10, Day: 2, Dist: 2124, Plt: "7"},
			{Code: "MYS", Num: 5, Arr: "16:00", Dep: "--", Day: 3, Dist: 2560, Plt: "1"},
		},
	},
	{
		Number: "12679", Name: "Chennai–Coimbatore Intercity Express", TType: "Superfast",
		Super: true, Pantry: false, RunsOn: "Daily", Classes: []string{"CC", "2S"},
		DepTime: "06:25", ArrTime: "14:10", ArrDay: 1, DurMin: 465,
		Stops: []stopDef{
			{Code: "MAS", Num: 1, Arr: "--", Dep: "06:25", Day: 1, Dist: 0, Plt: "6"},
			{Code: "CBE", Num: 2, Arr: "14:10", Dep: "--", Day: 1, Dist: 497, Plt: "1"},
		},
	},
	{
		Number: "12645", Name: "Thirukkural Express", TType: "Superfast",
		Super: true, Pantry: true, RunsOn: "Daily", Classes: []string{"2A", "3A", "SL"},
		DepTime: "21:30", ArrTime: "13:15", ArrDay: 2, DurMin: 945,
		Stops: []stopDef{
			{Code: "MAS", Num: 1, Arr: "--", Dep: "21:30", Day: 1, Dist: 0, Plt: "8"},
			{Code: "MDU", Num: 2, Arr: "05:45", Dep: "05:50", Halt: 5, Day: 2, Dist: 492, Plt: "1"},
			{Code: "TVC", Num: 3, Arr: "13:15", Dep: "--", Day: 2, Dist: 773, Plt: "1"},
		},
	},
	{
		Number: "12515", Name: "Guwahati Express", TType: "Superfast",
		Super: true, Pantry: true, RunsOn: "Daily", Classes: []string{"2A", "3A", "SL"},
		DepTime: "15:55", ArrTime: "10:20", ArrDay: 3, DurMin: 2665,
		Stops: []stopDef{
			{Code: "NDLS", Num: 1, Arr: "--", Dep: "15:55", Day: 1, Dist: 0, Plt: "7"},
			{Code: "LKO", Num: 2, Arr: "23:25", Dep: "23:35", Halt: 10, Day: 1, Dist: 638, Plt: "3"},
			{Code: "PNBE", Num: 3, Arr: "07:55", Dep: "08:05", Halt: 10, Day: 2, Dist: 1013, Plt: "1"},
			{Code: "KOAA", Num: 4, Arr: "16:45", Dep: "16:55", Halt: 10, Day: 2, Dist: 1442, Plt: "1"},
			{Code: "GHY", Num: 5, Arr: "10:20", Dep: "--", Day: 3, Dist: 1963, Plt: "1"},
		},
	},
	{
		Number: "12841", Name: "East Coast Express", TType: "Superfast",
		Super: true, Pantry: true, RunsOn: "Daily", Classes: []string{"2A", "3A", "SL"},
		DepTime: "06:30", ArrTime: "21:00", ArrDay: 2, DurMin: 1470,
		Stops: []stopDef{
			{Code: "HWH", Num: 1, Arr: "--", Dep: "06:30", Day: 1, Dist: 0, Plt: "2"},
			{Code: "BBS", Num: 2, Arr: "17:30", Dep: "17:40", Halt: 10, Day: 1, Dist: 441, Plt: "1"},
			{Code: "VSKP", Num: 3, Arr: "23:05", Dep: "23:15", Halt: 10, Day: 1, Dist: 716, Plt: "1"},
			{Code: "SC", Num: 4, Arr: "21:00", Dep: "--", Day: 2, Dist: 1424, Plt: "4"},
		},
	},
	{
		Number: "22945", Name: "Mumbai–Jodhpur Saurashtra Express", TType: "Superfast",
		Super: true, Pantry: false, RunsOn: "Daily", Classes: []string{"2A", "3A", "SL"},
		DepTime: "23:45", ArrTime: "20:35", ArrDay: 2, DurMin: 1250,
		Stops: []stopDef{
			{Code: "MMCT", Num: 1, Arr: "--", Dep: "23:45", Day: 1, Dist: 0, Plt: "4"},
			{Code: "ADI", Num: 2, Arr: "07:20", Dep: "07:30", Halt: 10, Day: 2, Dist: 492, Plt: "1"},
			{Code: "JU", Num: 3, Arr: "20:35", Dep: "--", Day: 2, Dist: 1033, Plt: "1"},
		},
	},
	{
		Number: "12496", Name: "Pratap Express (Jaipur–Udaipur)", TType: "Express",
		Super: false, Pantry: false, RunsOn: "Daily", Classes: []string{"2A", "3A", "SL", "2S"},
		DepTime: "06:00", ArrTime: "12:25", ArrDay: 1, DurMin: 385,
		Stops: []stopDef{
			{Code: "JP", Num: 1, Arr: "--", Dep: "06:00", Day: 1, Dist: 0, Plt: "1"},
			{Code: "UDZ", Num: 2, Arr: "12:25", Dep: "--", Day: 1, Dist: 330, Plt: "1"},
		},
	},
}

// SeedTrainsIfEmpty seeds train data if no stations exist yet.
func SeedTrainsIfEmpty() error {
	var count int64
	db.DB.Model(&models.Station{}).Count(&count)
	if count > 0 {
		log.Printf("✓ Train seed skipped (already %d stations)", count)
		return nil
	}
	log.Println("→ Seeding train data...")

	// Stations
	if err := db.DB.Create(&trainStations).Error; err != nil {
		return fmt.Errorf("seed stations: %w", err)
	}
	stationByCode := make(map[string]models.Station)
	for _, s := range trainStations {
		stationByCode[s.Code] = s
	}

	// Trains + route stops
	now := time.Now().UTC()
	for _, td := range trainDefs {
		train := models.Train{
			Number:      td.Number,
			Name:        td.Name,
			TrainType:   td.TType,
			IsSuperfast: td.Super,
			HasPantry:   td.Pantry,
			RunsOn:      td.RunsOn,
			Classes:     joinStrings(td.Classes),
		}
		if err := db.DB.Create(&train).Error; err != nil {
			return fmt.Errorf("seed train %s: %w", td.Number, err)
		}

		// Route stops
		for _, sd := range td.Stops {
			sta, ok := stationByCode[sd.Code]
			if !ok {
				log.Printf("⚠ station %s not found for train %s", sd.Code, td.Number)
				continue
			}
			stop := models.TrainRouteStop{
				TrainID:       train.ID,
				StationID:     sta.ID,
				StopNumber:    sd.Num,
				ArrivalTime:   sd.Arr,
				DepartureTime: sd.Dep,
				HaltMin:       sd.Halt,
				DistanceKM:    sd.Dist,
				DayNumber:     sd.Day,
				Platform:      sd.Plt,
			}
			if err := db.DB.Create(&stop).Error; err != nil {
				return fmt.Errorf("seed stop: %w", err)
			}
		}

		// Origin + destination for this train
		if len(td.Stops) < 2 {
			continue
		}
		originCode := td.Stops[0].Code
		termCode := td.Stops[len(td.Stops)-1].Code
		originSta, ok1 := stationByCode[originCode]
		termSta, ok2 := stationByCode[termCode]
		if !ok1 || !ok2 {
			continue
		}
		termDist := td.Stops[len(td.Stops)-1].Dist

		// Schedules for next 14 days
		var schedules []models.TrainSchedule
		for d := 0; d < 14; d++ {
			journeyDay := now.AddDate(0, 0, d)
			journeyDate := time.Date(journeyDay.Year(), journeyDay.Month(), journeyDay.Day(), 0, 0, 0, 0, time.UTC)

			sched := models.TrainSchedule{
				TrainID:       train.ID,
				FromStationID: originSta.ID,
				ToStationID:   termSta.ID,
				JourneyDate:   journeyDate,
				DepartureTime: td.DepTime,
				ArrivalTime:   td.ArrTime,
				ArrivalDay:    td.ArrDay,
				DurationMin:   td.DurMin,
				IsActive:      true,
			}
			schedules = append(schedules, sched)
		}
		if err := db.DB.Create(&schedules).Error; err != nil {
			return fmt.Errorf("seed schedules for %s: %w", td.Number, err)
		}

		// Class availability per schedule
		var availability []models.TrainClassAvailability
		for _, sched := range schedules {
			for _, cls := range td.Classes {
				cap := classCapacity(cls)
				avail := cap - rand.Intn(cap/3)
				rac := 0
				wl := 0
				if avail <= 0 {
					avail = 0
					rac = rand.Intn(10)
					if rac == 0 {
						wl = rand.Intn(50) + 1
					}
				}
				base, tatkal := classFares(cls, termDist)
				// Add small random jitter
				base = math.Round((base+float64(rand.Intn(50)-25))/10) * 10
				availability = append(availability, models.TrainClassAvailability{
					ScheduleID:    sched.ID,
					Class:         cls,
					TotalBerths:   cap,
					Available:     avail,
					RAC:           rac,
					WaitlistCount: wl,
					BaseFare:      base,
					TatkalFare:    tatkal,
					Status:        availStatus(avail, rac, wl),
				})
			}
		}
		if len(availability) > 0 {
			if err := db.DB.CreateInBatches(&availability, 200).Error; err != nil {
				return fmt.Errorf("seed availability for %s: %w", td.Number, err)
			}
		}
	}

	log.Printf("✓ Seeded %d trains with 14 days of schedules", len(trainDefs))
	return nil
}

func joinStrings(ss []string) string {
	out := ""
	for i, s := range ss {
		if i > 0 {
			out += ","
		}
		out += s
	}
	return out
}

// generateTrainPNR creates a fake 10-digit PNR.
func GenerateTrainPNR() string {
	const digits = "0123456789"
	b := make([]byte, 10)
	for i := range b {
		b[i] = digits[rand.Intn(len(digits))]
	}
	// PNR starts with 1-9
	for b[0] == '0' {
		b[0] = digits[1+rand.Intn(9)]
	}
	return string(b)
}

// GenerateTrainRef generates a booking reference like IY-TRN-ABC123.
func GenerateTrainRef() string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 6)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return "IY-TRN-" + string(b)
}

// ExtendTrainSchedules ensures every Go-seeded train has schedules through today+days.
// Safe to call on every startup — skips trains already covered.
func ExtendTrainSchedules(days int) error {
	type trainRow struct {
		ID      string
		Number  string
		Classes string
	}
	var trains []trainRow
	if err := db.DB.Raw("SELECT id::text, number, classes FROM trains").Scan(&trains).Error; err != nil {
		return err
	}
	if len(trains) == 0 {
		return nil
	}

	today := time.Now().UTC().Truncate(24 * time.Hour)
	horizon := today.AddDate(0, 0, days)
	totalNew := 0

	for _, tr := range trains {
		var td *trainDef
		for i := range trainDefs {
			if trainDefs[i].Number == tr.Number {
				td = &trainDefs[i]
				break
			}
		}
		if td == nil {
			continue // SQL-seeded train with IY-coded number — skip
		}

		var stops []models.TrainRouteStop
		if err := db.DB.Where("train_id = ?", tr.ID).Order("stop_number ASC").Find(&stops).Error; err != nil || len(stops) < 2 {
			continue
		}
		fromStationID := stops[0].StationID
		toStationID := stops[len(stops)-1].StationID
		totalDist := stops[len(stops)-1].DistanceKM

		var schedCount int64
		db.DB.Model(&models.TrainSchedule{}).Where("train_id = ?", tr.ID).Count(&schedCount)

		var startDate time.Time
		if schedCount == 0 {
			startDate = today
		} else {
			var maxDate time.Time
			db.DB.Model(&models.TrainSchedule{}).
				Where("train_id = ?", tr.ID).
				Select("MAX(journey_date)").
				Scan(&maxDate)
			startDate = maxDate.AddDate(0, 0, 1)
			if startDate.Before(today) {
				startDate = today
			}
		}
		if !startDate.Before(horizon) {
			continue
		}

		var schedules []models.TrainSchedule
		for d := startDate; d.Before(horizon); d = d.AddDate(0, 0, 1) {
			schedules = append(schedules, models.TrainSchedule{
				TrainID:       stops[0].TrainID,
				FromStationID: fromStationID,
				ToStationID:   toStationID,
				JourneyDate:   time.Date(d.Year(), d.Month(), d.Day(), 0, 0, 0, 0, time.UTC),
				DepartureTime: td.DepTime,
				ArrivalTime:   td.ArrTime,
				ArrivalDay:    td.ArrDay,
				DurationMin:   td.DurMin,
				IsActive:      true,
			})
		}
		if len(schedules) == 0 {
			continue
		}
		if err := db.DB.CreateInBatches(&schedules, 100).Error; err != nil {
			log.Printf("  ✗ extend schedules for train %s: %v", tr.Number, err)
			continue
		}

		classes := strings.Split(tr.Classes, ",")
		var avails []models.TrainClassAvailability
		for _, sched := range schedules {
			for _, cls := range classes {
				cls = strings.TrimSpace(cls)
				if cls == "" {
					continue
				}
				cap := classCapacity(cls)
				avail := cap - rand.Intn(cap/3+1)
				base, tatkal := classFares(cls, totalDist)
				base = math.Round((base+float64(rand.Intn(50)-25))/10) * 10
				avails = append(avails, models.TrainClassAvailability{
					ScheduleID:  sched.ID,
					Class:       cls,
					TotalBerths: cap,
					Available:   avail,
					BaseFare:    base,
					TatkalFare:  tatkal,
					Status:      "AVAILABLE",
				})
			}
		}
		if len(avails) > 0 {
			if err := db.DB.CreateInBatches(&avails, 200).Error; err != nil {
				log.Printf("  ✗ extend availability for train %s: %v", tr.Number, err)
			}
		}

		totalNew += len(schedules)
	}

	if totalNew > 0 {
		log.Printf("✓ Extended train schedules: +%d entries (through %s)", totalNew, horizon.Format("2006-01-02"))
	} else {
		log.Printf("✓ Train schedules already cover through %s", horizon.Format("2006-01-02"))
	}
	return nil
}

// Ensure uuid is used (referenced in booking creation).
var _ = uuid.New
