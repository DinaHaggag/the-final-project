const BASE_URL = 'https://test.api.amadeus.com';
const TELEPORT_URL = 'https://api.teleport.org/api/urban_areas/';
const AMADEUS_API_KEY = 'hpk2y5O7sfow9wrMqGuqX4vqO6BzWE5m';
const AMADEUS_API_SECRET = 'Ig09E6Ac5MQf5NfT';

// Elements
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const destinationsContainer = document.getElementById('destinations');
const itineraryList = document.getElementById('itinerary-list');
const itineraryInput = document.getElementById('itinerary-input');
const addItineraryBtn = document.getElementById('add-itinerary-btn');

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
        return data.access_token;
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

// Fetch image for the city from Teleport API
const fetchCityImage = async (cityName) => {
    try {
        const normalizedCity = cityName.toLowerCase().replace(/\s+/g, '-');
        const response = await fetch(`${TELEPORT_URL}slug:${normalizedCity}/images/`);
        const data = await response.json();
        return data.photos[0].image.web;
    } catch (error) {
        console.error('Error fetching city image:', error);
    }
};

// Render destinations to the UI
const renderDestinations = async (destinations) => {
    destinationsContainer.innerHTML = '';
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
