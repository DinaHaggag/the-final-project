const BASE_URL = 'https://test.api.amadeus.com';
const TELEPORT_BASE_URL = "https://api.teleport.org/api/urban_areas/slug:";
const DEFAULT_IMAGE_URL = "images/default-img.jpg"; 
const AMADEUS_API_KEY = 'hpk2y5O7sfow9wrMqGuqX4vqO6BzWE5m';
const AMADEUS_API_SECRET = 'Ig09E6Ac5MQf5NfT';

// Elements
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const destinationsContainer = document.getElementById('destinations');
const itineraryList = document.getElementById('itinerary-list');
const itineraryInput = document.getElementById('itinerary-input');
const addItineraryBtn = document.getElementById('add-itinerary-btn');
const offersContainer = document.getElementById('offers'); 

let amadeusAccessToken = ''; // Token variable

// Get Auth Token from Amadeus API
const getAuthToken = async () => {
    try {
        const response = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'client_id': AMADEUS_API_KEY,
                'client_secret': AMADEUS_API_SECRET,
                'grant_type': 'client_credentials'
            })
        });
        const data = await response.json();
        amadeusAccessToken = data.access_token; // Store the token for later use
        return amadeusAccessToken;
    } catch (error) {
        console.error('Error fetching Amadeus auth token:', error);
    }
};

// Fetch destinations from Amadeus API
const fetchDestinations = async (keyword) => {
    const token = await getAuthToken();
    try {
        const response = await fetch(`${BASE_URL}/v1/reference-data/locations?keyword=${keyword}&subType=CITY`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching destinations:', error);
    }
};

// Predefined slug mapping for common cities
const citySlugMapping = {
    "new york": "new-york-ny",
    "san francisco": "san-francisco-bay-area",
    "paris": "paris",
    "london": "london",
};

// Fetch image for the city from Teleport API
const fetchCityImage = async (cityName) => {
    try {
        const normalizedCity = citySlugMapping[cityName.toLowerCase()] || cityName.toLowerCase().replace(/\s+/g, '-');
        const response = await fetch(`${TELEPORT_BASE_URL}${normalizedCity}/images/`); 
        const data = await response.json();
        return data.photos[0]?.image?.web || DEFAULT_IMAGE_URL; 
    } catch (error) {
        console.error('Error fetching city image:', error);
        return DEFAULT_IMAGE_URL; 
    }
};

// Render destinations to the UI
const renderDestinations = async (destinations) => {
    destinationsContainer.innerHTML = '';
    offersContainer.innerHTML = ''; // Clear previous offers

    for (const destination of destinations) {
        const cityName = destination.address.cityName;
        const cityImage = await fetchCityImage(cityName);

        const destinationCard = document.createElement('div');
        destinationCard.classList.add('border', 'rounded', 'p-4', 'cursor-pointer');
        destinationCard.innerHTML = `
            <img src="${cityImage}" alt="${cityName}" class="w-full h-48 object-cover rounded mb-2">
            <h2 class="text-lg font-bold">${cityName}</h2>
            <p>${destination.address.countryName}</p>
        `;
        destinationCard.onclick = () => addDestinationToItinerary(cityName);

        destinationsContainer.appendChild(destinationCard);
    }

    // Fetch and display flight offers
    const flightOffers = await fetchFlightOffers('JFK', 'LHR', '2024-11-15'); // Example parameters
    if (flightOffers.length > 0) {
        flightOffers.forEach((offer) => {
            const offerElement = document.createElement('div');
            offerElement.innerHTML = `
                <div class="offer-card border rounded p-4 m-2">
                    <h3 class="text-lg font-bold">Flight Offer</h3>
                    <p>Price: ${offer.price.total} ${offer.price.currency}</p>
                </div>
            `;
            offersContainer.appendChild(offerElement);
        });
    }

    // Fetch and display hotel offers
    const hotelOffers = await fetchHotelOffers('PAR');  // Example city code for Paris
    if (hotelOffers.length > 0) {
        hotelOffers.forEach((offer) => {
            const offerElement = document.createElement('div');
            offerElement.innerHTML = `
                <div class="offer-card border rounded p-4 m-2">
                    <h3 class="text-lg font-bold">Hotel Offer</h3>
                    <p>Price: ${offer.offers[0].price.total} ${offer.offers[0].price.currency}</p>
                    <p>Hotel Name: ${offer.hotel.name}</p>
                </div>
            `;
            offersContainer.appendChild(offerElement);
        });
    }
};

// Search button event listener
searchBtn.addEventListener('click', async () => {
    const query = searchInput.value;
    if (query) {
        const destinations = await fetchDestinations(query);
        await renderDestinations(destinations);
    }
});

// Add destination to itinerary
const addDestinationToItinerary = (destination) => {
    const itineraryItem = document.createElement('li');
    itineraryItem.textContent = destination;
    itineraryList.appendChild(itineraryItem);
};

// Add itinerary event listener
addItineraryBtn.addEventListener('click', () => {
    const destination = itineraryInput.value;
    if (destination) {
        addDestinationToItinerary(destination);
        itineraryInput.value = '';
    }
});

// Fetch flight offers from Amadeus API
const fetchFlightOffers = async (origin, destination, departureDate) => {
    if (!amadeusAccessToken) {
        await getAuthToken();
    }

    try {
        const response = await fetch(`${BASE_URL}/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${departureDate}&adults=1`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${amadeusAccessToken}`
            }
        });

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching flight offers:', error);
        return [];
    }
};

// Fetch hotel offers from Amadeus API
const fetchHotelOffers = async (cityCode) => {
    if (!amadeusAccessToken) {
        await getAuthToken();
    }

    try {
        const response = await fetch(`${BASE_URL}/v2/shopping/hotel-offers?cityCode=${cityCode}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${amadeusAccessToken}`
            }
        });

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching hotel offers:', error);
        return [];
    }
};