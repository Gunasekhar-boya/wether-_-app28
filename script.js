// Weather App using Open-Meteo API (free, no API key required)

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const cityName = document.getElementById('city-name');
const dateEl = document.getElementById('date');
const tempEl = document.getElementById('temp');
const descriptionEl = document.getElementById('description');
const iconEl = document.getElementById('icon');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const feelsLikeEl = document.getElementById('feels-like');
const forecastEl = document.getElementById('forecast');

// Weather condition codes to icons and descriptions
const weatherCodes = {
    0: { desc: 'Clear sky', icon: '☀️' },
    1: { desc: 'Mainly clear', icon: '🌤️' },
    2: { desc: 'Partly cloudy', icon: '⛅' },
    3: { desc: 'Overcast', icon: '☁️' },
    45: { desc: 'Foggy', icon: '🌫️' },
    48: { desc: 'Depositing rime fog', icon: '🌫️' },
    51: { desc: 'Light drizzle', icon: '🌧️' },
    53: { desc: 'Moderate drizzle', icon: '🌧️' },
    55: { desc: 'Dense drizzle', icon: '🌧️' },
    61: { desc: 'Slight rain', icon: '🌧️' },
    63: { desc: 'Moderate rain', icon: '🌧️' },
    65: { desc: 'Heavy rain', icon: '🌧️' },
    71: { desc: 'Slight snow', icon: '🌨️' },
    73: { desc: 'Moderate snow', icon: '🌨️' },
    75: { desc: 'Heavy snow', icon: '❄️' },
    77: { desc: 'Snow grains', icon: '🌨️' },
    80: { desc: 'Slight rain showers', icon: '🌦️' },
    81: { desc: 'Moderate rain showers', icon: '🌦️' },
    82: { desc: 'Violent rain showers', icon: '🌦️' },
    85: { desc: 'Slight snow showers', icon: '🌨️' },
    86: { desc: 'Heavy snow showers', icon: '🌨️' },
    95: { desc: 'Thunderstorm', icon: '⛈️' },
    96: { desc: 'Thunderstorm with slight hail', icon: '⛈️' },
    99: { desc: 'Thunderstorm with heavy hail', icon: '⛈️' }
};

// Get current date
function getCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
}

// Get day name from date
function getDayName(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// Fetch weather data
async function getWeather(city) {
    try {
        // First, get coordinates from city name using geocoding
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found');
        }
        
        const { latitude, longitude, name, country } = geoData.results[0];
        
        // Get weather data
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        return {
            city: name,
            country: country,
            current: weatherData.current,
            daily: weatherData.daily
        };
    } catch (error) {
        throw error;
    }
}

// Update UI with weather data
function updateUI(data) {
    const current = data.current;
    const daily = data.daily;
    
    // Update city name
    cityName.textContent = `${data.city}, ${data.country}`;
    dateEl.textContent = getCurrentDate();
    
    // Update temperature
    tempEl.textContent = Math.round(current.temperature_2m);
    
    // Update weather description
    const weatherCode = current.weather_code;
    const weatherInfo = weatherCodes[weatherCode] || { desc: 'Unknown', icon: '❓' };
    descriptionEl.textContent = weatherInfo.desc;
    iconEl.src = `https://openweathermap.org/img/wn/${getWmoIcon(weatherCode)}@2x.png`;
    iconEl.alt = weatherInfo.desc;
    
    // Update details
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    windEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
    
    // Update forecast
    updateForecast(daily);
}

// Get OpenWeatherMap icon code from WMO code
function getWmoIcon(code) {
    const iconMap = {
        0: '01d', 1: '01d', 2: '02d', 3: '03d',
        45: '50d', 48: '50d',
        51: '09d', 53: '09d', 55: '09d',
        61: '10d', 63: '10d', 65: '10d',
        71: '13d', 73: '13d', 75: '13d', 77: '13d',
        80: '09d', 81: '09d', 82: '09d',
        85: '13d', 86: '13d',
        95: '11d', 96: '11d', 99: '11d'
    };
    return iconMap[code] || '01d';
}

// Update forecast
function updateForecast(daily) {
    forecastEl.innerHTML = '';
    
    const days = daily.time.slice(0, 7);
    const maxTemps = daily.temperature_2m_max;
    const minTemps = daily.temperature_2m_min;
    const codes = daily.weather_code;
    
    days.forEach((day, index) => {
        const dayEl = document.createElement('div');
        dayEl.className = 'forecast-day';
        
        const weatherInfo = weatherCodes[codes[index]] || { desc: 'Unknown', icon: '❓' };
        
        dayEl.innerHTML = `
            <div class="day">${index === 0 ? 'Today' : getDayName(day)}</div>
            <div class="icon">${weatherInfo.icon}</div>
            <div class="temp">${Math.round(maxTemps[index])}°</div>
        `;
        
        forecastEl.appendChild(dayEl);
    });
}

// Search button click
searchBtn.addEventListener('click', async () => {
    const city = cityInput.value.trim();
    if (!city) return;
    
    searchBtn.textContent = 'Loading...';
    searchBtn.disabled = true;
    
    try {
        const data = await getWeather(city);
        updateUI(data);
    } catch (error) {
        cityName.textContent = 'Error';
        descriptionEl.textContent = error.message === 'City not found' 
            ? 'City not found. Please try again.' 
            : 'Failed to fetch weather data';
    } finally {
        searchBtn.textContent = 'Search';
        searchBtn.disabled = false;
    }
});

// Enter key search
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// Load default city on page load
window.addEventListener('load', () => {
    cityInput.value = 'New York';
    searchBtn.click();
});