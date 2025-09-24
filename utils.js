// Utility functions for weather app

// Validate city name
export function validateCity(city) {
    if (!city || typeof city !== 'string') return false;
    // Basic city name validation (letters, spaces, and some special characters)
    return /^[a-zA-Z\s\-',\.]+$/.test(city);
}

// Format temperature
export function formatTemp(temp) {
    return `${Math.round(temp)}°C`;
}

// Get weather icon URL
export function getWeatherIconUrl(icon) {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

// Safe fetch with timeout
export async function safeFetch(url, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}