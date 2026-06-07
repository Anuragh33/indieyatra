package seed

import (
	"fmt"
	"log"

	"github.com/anuragh/indieyatra/backend/internal/db"
	"github.com/anuragh/indieyatra/backend/internal/models"
)

type hotelDef struct {
	Name         string
	Slug         string
	City         string
	State        string
	Address      string
	Stars        int
	Rating       float64
	Reviews      int
	Desc         string
	Image        string
	Tags         string
	PropertyType string
	Amenities    string
	Lat          float64
	Lon          float64
}

var hotelDefs = []hotelDef{
	// Goa
	{
		Name: "The Leela Goa", Slug: "leela-goa", City: "Goa", State: "Goa",
		Address: "Mobor, Cavelossim, South Goa",
		Stars: 5, Rating: 4.8, Reviews: 3240,
		Desc:   "Sprawling beachfront resort on the Sal river estuary with private beach access, multiple pools, and world-class dining.",
		Image:  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
		Tags: "Beach,Luxury", PropertyType: "Resort",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar,beach",
		Lat: 15.1606, Lon: 73.9498,
	},
	{
		Name: "Alila Diwa Goa", Slug: "alila-diwa-goa", City: "Goa", State: "Goa",
		Address: "Adao Waddo, Majorda, South Goa",
		Stars: 5, Rating: 4.7, Reviews: 1820,
		Desc:   "Boutique luxury resort surrounded by paddy fields with a unique Goan village aesthetic and award-winning spa.",
		Image:  "https://images.unsplash.com/photo-1540541338537-71acf84b5b4e?w=800&q=80",
		Tags: "Beach,Boutique", PropertyType: "Resort",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 15.2527, Lon: 73.9447,
	},
	{
		Name: "Park Hyatt Goa", Slug: "park-hyatt-goa", City: "Goa", State: "Goa",
		Address: "Arossim Beach, Cansaulim, South Goa",
		Stars: 5, Rating: 4.6, Reviews: 2100,
		Desc:   "Indo-Portuguese architecture meets modern luxury on a private beach. Known for its lagoon pools and sunset views.",
		Image:  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
		Tags: "Beach,Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar,beach",
		Lat: 15.2200, Lon: 73.9500,
	},
	{
		Name: "Zostel Goa", Slug: "zostel-goa", City: "Goa", State: "Goa",
		Address: "Anjuna Beach Road, North Goa",
		Stars: 2, Rating: 4.3, Reviews: 5600,
		Desc:   "Popular backpacker hostel near Anjuna Beach with vibrant social scene, rooftop bar, and dorm beds from ₹500.",
		Image:  "https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=800&q=80",
		Tags: "Beach,Budget", PropertyType: "Hostel",
		Amenities: "wifi,restaurant,bar,ac",
		Lat: 15.5740, Lon: 73.7407,
	},
	// Jaipur
	{
		Name: "Rambagh Palace", Slug: "rambagh-palace", City: "Jaipur", State: "Rajasthan",
		Address: "Bhawani Singh Road, Jaipur",
		Stars: 5, Rating: 4.9, Reviews: 4120,
		Desc:   "Former residence of the Maharaja of Jaipur, now a Taj hotel offering regal suites, polo grounds, and authentic Rajasthani cuisine.",
		Image:  "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80",
		Tags: "Heritage,Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 26.8874, Lon: 75.8027,
	},
	{
		Name: "Samode Palace", Slug: "samode-palace", City: "Jaipur", State: "Rajasthan",
		Address: "Samode Village, Jaipur",
		Stars: 5, Rating: 4.8, Reviews: 980,
		Desc:   "500-year-old palace with hand-painted frescoes, royal durbar halls, and a rooftop pool overlooking the Aravalli hills.",
		Image:  "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&q=80",
		Tags: "Heritage,Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,restaurant,parking,ac,bar",
		Lat: 27.1800, Lon: 75.4400,
	},
	{
		Name: "Dera Mandawa Jaipur", Slug: "dera-mandawa-jaipur", City: "Jaipur", State: "Rajasthan",
		Address: "Sansar Chandra Road, Civil Lines, Jaipur",
		Stars: 4, Rating: 4.5, Reviews: 760,
		Desc:   "Heritage haveli with hand-painted interiors, courtyard garden, and rooftop dining. Excellent location near Rambagh.",
		Image:  "https://images.unsplash.com/photo-1590377698765-f45ec2fa7c12?w=800&q=80",
		Tags: "Heritage,Boutique", PropertyType: "Hotel",
		Amenities: "wifi,pool,restaurant,parking,ac",
		Lat: 26.8900, Lon: 75.8100,
	},
	{
		Name: "Zostel Jaipur", Slug: "zostel-jaipur", City: "Jaipur", State: "Rajasthan",
		Address: "Near Hawa Mahal, Old City, Jaipur",
		Stars: 2, Rating: 4.4, Reviews: 3200,
		Desc:   "Budget backpacker stay in the heart of old Jaipur, walking distance to Hawa Mahal and bazaars.",
		Image:  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
		Tags: "Heritage,Budget", PropertyType: "Hostel",
		Amenities: "wifi,restaurant,ac",
		Lat: 26.9239, Lon: 75.8267,
	},
	// Mumbai
	{
		Name: "The Taj Mahal Palace Mumbai", Slug: "taj-mahal-palace-mumbai", City: "Mumbai", State: "Maharashtra",
		Address: "Apollo Bunder, Colaba, Mumbai",
		Stars: 5, Rating: 4.9, Reviews: 8740,
		Desc:   "The iconic 1903 landmark overlooking the Gateway of India. Unmatched heritage, impeccable service, legendary butler program.",
		Image:  "https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=800&q=80",
		Tags: "Luxury,Heritage", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 18.9218, Lon: 72.8330,
	},
	{
		Name: "The Oberoi Mumbai", Slug: "oberoi-mumbai", City: "Mumbai", State: "Maharashtra",
		Address: "Nariman Point, Mumbai",
		Stars: 5, Rating: 4.8, Reviews: 3560,
		Desc:   "Contemporary luxury tower on Marine Drive with panoramic sea views, Michelin-star dining, and an iconic rooftop pool.",
		Image:  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
		Tags: "Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 18.9322, Lon: 72.8235,
	},
	{
		Name: "Juhu Residency", Slug: "juhu-residency-mumbai", City: "Mumbai", State: "Maharashtra",
		Address: "Juhu Beach Road, Juhu, Mumbai",
		Stars: 3, Rating: 4.2, Reviews: 1240,
		Desc:   "Comfortable mid-range hotel a short walk from Juhu Beach. Great for families visiting Bollywood studios nearby.",
		Image:  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
		Tags: "City", PropertyType: "Hotel",
		Amenities: "wifi,restaurant,parking,ac",
		Lat: 19.0985, Lon: 72.8285,
	},
	// Shimla
	{
		Name: "Wildflower Hall", Slug: "wildflower-hall-shimla", City: "Shimla", State: "Himachal Pradesh",
		Address: "Chharabra, Shimla",
		Stars: 5, Rating: 4.8, Reviews: 2180,
		Desc:   "Former estate of Lord Kitchener at 8,250 ft surrounded by cedar forest. Pine-scented air, heated infinity pool, and mountain spa.",
		Image:  "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80",
		Tags: "Mountain,Luxury", PropertyType: "Resort",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar,mountain",
		Lat: 31.1100, Lon: 77.2000,
	},
	{
		Name: "The Cecil Shimla", Slug: "the-cecil-shimla", City: "Shimla", State: "Himachal Pradesh",
		Address: "Chaura Maidan, Shimla",
		Stars: 5, Rating: 4.7, Reviews: 1340,
		Desc:   "Colonial-era Oberoi property built in 1884. Grand interiors, billiards room, and views of the Himalayan foothills.",
		Image:  "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80",
		Tags: "Heritage,Mountain", PropertyType: "Hotel",
		Amenities: "wifi,spa,gym,restaurant,parking,ac",
		Lat: 31.1048, Lon: 77.1734,
	},
	{
		Name: "Zostel Shimla", Slug: "zostel-shimla", City: "Shimla", State: "Himachal Pradesh",
		Address: "The Ridge, Shimla",
		Stars: 2, Rating: 4.5, Reviews: 2800,
		Desc:   "Centrally located hostel right on The Ridge with unobstructed mountain views and a lively common room.",
		Image:  "https://images.unsplash.com/photo-1536625979259-3d61e6c7a8c4?w=800&q=80",
		Tags: "Mountain,Budget", PropertyType: "Hostel",
		Amenities: "wifi,restaurant,ac",
		Lat: 31.1048, Lon: 77.1734,
	},
	// Kerala / Kochi
	{
		Name: "The Brunton Boatyard", Slug: "brunton-boatyard-kochi", City: "Kochi", State: "Kerala",
		Address: "Old Harbour, Kochi",
		Stars: 5, Rating: 4.8, Reviews: 1960,
		Desc:   "Heritage hotel built on a 19th-century boatyard. Dutch and Portuguese architectural details with Kochi harbour views.",
		Image:  "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80",
		Tags: "Heritage,Boutique", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,restaurant,parking,ac,bar",
		Lat: 9.9630, Lon: 76.2399,
	},
	{
		Name: "Fragrant Nature Kochi", Slug: "fragrant-nature-kochi", City: "Kochi", State: "Kerala",
		Address: "Thevara Ferry Junction, Kochi",
		Stars: 4, Rating: 4.5, Reviews: 880,
		Desc:   "Modern business hotel on the backwaters edge, popular for the rooftop pool and authentic Keralan meals.",
		Image:  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
		Tags: "City", PropertyType: "Hotel",
		Amenities: "wifi,pool,restaurant,parking,ac",
		Lat: 9.9426, Lon: 76.2782,
	},
	// Delhi
	{
		Name: "The Imperial New Delhi", Slug: "imperial-new-delhi", City: "Delhi", State: "Delhi",
		Address: "Janpath, New Delhi",
		Stars: 5, Rating: 4.9, Reviews: 5640,
		Desc:   "1930s colonial landmark on Janpath with Art Deco interiors, 1911 restaurant, and one of India's finest art collections.",
		Image:  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
		Tags: "Heritage,Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 28.6230, Lon: 77.2195,
	},
	{
		Name: "The Lodhi Delhi", Slug: "lodhi-delhi", City: "Delhi", State: "Delhi",
		Address: "Lodhi Road, New Delhi",
		Stars: 5, Rating: 4.8, Reviews: 2940,
		Desc:   "Contemporary all-suite luxury hotel set around a 13-acre garden. India's first hotel with private pool in every suite.",
		Image:  "https://images.unsplash.com/photo-1540541338537-71acf84b5b4e?w=800&q=80",
		Tags: "Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 28.5921, Lon: 77.2246,
	},
	{
		Name: "Zostel Delhi", Slug: "zostel-delhi", City: "Delhi", State: "Delhi",
		Address: "Paharganj, New Delhi",
		Stars: 2, Rating: 4.2, Reviews: 4100,
		Desc:   "Backpacker favourite in Paharganj, 500m from New Delhi Railway Station. Rooftop chill-out area and free Wi-Fi.",
		Image:  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
		Tags: "Budget", PropertyType: "Hostel",
		Amenities: "wifi,restaurant,ac",
		Lat: 28.6410, Lon: 77.2095,
	},
	// Bengaluru
	{
		Name: "The Taj West End", Slug: "taj-west-end-bengaluru", City: "Bengaluru", State: "Karnataka",
		Address: "Race Course Road, Bengaluru",
		Stars: 5, Rating: 4.8, Reviews: 3120,
		Desc:   "25 acres of tropical gardens in the heart of Bengaluru. The original luxury address since 1887 — colonial bungalows and heritage charm.",
		Image:  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
		Tags: "Heritage,Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 12.9774, Lon: 77.5744,
	},
	{
		Name: "ITC Gardenia Bengaluru", Slug: "itc-gardenia-bengaluru", City: "Bengaluru", State: "Karnataka",
		Address: "Residency Road, Bengaluru",
		Stars: 5, Rating: 4.7, Reviews: 2280,
		Desc:   "LEED Platinum certified luxury tower — Karnataka's greenest skyscraper hotel with rooftop pool and five dining concepts.",
		Image:  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
		Tags: "Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 12.9647, Lon: 77.6002,
	},
	{
		Name: "Treebo Blue Lotus Bengaluru", Slug: "treebo-blue-lotus-bengaluru", City: "Bengaluru", State: "Karnataka",
		Address: "Koramangala, Bengaluru",
		Stars: 3, Rating: 4.3, Reviews: 1840,
		Desc:   "Smart budget hotel in Koramangala — clean rooms, dependable Wi-Fi, and close to the tech corridor and nightlife.",
		Image:  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
		Tags: "City,Budget", PropertyType: "Hotel",
		Amenities: "wifi,restaurant,parking,ac",
		Lat: 12.9352, Lon: 77.6245,
	},
	// Hyderabad
	{
		Name: "Taj Falaknuma Palace", Slug: "taj-falaknuma-palace-hyderabad", City: "Hyderabad", State: "Telangana",
		Address: "Engine Bowli, Falaknuma, Hyderabad",
		Stars: 5, Rating: 4.9, Reviews: 4820,
		Desc:   "The Nizam's private palace perched 2,000 feet above Hyderabad. Marble jali work, horse-drawn carriage arrivals, and butler service.",
		Image:  "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80",
		Tags: "Heritage,Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 17.3270, Lon: 78.4673,
	},
	{
		Name: "ITC Kohenur Hyderabad", Slug: "itc-kohenur-hyderabad", City: "Hyderabad", State: "Telangana",
		Address: "HITEC City, Hyderabad",
		Stars: 5, Rating: 4.7, Reviews: 1960,
		Desc:   "Modern luxury in HITEC City — floating terrace pools, the Ottimo Cucina restaurant, and stellar views of Hyderabad's skyline.",
		Image:  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
		Tags: "Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 17.4432, Lon: 78.3772,
	},
	{
		Name: "Ibis Hyderabad", Slug: "ibis-hyderabad", City: "Hyderabad", State: "Telangana",
		Address: "Hitec City Road, Hyderabad",
		Stars: 3, Rating: 4.2, Reviews: 2340,
		Desc:   "Value hotel next to HITEC City Metro station. Smart Pod rooms, 24-hour bar, and walking distance to Cyberabad offices.",
		Image:  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
		Tags: "City,Budget", PropertyType: "Hotel",
		Amenities: "wifi,restaurant,parking,ac",
		Lat: 17.4432, Lon: 78.3736,
	},
	// Chennai
	{
		Name: "ITC Grand Chola Chennai", Slug: "itc-grand-chola-chennai", City: "Chennai", State: "Tamil Nadu",
		Address: "Mount Road, Chennai",
		Stars: 5, Rating: 4.8, Reviews: 3560,
		Desc:   "South India's grandest luxury hotel — Chola-inspired architecture, 600 rooms across towers, seven dining concepts, and a 25m pool.",
		Image:  "https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=800&q=80",
		Tags: "Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 13.0068, Lon: 80.2206,
	},
	{
		Name: "Radisson Blu Chennai", Slug: "radisson-blu-chennai", City: "Chennai", State: "Tamil Nadu",
		Address: "GN Chetty Road, T Nagar, Chennai",
		Stars: 4, Rating: 4.5, Reviews: 1880,
		Desc:   "Central T Nagar location — infinity pool, Kebabs & Kurries restaurant, and walking access to Chennai's top shopping district.",
		Image:  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
		Tags: "City", PropertyType: "Hotel",
		Amenities: "wifi,pool,restaurant,parking,ac",
		Lat: 13.0418, Lon: 80.2341,
	},
	// Pune
	{
		Name: "Conrad Pune", Slug: "conrad-pune", City: "Pune", State: "Maharashtra",
		Address: "Mangaldas Road, Pune",
		Stars: 5, Rating: 4.7, Reviews: 2140,
		Desc:   "Contemporary luxury at Koregaon Park — rooftop infinity pool, Lobby Bar, and SPA Conrad on the 8th floor with city panoramas.",
		Image:  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
		Tags: "Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 18.5309, Lon: 73.8934,
	},
	{
		Name: "The Corinthians Resort", Slug: "corinthians-resort-pune", City: "Pune", State: "Maharashtra",
		Address: "Nyati County Road, Undri, Pune",
		Stars: 5, Rating: 4.6, Reviews: 1280,
		Desc:   "Serene resort on Pune's outskirts — Greco-Roman architecture, sprawling pool, golf access, and a world-class spa.",
		Image:  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
		Tags: "Luxury", PropertyType: "Resort",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 18.4536, Lon: 73.9062,
	},
	// Kolkata
	{
		Name: "The Oberoi Grand Kolkata", Slug: "oberoi-grand-kolkata", City: "Kolkata", State: "West Bengal",
		Address: "Jawaharlal Nehru Road, Kolkata",
		Stars: 5, Rating: 4.8, Reviews: 3840,
		Desc:   "Kolkata's legendary grande dame since 1841 — arched verandahs, the iconic Chowringhee setting, and impeccable Oberoi service.",
		Image:  "https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=800&q=80",
		Tags: "Heritage,Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 22.5611, Lon: 88.3485,
	},
	{
		Name: "Zostel Kolkata", Slug: "zostel-kolkata", City: "Kolkata", State: "West Bengal",
		Address: "Park Street, Kolkata",
		Stars: 2, Rating: 4.4, Reviews: 3200,
		Desc:   "Park Street hostel with iconic rooftop views of Kolkata. Steps from New Market and the city's famous cafe culture.",
		Image:  "https://images.unsplash.com/photo-1536625979259-3d61e6c7a8c4?w=800&q=80",
		Tags: "Budget", PropertyType: "Hostel",
		Amenities: "wifi,restaurant,ac",
		Lat: 22.5518, Lon: 88.3523,
	},
	// Udaipur
	{
		Name: "Taj Lake Palace Udaipur", Slug: "taj-lake-palace-udaipur", City: "Udaipur", State: "Rajasthan",
		Address: "Lake Pichola, Udaipur",
		Stars: 5, Rating: 5.0, Reviews: 6120,
		Desc:   "Floating marble palace on Lake Pichola — unquestionably India's most romantic hotel. Boat transfers, courtyard garden, and royal cuisine.",
		Image:  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
		Tags: "Heritage,Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,ac,bar",
		Lat: 24.5760, Lon: 73.6800,
	},
	{
		Name: "Oberoi Udaivilas Udaipur", Slug: "oberoi-udaivilas-udaipur", City: "Udaipur", State: "Rajasthan",
		Address: "Haridasji Ki Magri, Mulla Talai, Udaipur",
		Stars: 5, Rating: 4.9, Reviews: 3760,
		Desc:   "Sprawling white marble property on Lake Pichola with private pools in some rooms, peacock-dotted gardens, and a boat jetty.",
		Image:  "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&q=80",
		Tags: "Heritage,Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 24.5777, Lon: 73.6746,
	},
	{
		Name: "Zostel Udaipur", Slug: "zostel-udaipur", City: "Udaipur", State: "Rajasthan",
		Address: "Gangaur Ghat Marg, Udaipur",
		Stars: 2, Rating: 4.6, Reviews: 2980,
		Desc:   "Lakeside hostel with the most photographed rooftop in Udaipur. Dorms from ₹450, private rooms available, kayaking nearby.",
		Image:  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
		Tags: "Heritage,Budget", PropertyType: "Hostel",
		Amenities: "wifi,restaurant,ac",
		Lat: 24.5792, Lon: 73.6847,
	},
	// Agra
	{
		Name: "The Oberoi Amarvilas Agra", Slug: "oberoi-amarvilas-agra", City: "Agra", State: "Uttar Pradesh",
		Address: "Taj East Gate Road, Agra",
		Stars: 5, Rating: 4.9, Reviews: 5280,
		Desc:   "Every room views the Taj Mahal directly. Mughal-inspired architecture with fountains, terraced lawns, and world-class dining 600m from the Taj.",
		Image:  "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80",
		Tags: "Heritage,Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 27.1734, Lon: 78.0424,
	},
	{
		Name: "Zostel Agra", Slug: "zostel-agra", City: "Agra", State: "Uttar Pradesh",
		Address: "Fatehabad Road, Agra",
		Stars: 2, Rating: 4.3, Reviews: 2640,
		Desc:   "Budget stay with rooftop Taj views — unbeatable for sunrise photography. Close to the Eastern Gate and local eateries.",
		Image:  "https://images.unsplash.com/photo-1536625979259-3d61e6c7a8c4?w=800&q=80",
		Tags: "Heritage,Budget", PropertyType: "Hostel",
		Amenities: "wifi,restaurant,ac",
		Lat: 27.1763, Lon: 78.0319,
	},
	// Varanasi
	{
		Name: "BrijRama Palace Varanasi", Slug: "brijrama-palace-varanasi", City: "Varanasi", State: "Uttar Pradesh",
		Address: "Darbhanga Ghat, Varanasi",
		Stars: 5, Rating: 4.8, Reviews: 2160,
		Desc:   "18th-century river palace directly on the ghats. Sunrise boat rides, Ganga Aarti from your balcony, and heritage Banarasi cuisine.",
		Image:  "https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=800&q=80",
		Tags: "Heritage,Spiritual", PropertyType: "Hotel",
		Amenities: "wifi,restaurant,ac,spa",
		Lat: 25.3086, Lon: 83.0109,
	},
	{
		Name: "Zostel Varanasi", Slug: "zostel-varanasi", City: "Varanasi", State: "Uttar Pradesh",
		Address: "Assi Ghat, Varanasi",
		Stars: 2, Rating: 4.5, Reviews: 4400,
		Desc:   "On the banks of the Ganga at Assi Ghat. Rooftop yoga sessions, boat rides arranged, evening Aarti walks with staff.",
		Image:  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
		Tags: "Spiritual,Budget", PropertyType: "Hostel",
		Amenities: "wifi,restaurant",
		Lat: 25.2967, Lon: 83.0108,
	},
	// Rishikesh
	{
		Name: "Ananda in the Himalayas", Slug: "ananda-himalayas-rishikesh", City: "Rishikesh", State: "Uttarakhand",
		Address: "The Palace Estate, Narendra Nagar, Rishikesh",
		Stars: 5, Rating: 4.9, Reviews: 3040,
		Desc:   "India's premier destination spa set in a Viceregal palace. 24,000 sq ft spa, Ayurvedic treatments, and Himalayan yoga sessions.",
		Image:  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
		Tags: "Mountain,Luxury,Wellness", PropertyType: "Resort",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,mountain",
		Lat: 30.1292, Lon: 78.2834,
	},
	{
		Name: "Zostel Rishikesh", Slug: "zostel-rishikesh", City: "Rishikesh", State: "Uttarakhand",
		Address: "Tapovan, Rishikesh",
		Stars: 2, Rating: 4.6, Reviews: 5800,
		Desc:   "Yoga central and adventure base camp. Rooftop Ganga views, bonfire nights, rafting and bungee packages arranged.",
		Image:  "https://images.unsplash.com/photo-1588083949404-c4f1ed1323b3?w=800&q=80",
		Tags: "Mountain,Budget,Adventure", PropertyType: "Hostel",
		Amenities: "wifi,restaurant",
		Lat: 30.1082, Lon: 78.2955,
	},
	// Manali
	{
		Name: "Solang Valley Resort", Slug: "solang-valley-resort-manali", City: "Manali", State: "Himachal Pradesh",
		Address: "Solang Valley, Manali",
		Stars: 4, Rating: 4.5, Reviews: 1640,
		Desc:   "Ski-in/ski-out resort at the Solang Nala with mountain-facing rooms, bonfire evenings, and snow activities in winter.",
		Image:  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
		Tags: "Mountain,Adventure", PropertyType: "Resort",
		Amenities: "wifi,restaurant,parking,mountain",
		Lat: 32.3168, Lon: 77.1526,
	},
	{
		Name: "Zostel Manali", Slug: "zostel-manali", City: "Manali", State: "Himachal Pradesh",
		Address: "Old Manali, Manali",
		Stars: 2, Rating: 4.7, Reviews: 6200,
		Desc:   "Old Manali's most loved hostel — bonfire, apple orchards, mountain bikes, and free treks to nearby villages.",
		Image:  "https://images.unsplash.com/photo-1536625979259-3d61e6c7a8c4?w=800&q=80",
		Tags: "Mountain,Budget", PropertyType: "Hostel",
		Amenities: "wifi,restaurant",
		Lat: 32.2554, Lon: 77.1783,
	},
	// Ahmedabad
	{
		Name: "House of MG Ahmedabad", Slug: "house-of-mg-ahmedabad", City: "Ahmedabad", State: "Gujarat",
		Address: "Lal Darwaja, Ahmedabad",
		Stars: 4, Rating: 4.7, Reviews: 2180,
		Desc:   "1924 heritage mansion in the old city — hand-carved banisters, courtyard dining, and the legendary Agashiye rooftop thali restaurant.",
		Image:  "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=800&q=80",
		Tags: "Heritage,Boutique", PropertyType: "Hotel",
		Amenities: "wifi,pool,restaurant,parking,ac",
		Lat: 23.0220, Lon: 72.5713,
	},
	// Amritsar
	{
		Name: "Taj Swarna Amritsar", Slug: "taj-swarna-amritsar", City: "Amritsar", State: "Punjab",
		Address: "Queens Road, Amritsar",
		Stars: 5, Rating: 4.7, Reviews: 2420,
		Desc:   "The finest address in Amritsar — 10-minute walk from the Golden Temple, with butler service and authentic Punjabi cuisine.",
		Image:  "https://images.unsplash.com/photo-1609691534257-bfb1e7a1a9a5?w=800&q=80",
		Tags: "Heritage,Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 31.6340, Lon: 74.8732,
	},
	{
		Name: "Zostel Amritsar", Slug: "zostel-amritsar", City: "Amritsar", State: "Punjab",
		Address: "Near Golden Temple, Amritsar",
		Stars: 2, Rating: 4.5, Reviews: 3600,
		Desc:   "200m from the Golden Temple. Early morning Langar visits, guided Wagah Border trips, and free Amritsari kulcha tours.",
		Image:  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
		Tags: "Heritage,Budget,Spiritual", PropertyType: "Hostel",
		Amenities: "wifi,restaurant",
		Lat: 31.6200, Lon: 74.8765,
	},
	// Mysuru
	{
		Name: "Radisson Blu Plaza Hotel Mysuru", Slug: "radisson-blu-mysuru", City: "Mysuru", State: "Karnataka",
		Address: "Nazarbad Main Road, Mysuru",
		Stars: 5, Rating: 4.7, Reviews: 1880,
		Desc:   "Mysuru's premium address — terrace pool, Sapphire restaurant with palace views, and a heritage walk package to Mysore Palace.",
		Image:  "https://images.unsplash.com/photo-1601897823538-6ce0e73f5f7b?w=800&q=80",
		Tags: "Heritage,Luxury", PropertyType: "Hotel",
		Amenities: "wifi,pool,spa,gym,restaurant,parking,ac,bar",
		Lat: 12.2958, Lon: 76.6394,
	},
}

type roomDef struct {
	RoomType         string
	BedType          string
	MaxOccupancy     int
	Sizesqft         int
	PricePerNight    float64
	OriginalPrice    float64
	TaxPercent       float64
	TotalRooms       int
	BreakfastIncl    bool
	FreeCancellation bool
	CancellationHours int
	Amenities        string
}

func roomsForStars(stars int) []roomDef {
	switch stars {
	case 5:
		return []roomDef{
			{
				RoomType: "Deluxe Room", BedType: "King", MaxOccupancy: 2, Sizesqft: 450,
				PricePerNight: 18000, OriginalPrice: 22000, TaxPercent: 12,
				TotalRooms: 20, BreakfastIncl: false, FreeCancellation: true, CancellationHours: 48,
				Amenities: "tv,ac,minibar,bathtub,wifi,cityview",
			},
			{
				RoomType: "Premium Room", BedType: "King", MaxOccupancy: 2, Sizesqft: 600,
				PricePerNight: 26000, OriginalPrice: 32000, TaxPercent: 12,
				TotalRooms: 12, BreakfastIncl: true, FreeCancellation: true, CancellationHours: 24,
				Amenities: "tv,ac,minibar,bathtub,balcony,wifi,cityview",
			},
			{
				RoomType: "Suite", BedType: "King", MaxOccupancy: 3, Sizesqft: 900,
				PricePerNight: 48000, OriginalPrice: 60000, TaxPercent: 18,
				TotalRooms: 6, BreakfastIncl: true, FreeCancellation: false, CancellationHours: 72,
				Amenities: "tv,ac,minibar,bathtub,balcony,wifi,poolview,butler",
			},
		}
	case 4:
		return []roomDef{
			{
				RoomType: "Standard Room", BedType: "Double", MaxOccupancy: 2, Sizesqft: 280,
				PricePerNight: 6500, OriginalPrice: 8000, TaxPercent: 12,
				TotalRooms: 30, BreakfastIncl: false, FreeCancellation: true, CancellationHours: 24,
				Amenities: "tv,ac,wifi",
			},
			{
				RoomType: "Deluxe Room", BedType: "King", MaxOccupancy: 2, Sizesqft: 380,
				PricePerNight: 9500, OriginalPrice: 11500, TaxPercent: 12,
				TotalRooms: 18, BreakfastIncl: true, FreeCancellation: true, CancellationHours: 24,
				Amenities: "tv,ac,minibar,wifi,cityview",
			},
		}
	case 3:
		return []roomDef{
			{
				RoomType: "Standard Room", BedType: "Double", MaxOccupancy: 2, Sizesqft: 220,
				PricePerNight: 3200, OriginalPrice: 3800, TaxPercent: 12,
				TotalRooms: 40, BreakfastIncl: false, FreeCancellation: true, CancellationHours: 24,
				Amenities: "tv,ac,wifi",
			},
			{
				RoomType: "Deluxe Room", BedType: "King", MaxOccupancy: 2, Sizesqft: 300,
				PricePerNight: 4500, OriginalPrice: 5500, TaxPercent: 12,
				TotalRooms: 15, BreakfastIncl: true, FreeCancellation: true, CancellationHours: 24,
				Amenities: "tv,ac,minibar,wifi",
			},
		}
	default: // 1-2 star / hostel
		return []roomDef{
			{
				RoomType: "Dormitory Bed", BedType: "Single", MaxOccupancy: 1, Sizesqft: 60,
				PricePerNight: 650, OriginalPrice: 800, TaxPercent: 5,
				TotalRooms: 30, BreakfastIncl: false, FreeCancellation: true, CancellationHours: 12,
				Amenities: "wifi,ac",
			},
			{
				RoomType: "Private Room", BedType: "Double", MaxOccupancy: 2, Sizesqft: 140,
				PricePerNight: 1800, OriginalPrice: 2200, TaxPercent: 12,
				TotalRooms: 10, BreakfastIncl: false, FreeCancellation: true, CancellationHours: 12,
				Amenities: "tv,wifi,ac",
			},
		}
	}
}

func SeedHotelsIfEmpty() error {
	var count int64
	db.DB.Model(&models.Hotel{}).Count(&count)
	if count > 0 {
		log.Printf("✓ Hotel seed skipped (already %d hotels)", count)
		return nil
	}
	log.Println("→ Seeding hotels...")

	for _, hd := range hotelDefs {
		hotel := models.Hotel{
			Name: hd.Name, Slug: hd.Slug,
			City: hd.City, State: hd.State, Address: hd.Address,
			Latitude: hd.Lat, Longitude: hd.Lon,
			StarRating: hd.Stars, Rating: hd.Rating, TotalReviews: hd.Reviews,
			Description: hd.Desc, ImageURL: hd.Image,
			Tags: hd.Tags, PropertyType: hd.PropertyType, Amenities: hd.Amenities,
			CheckInTime: "14:00", CheckOutTime: "11:00",
			IsActive: true,
		}
		if err := db.DB.Where("slug = ?", hd.Slug).FirstOrCreate(&hotel).Error; err != nil {
			return fmt.Errorf("seed hotel %s: %w", hd.Slug, err)
		}

		for _, rd := range roomsForStars(hd.Stars) {
			room := models.HotelRoom{
				HotelID:           hotel.ID,
				RoomType:          rd.RoomType,
				BedType:           rd.BedType,
				MaxOccupancy:      rd.MaxOccupancy,
				Sizesqft:          rd.Sizesqft,
				PricePerNight:     rd.PricePerNight,
				OriginalPrice:     rd.OriginalPrice,
				TaxPercent:        rd.TaxPercent,
				TotalRooms:        rd.TotalRooms,
				AvailableRooms:    rd.TotalRooms - 2,
				Amenities:         rd.Amenities,
				BreakfastIncl:     rd.BreakfastIncl,
				FreeCancellation:  rd.FreeCancellation,
				CancellationHours: rd.CancellationHours,
				IsActive:          true,
			}
			db.DB.Where("hotel_id = ? AND room_type = ?", hotel.ID, rd.RoomType).FirstOrCreate(&room)
		}
	}

	log.Printf("✓ Seeded %d hotels", len(hotelDefs))
	return nil
}
