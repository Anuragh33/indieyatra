package seed

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/anuragh/indiebus/backend/internal/db"
	"github.com/anuragh/indiebus/backend/internal/models"
)

var flightAirports = []models.Airport{
	{IATA: "BOM", Name: "Chhatrapati Shivaji Maharaj International Airport", City: "Mumbai", State: "Maharashtra", Terminal: "T2", Latitude: 19.0896, Longitude: 72.8656},
	{IATA: "DEL", Name: "Indira Gandhi International Airport", City: "New Delhi", State: "Delhi", Terminal: "T3", Latitude: 28.5665, Longitude: 77.1031},
	{IATA: "MAA", Name: "Chennai International Airport", City: "Chennai", State: "Tamil Nadu", Terminal: "T1", Latitude: 12.9941, Longitude: 80.1709},
	{IATA: "CCU", Name: "Netaji Subhas Chandra Bose International Airport", City: "Kolkata", State: "West Bengal", Terminal: "T2", Latitude: 22.6520, Longitude: 88.4463},
	{IATA: "BLR", Name: "Kempegowda International Airport", City: "Bengaluru", State: "Karnataka", Terminal: "T1", Latitude: 13.1986, Longitude: 77.7066},
	{IATA: "HYD", Name: "Rajiv Gandhi International Airport", City: "Hyderabad", State: "Telangana", Terminal: "T1", Latitude: 17.2403, Longitude: 78.4294},
	{IATA: "COK", Name: "Cochin International Airport", City: "Kochi", State: "Kerala", Terminal: "T3", Latitude: 10.1520, Longitude: 76.3919},
	{IATA: "AMD", Name: "Sardar Vallabhbhai Patel International Airport", City: "Ahmedabad", State: "Gujarat", Terminal: "T1", Latitude: 23.0772, Longitude: 72.6347},
	{IATA: "JAI", Name: "Jaipur International Airport", City: "Jaipur", State: "Rajasthan", Terminal: "T2", Latitude: 26.8242, Longitude: 75.8122},
	{IATA: "GOI", Name: "Goa International Airport", City: "Goa", State: "Goa", Terminal: "T1", Latitude: 15.3808, Longitude: 73.8314},
	// Tier-2 airports
	{IATA: "NAG", Name: "Dr. Babasaheb Ambedkar International Airport", City: "Nagpur", State: "Maharashtra", Terminal: "T1", Latitude: 21.0922, Longitude: 79.0472},
	{IATA: "PNQ", Name: "Pune Airport", City: "Pune", State: "Maharashtra", Terminal: "T1", Latitude: 18.5821, Longitude: 73.9197},
	{IATA: "IDR", Name: "Devi Ahilya Bai Holkar Airport", City: "Indore", State: "Madhya Pradesh", Terminal: "T1", Latitude: 22.7218, Longitude: 75.8011},
	{IATA: "VNS", Name: "Lal Bahadur Shastri International Airport", City: "Varanasi", State: "Uttar Pradesh", Terminal: "T2", Latitude: 25.4524, Longitude: 82.8593},
	{IATA: "IXC", Name: "Chandigarh International Airport", City: "Chandigarh", State: "Punjab", Terminal: "T2", Latitude: 30.6735, Longitude: 76.7885},
	{IATA: "ATQ", Name: "Sri Guru Ram Dass Jee International Airport", City: "Amritsar", State: "Punjab", Terminal: "T2", Latitude: 31.7096, Longitude: 74.7973},
	{IATA: "UDR", Name: "Maharana Pratap Airport", City: "Udaipur", State: "Rajasthan", Terminal: "T1", Latitude: 24.6177, Longitude: 73.8961},
	{IATA: "JDH", Name: "Jodhpur Airport", City: "Jodhpur", State: "Rajasthan", Terminal: "T1", Latitude: 26.2511, Longitude: 73.0489},
	{IATA: "CJB", Name: "Coimbatore International Airport", City: "Coimbatore", State: "Tamil Nadu", Terminal: "T1", Latitude: 11.0299, Longitude: 77.0435},
	{IATA: "IXM", Name: "Madurai Airport", City: "Madurai", State: "Tamil Nadu", Terminal: "T1", Latitude: 9.8345, Longitude: 78.0934},
	{IATA: "VTZ", Name: "Visakhapatnam Airport", City: "Visakhapatnam", State: "Andhra Pradesh", Terminal: "T1", Latitude: 17.7212, Longitude: 83.2245},
	{IATA: "BBI", Name: "Biju Patnaik International Airport", City: "Bhubaneswar", State: "Odisha", Terminal: "T2", Latitude: 20.2444, Longitude: 85.8178},
	{IATA: "GAU", Name: "Lokpriya Gopinath Bordoloi International Airport", City: "Guwahati", State: "Assam", Terminal: "T2", Latitude: 26.1061, Longitude: 91.5859},
	{IATA: "IXL", Name: "Kushok Bakula Rimpochhe Airport", City: "Leh", State: "Ladakh", Terminal: "T1", Latitude: 34.1359, Longitude: 77.5465},
	{IATA: "SXR", Name: "Sheikh ul-Alam International Airport", City: "Srinagar", State: "Jammu & Kashmir", Terminal: "T1", Latitude: 33.9871, Longitude: 74.7742},
	{IATA: "IXZ", Name: "Veer Savarkar International Airport", City: "Port Blair", State: "Andaman & Nicobar", Terminal: "T1", Latitude: 11.6412, Longitude: 92.7297},
	{IATA: "DED", Name: "Jolly Grant Airport", City: "Dehradun", State: "Uttarakhand", Terminal: "T1", Latitude: 30.1897, Longitude: 78.1804},
	{IATA: "IXE", Name: "Mangaluru International Airport", City: "Mangaluru", State: "Karnataka", Terminal: "T1", Latitude: 12.9613, Longitude: 74.8903},
}

var flightAirlines = []models.Airline{
	{Code: "6E", Name: "IndiGo", LogoURL: "/airlines/indigo.svg", Color: "#1B3A6B"},
	{Code: "AI", Name: "Air India", LogoURL: "/airlines/airindia.svg", Color: "#C8102E"},
	{Code: "SG", Name: "SpiceJet", LogoURL: "/airlines/spicejet.svg", Color: "#E05000"},
	{Code: "UK", Name: "Vistara", LogoURL: "/airlines/vistara.svg", Color: "#6A2875"},
	{Code: "I5", Name: "AirAsia India", LogoURL: "/airlines/airasia.svg", Color: "#FF0000"},
	{Code: "QP", Name: "Akasa Air", LogoURL: "/airlines/akasa.svg", Color: "#FF6600"},
}

type flightDef struct {
	AirlineCode string
	Number      string
	From        string
	To          string
	DepTime     string
	ArrTime     string
	DurMin      int
	Aircraft    string
	CabinClass  string
	Seats       int
	BaseFare    float64
	FareType    string
	HasMeal     bool
	HasWifi     bool
	BaggageKg   int
	OnTime      int
}

var flightDefs = []flightDef{
	// Mumbai ↔ Delhi
	{"6E", "6E-204", "BOM", "DEL", "06:00", "08:10", 130, "A320", "Economy", 180, 4500, "Saver", false, false, 15, 88},
	{"AI", "AI-665", "BOM", "DEL", "07:30", "09:40", 130, "A321", "Economy", 162, 5200, "Value", true, false, 25, 82},
	{"UK", "UK-981", "BOM", "DEL", "09:00", "11:10", 130, "A320neo", "Economy", 158, 6800, "Flexi", true, true, 20, 91},
	{"SG", "SG-101", "BOM", "DEL", "11:30", "13:40", 130, "B737", "Economy", 189, 3800, "Saver", false, false, 15, 79},
	{"6E", "6E-212", "BOM", "DEL", "14:00", "16:10", 130, "A320", "Economy", 180, 4200, "Value", false, false, 15, 87},
	{"AI", "AI-671", "BOM", "DEL", "17:00", "19:15", 135, "A321", "Economy", 162, 5500, "Value", true, false, 25, 83},
	{"6E", "6E-218", "BOM", "DEL", "20:00", "22:10", 130, "A320", "Economy", 180, 3600, "Saver", false, false, 15, 86},
	// Return Delhi → Mumbai
	{"6E", "6E-205", "DEL", "BOM", "06:30", "08:40", 130, "A320", "Economy", 180, 4500, "Saver", false, false, 15, 88},
	{"AI", "AI-670", "DEL", "BOM", "08:00", "10:10", 130, "A321", "Economy", 162, 5200, "Value", true, false, 25, 82},
	{"UK", "UK-980", "DEL", "BOM", "12:00", "14:10", 130, "A320neo", "Economy", 158, 6800, "Flexi", true, true, 20, 91},
	{"SG", "SG-102", "DEL", "BOM", "15:30", "17:40", 130, "B737", "Economy", 189, 3800, "Saver", false, false, 15, 79},
	{"6E", "6E-220", "DEL", "BOM", "19:00", "21:10", 130, "A320", "Economy", 180, 4000, "Value", false, false, 15, 87},
	// Mumbai ↔ Bengaluru
	{"6E", "6E-314", "BOM", "BLR", "06:30", "08:00", 90, "A320", "Economy", 180, 3200, "Saver", false, false, 15, 89},
	{"AI", "AI-505", "BOM", "BLR", "10:00", "11:30", 90, "A319", "Economy", 144, 3900, "Value", true, false, 25, 84},
	{"I5", "I5-371", "BOM", "BLR", "14:00", "15:30", 90, "A320", "Economy", 180, 2800, "Saver", false, false, 15, 81},
	{"6E", "6E-318", "BLR", "BOM", "07:00", "08:30", 90, "A320", "Economy", 180, 3200, "Saver", false, false, 15, 89},
	{"AI", "AI-506", "BLR", "BOM", "11:00", "12:30", 90, "A319", "Economy", 144, 3900, "Value", true, false, 25, 84},
	// Delhi ↔ Bengaluru
	{"6E", "6E-441", "DEL", "BLR", "07:00", "09:30", 150, "A321", "Economy", 189, 5500, "Saver", false, false, 15, 87},
	{"AI", "AI-501", "DEL", "BLR", "09:30", "12:00", 150, "A321", "Economy", 162, 6200, "Value", true, false, 25, 83},
	{"UK", "UK-801", "DEL", "BLR", "14:00", "16:30", 150, "A320neo", "Economy", 158, 7500, "Flexi", true, true, 20, 92},
	{"QP", "QP-1111", "DEL", "BLR", "18:00", "20:30", 150, "B737 MAX", "Economy", 189, 4800, "Value", false, false, 15, 85},
	{"6E", "6E-442", "BLR", "DEL", "06:00", "08:30", 150, "A321", "Economy", 189, 5500, "Saver", false, false, 15, 87},
	{"AI", "AI-502", "BLR", "DEL", "10:00", "12:30", 150, "A321", "Economy", 162, 6200, "Value", true, false, 25, 83},
	// Mumbai ↔ Chennai
	{"6E", "6E-521", "BOM", "MAA", "07:30", "09:30", 120, "A320", "Economy", 180, 3800, "Saver", false, false, 15, 86},
	{"AI", "AI-657", "BOM", "MAA", "11:00", "13:00", 120, "A320", "Economy", 150, 4500, "Value", true, false, 25, 81},
	{"SG", "SG-201", "MAA", "BOM", "08:00", "10:00", 120, "B737", "Economy", 189, 3600, "Saver", false, false, 15, 80},
	// Delhi ↔ Hyderabad
	{"6E", "6E-601", "DEL", "HYD", "06:00", "08:15", 135, "A320", "Economy", 180, 4200, "Saver", false, false, 15, 88},
	{"AI", "AI-539", "DEL", "HYD", "10:30", "12:45", 135, "A321", "Economy", 162, 5000, "Value", true, false, 25, 82},
	{"UK", "UK-851", "DEL", "HYD", "15:00", "17:15", 135, "A320neo", "Economy", 158, 6500, "Flexi", true, true, 20, 90},
	{"6E", "6E-602", "HYD", "DEL", "07:00", "09:15", 135, "A320", "Economy", 180, 4200, "Saver", false, false, 15, 88},
	// Mumbai ↔ Goa
	{"6E", "6E-711", "BOM", "GOI", "06:00", "07:10", 70, "A320", "Economy", 180, 2200, "Saver", false, false, 15, 90},
	{"SG", "SG-301", "BOM", "GOI", "09:30", "10:40", 70, "B737", "Economy", 189, 1900, "Saver", false, false, 15, 83},
	{"AI", "AI-613", "BOM", "GOI", "14:00", "15:10", 70, "A319", "Economy", 144, 2600, "Value", true, false, 25, 86},
	{"6E", "6E-712", "GOI", "BOM", "11:30", "12:40", 70, "A320", "Economy", 180, 2200, "Saver", false, false, 15, 90},
	// Delhi ↔ Kolkata
	{"6E", "6E-751", "DEL", "CCU", "07:00", "09:20", 140, "A320", "Economy", 180, 4800, "Saver", false, false, 15, 85},
	{"AI", "AI-701", "DEL", "CCU", "10:00", "12:20", 140, "A321", "Economy", 162, 5600, "Value", true, false, 25, 80},
	{"6E", "6E-752", "CCU", "DEL", "06:30", "08:50", 140, "A320", "Economy", 180, 4800, "Saver", false, false, 15, 85},
	// Bengaluru ↔ Hyderabad
	{"6E", "6E-831", "BLR", "HYD", "07:00", "08:00", 60, "A320", "Economy", 180, 1800, "Saver", false, false, 15, 91},
	{"AI", "AI-561", "BLR", "HYD", "12:00", "13:00", 60, "A319", "Economy", 144, 2200, "Value", true, false, 25, 85},
	{"6E", "6E-832", "HYD", "BLR", "08:30", "09:30", 60, "A320", "Economy", 180, 1800, "Saver", false, false, 15, 91},
	// Delhi ↔ Ahmedabad
	{"6E", "6E-901", "DEL", "AMD", "07:30", "09:00", 90, "A320", "Economy", 180, 3200, "Saver", false, false, 15, 87},
	{"SG", "SG-401", "DEL", "AMD", "11:00", "12:30", 90, "B737", "Economy", 189, 2800, "Saver", false, false, 15, 82},
	{"6E", "6E-902", "AMD", "DEL", "09:30", "11:00", 90, "A320", "Economy", 180, 3200, "Saver", false, false, 15, 87},
	// Mumbai ↔ Jaipur
	{"6E", "6E-951", "BOM", "JAI", "08:00", "09:30", 90, "A320", "Economy", 180, 3500, "Saver", false, false, 15, 86},
	{"AI", "AI-411", "BOM", "JAI", "13:00", "14:30", 90, "A319", "Economy", 144, 4200, "Value", true, false, 25, 83},
	{"6E", "6E-952", "JAI", "BOM", "10:00", "11:30", 90, "A320", "Economy", 180, 3500, "Saver", false, false, 15, 86},
	// Bengaluru ↔ Kochi
	{"6E", "6E-351", "BLR", "COK", "07:30", "08:45", 75, "A320", "Economy", 180, 2400, "Saver", false, false, 15, 89},
	{"AI", "AI-471", "BLR", "COK", "13:00", "14:15", 75, "ATR-72", "Economy", 70, 2800, "Value", true, false, 15, 85},
	{"6E", "6E-352", "COK", "BLR", "09:30", "10:45", 75, "A320", "Economy", 180, 2400, "Saver", false, false, 15, 89},
	// Tier-2 routes
	// Mumbai ↔ Pune
	{"6E", "6E-171", "BOM", "PNQ", "06:00", "06:55", 55, "ATR-72", "Economy", 70, 1800, "Saver", false, false, 15, 87},
	{"AI", "AI-441", "BOM", "PNQ", "09:30", "10:25", 55, "ATR-72", "Economy", 70, 2200, "Value", true, false, 15, 83},
	{"6E", "6E-172", "PNQ", "BOM", "11:30", "12:25", 55, "ATR-72", "Economy", 70, 1800, "Saver", false, false, 15, 87},
	// Delhi ↔ Chandigarh
	{"6E", "6E-181", "DEL", "IXC", "06:30", "07:20", 50, "ATR-72", "Economy", 70, 2500, "Saver", false, false, 15, 88},
	{"AI", "AI-451", "DEL", "IXC", "12:00", "12:50", 50, "ATR-72", "Economy", 70, 3000, "Value", true, false, 15, 84},
	{"6E", "6E-182", "IXC", "DEL", "08:00", "08:50", 50, "ATR-72", "Economy", 70, 2500, "Saver", false, false, 15, 88},
	// Delhi ↔ Amritsar
	{"6E", "6E-191", "DEL", "ATQ", "07:00", "08:10", 70, "A320", "Economy", 180, 3200, "Saver", false, false, 15, 86},
	{"SG", "SG-501", "DEL", "ATQ", "14:00", "15:10", 70, "B737", "Economy", 189, 2800, "Saver", false, false, 15, 82},
	{"6E", "6E-192", "ATQ", "DEL", "09:00", "10:10", 70, "A320", "Economy", 180, 3200, "Saver", false, false, 15, 86},
	// Delhi ↔ Varanasi
	{"6E", "6E-251", "DEL", "VNS", "06:00", "07:15", 75, "A320", "Economy", 180, 3800, "Saver", false, false, 15, 85},
	{"AI", "AI-421", "DEL", "VNS", "11:00", "12:15", 75, "A319", "Economy", 144, 4500, "Value", true, false, 25, 81},
	{"6E", "6E-252", "VNS", "DEL", "08:00", "09:15", 75, "A320", "Economy", 180, 3800, "Saver", false, false, 15, 85},
	// Delhi ↔ Udaipur
	{"6E", "6E-261", "DEL", "UDR", "07:30", "09:00", 90, "ATR-72", "Economy", 70, 3500, "Saver", false, false, 15, 84},
	{"AI", "AI-431", "DEL", "UDR", "13:00", "14:30", 90, "ATR-72", "Economy", 70, 4200, "Value", true, false, 15, 82},
	{"6E", "6E-262", "UDR", "DEL", "10:00", "11:30", 90, "ATR-72", "Economy", 70, 3500, "Saver", false, false, 15, 84},
	// Mumbai ↔ Nagpur
	{"6E", "6E-271", "BOM", "NAG", "06:30", "08:00", 90, "A320", "Economy", 180, 3200, "Saver", false, false, 15, 88},
	{"SG", "SG-551", "BOM", "NAG", "11:00", "12:30", 90, "B737", "Economy", 189, 2800, "Saver", false, false, 15, 80},
	{"6E", "6E-272", "NAG", "BOM", "08:30", "10:00", 90, "A320", "Economy", 180, 3200, "Saver", false, false, 15, 88},
	// Delhi ↔ Jodhpur
	{"6E", "6E-281", "DEL", "JDH", "07:00", "08:20", 80, "ATR-72", "Economy", 70, 3400, "Saver", false, false, 15, 85},
	{"AI", "AI-461", "DEL", "JDH", "13:30", "14:50", 80, "ATR-72", "Economy", 70, 4000, "Value", true, false, 15, 81},
	{"6E", "6E-282", "JDH", "DEL", "09:30", "10:50", 80, "ATR-72", "Economy", 70, 3400, "Saver", false, false, 15, 85},
	// Bengaluru ↔ Coimbatore
	{"6E", "6E-361", "BLR", "CJB", "07:00", "07:55", 55, "ATR-72", "Economy", 70, 2200, "Saver", false, false, 15, 87},
	{"AI", "AI-481", "BLR", "CJB", "14:00", "14:55", 55, "ATR-72", "Economy", 70, 2600, "Value", true, false, 15, 84},
	{"6E", "6E-362", "CJB", "BLR", "09:00", "09:55", 55, "ATR-72", "Economy", 70, 2200, "Saver", false, false, 15, 87},
	// Bengaluru ↔ Mangaluru
	{"6E", "6E-371", "BLR", "IXE", "07:30", "08:15", 45, "ATR-72", "Economy", 70, 2000, "Saver", false, false, 15, 88},
	{"AI", "AI-491", "BLR", "IXE", "15:00", "15:45", 45, "ATR-72", "Economy", 70, 2400, "Value", true, false, 15, 85},
	{"6E", "6E-372", "IXE", "BLR", "09:00", "09:45", 45, "ATR-72", "Economy", 70, 2000, "Saver", false, false, 15, 88},
	// Delhi/Kolkata ↔ Guwahati
	{"6E", "6E-581", "DEL", "GAU", "07:00", "09:30", 150, "A320", "Economy", 180, 5200, "Saver", false, false, 15, 84},
	{"AI", "AI-721", "DEL", "GAU", "10:30", "13:00", 150, "A319", "Economy", 144, 6000, "Value", true, false, 25, 80},
	{"6E", "6E-582", "GAU", "DEL", "07:00", "09:30", 150, "A320", "Economy", 180, 5200, "Saver", false, false, 15, 84},
	{"6E", "6E-583", "CCU", "GAU", "07:30", "08:30", 60, "ATR-72", "Economy", 70, 2800, "Saver", false, false, 15, 83},
	// Delhi ↔ Leh
	{"AI", "AI-445", "DEL", "IXL", "07:00", "08:35", 95, "A319", "Economy", 144, 7500, "Value", true, false, 25, 79},
	{"SG", "SG-451", "DEL", "IXL", "10:30", "12:05", 95, "B737", "Economy", 189, 6800, "Saver", false, false, 15, 75},
	{"AI", "AI-446", "IXL", "DEL", "09:45", "11:20", 95, "A319", "Economy", 144, 7500, "Value", true, false, 25, 79},
	// Delhi ↔ Srinagar
	{"6E", "6E-591", "DEL", "SXR", "06:30", "07:55", 85, "A320", "Economy", 180, 4800, "Saver", false, false, 15, 82},
	{"AI", "AI-814", "DEL", "SXR", "11:00", "12:25", 85, "A319", "Economy", 144, 5600, "Value", true, false, 25, 78},
	{"6E", "6E-592", "SXR", "DEL", "09:00", "10:25", 85, "A320", "Economy", 180, 4800, "Saver", false, false, 15, 82},
	// Mumbai ↔ Port Blair
	{"AI", "AI-771", "BOM", "IXZ", "08:00", "10:30", 150, "A319", "Economy", 144, 8500, "Value", true, false, 25, 80},
	{"6E", "6E-771", "BOM", "IXZ", "14:00", "16:30", 150, "A320", "Economy", 180, 7800, "Saver", false, false, 15, 82},
	// Delhi ↔ Dehradun
	{"6E", "6E-161", "DEL", "DED", "06:00", "06:55", 55, "ATR-72", "Economy", 70, 2800, "Saver", false, false, 15, 85},
	{"AI", "AI-411", "DEL", "DED", "09:00", "09:55", 55, "ATR-72", "Economy", 70, 3400, "Value", true, false, 15, 82},
	{"6E", "6E-162", "DED", "DEL", "07:30", "08:25", 55, "ATR-72", "Economy", 70, 2800, "Saver", false, false, 15, 85},
	// Chennai ↔ Visakhapatnam
	{"6E", "6E-611", "MAA", "VTZ", "06:30", "07:45", 75, "A320", "Economy", 180, 3200, "Saver", false, false, 15, 86},
	{"AI", "AI-551", "MAA", "VTZ", "12:00", "13:15", 75, "A319", "Economy", 144, 3800, "Value", true, false, 25, 82},
	{"6E", "6E-612", "VTZ", "MAA", "08:30", "09:45", 75, "A320", "Economy", 180, 3200, "Saver", false, false, 15, 86},
	// Kolkata ↔ Bhubaneswar
	{"6E", "6E-621", "CCU", "BBI", "07:00", "07:55", 55, "ATR-72", "Economy", 70, 2400, "Saver", false, false, 15, 85},
	{"AI", "AI-561", "CCU", "BBI", "11:30", "12:25", 55, "ATR-72", "Economy", 70, 2900, "Value", true, false, 15, 81},
	{"6E", "6E-622", "BBI", "CCU", "08:30", "09:25", 55, "ATR-72", "Economy", 70, 2400, "Saver", false, false, 15, 85},
	// Delhi ↔ Indore
	{"6E", "6E-291", "DEL", "IDR", "07:30", "09:00", 90, "A320", "Economy", 180, 3600, "Saver", false, false, 15, 86},
	{"SG", "SG-591", "DEL", "IDR", "14:00", "15:30", 90, "B737", "Economy", 189, 3100, "Saver", false, false, 15, 81},
	{"6E", "6E-292", "IDR", "DEL", "09:30", "11:00", 90, "A320", "Economy", 180, 3600, "Saver", false, false, 15, 86},
	// Mumbai ↔ Indore
	{"6E", "6E-381", "BOM", "IDR", "07:00", "08:20", 80, "A320", "Economy", 180, 2900, "Saver", false, false, 15, 87},
	{"AI", "AI-531", "BOM", "IDR", "14:00", "15:20", 80, "A319", "Economy", 144, 3500, "Value", true, false, 25, 83},
	{"6E", "6E-382", "IDR", "BOM", "09:00", "10:20", 80, "A320", "Economy", 180, 2900, "Saver", false, false, 15, 87},
}

func SeedFlights() {
	// Check if already seeded
	var count int64
	db.DB.Model(&models.Airport{}).Count(&count)
	if count > 0 {
		log.Println("→ Flights already seeded, skipping")
		return
	}

	log.Println("→ Seeding flights...")

	// Seed airports
	airportMap := map[string]models.Airport{}
	for _, a := range flightAirports {
		airport := a
		if err := db.DB.Where(models.Airport{IATA: a.IATA}).FirstOrCreate(&airport).Error; err != nil {
			log.Printf("  ✗ airport %s: %v", a.IATA, err)
			continue
		}
		airportMap[a.IATA] = airport
	}
	log.Printf("  ✓ %d airports", len(airportMap))

	// Seed airlines
	airlineMap := map[string]models.Airline{}
	for _, a := range flightAirlines {
		airline := a
		if err := db.DB.Where(models.Airline{Code: a.Code}).FirstOrCreate(&airline).Error; err != nil {
			log.Printf("  ✗ airline %s: %v", a.Code, err)
			continue
		}
		airlineMap[a.Code] = airline
	}
	log.Printf("  ✓ %d airlines", len(airlineMap))

	// Seed schedules for today + next 30 days
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	scheduleCount := 0
	today := time.Now().Truncate(24 * time.Hour)

	for dayOffset := 0; dayOffset < 30; dayOffset++ {
		journeyDate := today.AddDate(0, 0, dayOffset)

		for _, f := range flightDefs {
			fromAirport, ok1 := airportMap[f.From]
			toAirport, ok2 := airportMap[f.To]
			airline, ok3 := airlineMap[f.AirlineCode]
			if !ok1 || !ok2 || !ok3 {
				continue
			}

			// Vary availability and fare slightly by day
			fareMulti := 1.0 + float64(dayOffset)*0.008
			if dayOffset < 3 {
				fareMulti = 1.4 + float64(rng.Intn(20))/100
			} else if dayOffset > 20 {
				fareMulti = 0.9 + float64(rng.Intn(15))/100
			}
			seats := f.Seats - rng.Intn(f.Seats/3)

			sched := models.FlightSchedule{
				FlightNumber:   fmt.Sprintf("%s-%d", f.Number, journeyDate.Format("20060102")),
				AirlineID:      airline.ID,
				FromAirportID:  fromAirport.ID,
				ToAirportID:    toAirport.ID,
				JourneyDate:    journeyDate,
				DepartureTime:  f.DepTime,
				ArrivalTime:    f.ArrTime,
				DurationMin:    f.DurMin,
				Aircraft:       f.Aircraft,
				CabinClass:     f.CabinClass,
				TotalSeats:     f.Seats,
				AvailableSeats: seats,
				BaseFare:       float64(int(f.BaseFare*fareMulti/10)) * 10,
				TaxesAndFees:   float64(int(f.BaseFare*fareMulti*0.18/10)) * 10,
				BaggageKg:      f.BaggageKg,
				HasMeal:        f.HasMeal,
				HasWifi:        f.HasWifi,
				HasUSB:         f.HasWifi,
				OnTimePercent:  f.OnTime,
				FareType:       f.FareType,
				RefundPolicy:   map[string]string{"Saver": "Non-refundable", "Value": "₹3500 cancellation fee", "Flexi": "Full refund"}[f.FareType],
				IsActive:       true,
			}

			// Use flight number without date suffix for uniqueness check
			var existing models.FlightSchedule
			if err := db.DB.Where("flight_number = ? AND journey_date = ?", sched.FlightNumber, journeyDate).
				First(&existing).Error; err != nil {
				if err := db.DB.Create(&sched).Error; err != nil {
					log.Printf("  ✗ schedule %s: %v", sched.FlightNumber, err)
				} else {
					scheduleCount++
				}
			}
		}
	}

	log.Printf("  ✓ %d flight schedules seeded", scheduleCount)
}

// ExtendFlightSchedules ensures flight schedules are present through today+days.
// Assumes airports and airlines already exist (SeedFlights must have run first).
func ExtendFlightSchedules(days int) {
	var airportCount int64
	if err := db.DB.Model(&models.Airport{}).Count(&airportCount).Error; err != nil || airportCount == 0 {
		return
	}

	today := time.Now().Truncate(24 * time.Hour)
	horizon := today.AddDate(0, 0, days)

	var schedCount int64
	db.DB.Model(&models.FlightSchedule{}).Count(&schedCount)

	var startDate time.Time
	if schedCount == 0 {
		startDate = today
	} else {
		var maxDate time.Time
		db.DB.Model(&models.FlightSchedule{}).Select("MAX(journey_date)").Scan(&maxDate)
		startDate = maxDate.AddDate(0, 0, 1)
		if startDate.Before(today) {
			startDate = today
		}
	}
	if !startDate.Before(horizon) {
		log.Printf("✓ Flight schedules already cover through %s", horizon.Format("2006-01-02"))
		return
	}

	var airports []models.Airport
	db.DB.Find(&airports)
	airportMap := make(map[string]models.Airport, len(airports))
	for _, a := range airports {
		airportMap[a.IATA] = a
	}

	var airlines []models.Airline
	db.DB.Find(&airlines)
	airlineMap := make(map[string]models.Airline, len(airlines))
	for _, a := range airlines {
		airlineMap[a.Code] = a
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	var schedules []models.FlightSchedule

	for d := startDate; d.Before(horizon); d = d.AddDate(0, 0, 1) {
		dayOffset := int(d.Sub(today).Hours() / 24)
		for _, f := range flightDefs {
			fromAirport, ok1 := airportMap[f.From]
			toAirport, ok2 := airportMap[f.To]
			airline, ok3 := airlineMap[f.AirlineCode]
			if !ok1 || !ok2 || !ok3 {
				continue
			}
			fareMulti := 1.0 + float64(dayOffset)*0.008
			if dayOffset < 3 {
				fareMulti = 1.4 + float64(rng.Intn(20))/100
			} else if dayOffset > 20 {
				fareMulti = 0.9 + float64(rng.Intn(15))/100
			}
			seats := f.Seats - rng.Intn(f.Seats/3+1)
			schedules = append(schedules, models.FlightSchedule{
				FlightNumber:   fmt.Sprintf("%s-%s", f.Number, d.Format("20060102")),
				AirlineID:      airline.ID,
				FromAirportID:  fromAirport.ID,
				ToAirportID:    toAirport.ID,
				JourneyDate:    d,
				DepartureTime:  f.DepTime,
				ArrivalTime:    f.ArrTime,
				DurationMin:    f.DurMin,
				Aircraft:       f.Aircraft,
				CabinClass:     f.CabinClass,
				TotalSeats:     f.Seats,
				AvailableSeats: seats,
				BaseFare:       float64(int(f.BaseFare*fareMulti/10)) * 10,
				TaxesAndFees:   float64(int(f.BaseFare*fareMulti*0.18/10)) * 10,
				BaggageKg:      f.BaggageKg,
				HasMeal:        f.HasMeal,
				HasWifi:        f.HasWifi,
				HasUSB:         f.HasWifi,
				OnTimePercent:  f.OnTime,
				FareType:       f.FareType,
				RefundPolicy:   map[string]string{"Saver": "Non-refundable", "Value": "₹3500 cancellation fee", "Flexi": "Full refund"}[f.FareType],
				IsActive:       true,
			})
		}
	}

	if len(schedules) == 0 {
		return
	}
	if err := db.DB.CreateInBatches(&schedules, 100).Error; err != nil {
		log.Printf("  ✗ extend flight schedules: %v", err)
		return
	}
	log.Printf("✓ Extended flight schedules: +%d entries (through %s)", len(schedules), horizon.Format("2006-01-02"))
}
