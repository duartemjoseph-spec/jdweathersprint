import { apiKey } from './environment.js';

// --- VARIABLES ---
let favorites = []; 
let currentCityName = ""; 

// Elements
const saveBtn = document.getElementById('saveBtn'); 
const favoritesList = document.getElementById('favoritesList'); 
const cityNameDisplay = document.getElementById('city-name');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const weeklyContainer = document.getElementById('weekly-container'); 
const hourlyContainer = document.getElementById('hourly-container'); 

// --- Get Date ---
const grabCurrentDate = () => {
    let currentDate = new Date();
    let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return currentDate.toLocaleDateString('en-US', options);
};

// --- Get Icon ---
const getCustomIcon = (iconCode) => {
    if (iconCode === '01n' || iconCode === '02n' || iconCode === '03n' || iconCode === '04n') {
        return './images/night.png';
    } else if (iconCode === '01d') {
        return './images/sunny.png';
    } else if (iconCode === '02d') {
        return './images/partly-cloudy.png';
    } else if (iconCode === '03d' || iconCode === '04d') {
        return './images/cloudy.png';
    } else if (['09d', '09n', '10d', '10n', '11d', '11n'].includes(iconCode)) {
        return './images/rain.png';
    } else {
        return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    }
};

// ---  SEARCH BY CITY NAME ---
const searchCity = async (cityInput) => {
    if (!cityInput) return; 

    try {
        let geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${cityInput}&limit=1&appid=${apiKey}`;
        let geoResponse = await fetch(geoUrl);
        let geoData = await geoResponse.json();

        // If no city found, alert and return
        if (geoData.length === 0) {
            alert("City not found!");
            return;
        }

        if (geoData[0].state) {
            currentCityName = `${geoData[0].name}, ${geoData[0].state}`;
        } else {
            currentCityName = `${geoData[0].name}, ${geoData[0].country}`;
        }
        
        // Update the screen name 
        cityNameDisplay.innerText = currentCityName;

        let lat = geoData[0].lat;
        let lon = geoData[0].lon;
        
        getWeather(lat, lon); 
        getForecast(lat, lon);
        
        updateStarButton();

    } catch (error) {
        console.log("Error searching city: " + error);
    }
};

// This runs when you click the Home button
const getWeatherByCoords = async (lat, lon) => {
    try {
        let geoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
        let geoResponse = await fetch(geoUrl);
        let geoData = await geoResponse.json();

        if (geoData[0].state) {
            currentCityName = `${geoData[0].name}, ${geoData[0].state}`;
        } else {
            currentCityName = `${geoData[0].name}, ${geoData[0].country}`;
        }
        
        cityNameDisplay.innerText = currentCityName;

        getWeather(lat, lon);
        getForecast(lat, lon);
        
        updateStarButton();

    } catch (error) {
        console.log("Error with location: " + error);
    }
};

// ---  GET WEATHER ---
const getWeather = async (lat, lon) => {
    try {
        let url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
        let response = await fetch(url);
        let data = await response.json();

        // Update Temps
        document.getElementById('current-temp').innerText = Math.floor(data.main.temp) + "°";
        document.getElementById('maxTemp').innerText = Math.floor(data.main.temp_max) + "° H";
        document.getElementById('minTemp').innerText = Math.floor(data.main.temp_min) + "° L";
        
        // Update Icon
        let currentIcon = document.getElementById('current-icon');
        currentIcon.src = getCustomIcon(data.weather[0].icon); 
        currentIcon.classList.remove('hidden');

        // Update Date
        document.getElementById('current-date').innerText = grabCurrentDate();

    } catch (error) {
        console.log("Error getting weather: " + error);
    }
};

// --- GET FORECAST ---
const getForecast = async (lat, lon) => {
    try {
        let url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
        let response = await fetch(url);
        let data = await response.json();
        
        renderHourlyForecast(data);
        renderWeeklyForecast(data);

    } catch (error) {
        console.log("Error getting forecast: " + error);
    }
};

// --- RENDERERS ---

const renderHourlyForecast = (data) => {
    hourlyContainer.innerHTML = ''; 
    let nextFiveDays = data.list.slice(0, 5);
    
    nextFiveDays.forEach((hour) => {
        let date = new Date(hour.dt * 1000);
        let timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        let temp = Math.floor(hour.main.temp);
        let customImageSrc = getCustomIcon(hour.weather[0].icon);

        let card = document.createElement('div');
        card.className = 'forecast-item'; 
        card.innerHTML = `<p>${timeString}</p><img src="${customImageSrc}" alt="icon"><span>${temp}°</span>`;
        hourlyContainer.appendChild(card);
    });
};

const renderWeeklyForecast = (data) => {
    weeklyContainer.innerHTML = ''; 
    let dailyData = data.list.filter((reading) => {
        return reading.dt_txt.includes("12:00:00");
    });
    
    dailyData.forEach((day) => {
        let date = new Date(day.dt * 1000);
        let dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        let temp = Math.floor(day.main.temp);
        let customImageSrc = getCustomIcon(day.weather[0].icon);

        let card = document.createElement('div');
        card.className = 'forecast-item'; 
        card.innerHTML = `<p>${dayName}</p><img src="${customImageSrc}" alt="icon"><span>${temp}°</span>`;
        weeklyContainer.appendChild(card);
    });
};

// --- FAVORITES & LOCAL STORAGE ---

const loadFavorites = () => {
    let savedData = localStorage.getItem('weatherAppFavorites');
    if (savedData) {
        favorites = JSON.parse(savedData);
        savedFavoritesList();
    }
};

const updateStarButton = () => {
    if (favorites.includes(currentCityName)) {
        saveBtn.classList.add('active'); 
        saveBtn.innerText = "★";
    } else {
        saveBtn.classList.remove('active'); 
        saveBtn.innerText = "☆";
    }
};

const savedFavoritesList = () => {
    favoritesList.innerHTML = "";
    favorites.forEach((city) => {
        let li = document.createElement('li');
        li.className = 'fav-item';

        let textSpan = document.createElement('span');
        textSpan.className = 'fav-name';
        textSpan.textContent = city;
        
        textSpan.addEventListener('click', () => {
            searchCity(city);
        });
        
        let deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'X';
        
        deleteBtn.addEventListener('click', () => {
            removeFavorite(city); 
        });

        li.appendChild(textSpan);
        li.appendChild(deleteBtn);
        favoritesList.appendChild(li); 
    });
};

const removeFavorite = (city) => {
    favorites = favorites.filter((item) => item !== city);
    localStorage.setItem('weatherAppFavorites', JSON.stringify(favorites));
    savedFavoritesList();
    updateStarButton();
};

const addFavorite = () => {
    if (!currentCityName) return; 
    
    if (!favorites.includes(currentCityName)) {
        favorites.push(currentCityName);
        localStorage.setItem('weatherAppFavorites', JSON.stringify(favorites));
        savedFavoritesList();
        updateStarButton();
    } else {
        alert("City is already in favorites!");
    }
};

// --- EVENT LISTENERS ---

searchBtn.addEventListener('click', () => {
    if(searchInput.value) {
        searchCity(searchInput.value);
        searchInput.value = '';
    }
});

searchInput.addEventListener('keypress', (event) => {
    if (event.key === "Enter") {
        searchBtn.click(); 
    }
});

saveBtn.addEventListener('click', addFavorite);

document.getElementById('homeBtn').addEventListener('click', () => {
    if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(
            (pos) => getWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
        );
    } else { searchCity('----'); }
});

// --- START UP ---
window.addEventListener("DOMContentLoaded", () => {
    loadFavorites();
    
    if (!navigator.geolocation) {
        searchCity('----');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => { getWeatherByCoords(position.coords.latitude, position.coords.longitude); },
    );
});