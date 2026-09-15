import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.startsWith('192.168.')
    ? window.location.origin
    : 'http://localhost:8000');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

export const fetchBRICSOverview = async () => (await api.get('/api/aqi/brics-overview')).data;
export const fetchAQI = async (lat, lon) => (await api.get(`/api/aqi/${lat}/${lon}`)).data;
export const fetchFires = async () => (await api.get('/api/fires/')).data;
export const fetchFireStats = async () => (await api.get('/api/fires/stats')).data;
export const fetchWeather = async (lat, lon) => (await api.get(`/api/weather/${lat}/${lon}`)).data;
export const fetchPrediction = async (lat, lon) => (await api.get(`/api/predict/aqi/${lat}/${lon}`)).data;
export const fetchMovement = async (lat, lon) => (await api.get(`/api/predict/movement/${lat}/${lon}`)).data;
export const fetchHotspots = async () => (await api.get('/api/hotspots/')).data;
export const fetchCrossBorder = async () => (await api.get('/api/crossborder/')).data;
export const fetchAlerts = async () => (await api.get('/api/alerts/')).data;
export const fetchComparison = async () => (await api.get('/api/comparison/brics')).data;
export const fetchAnalyticsTrends = async (lat, lon) => (await api.get(`/api/analytics/trends/${lat}/${lon}`)).data;
export const fetchBRICSAnalytics = async () => (await api.get('/api/analytics/brics-summary')).data;
export const submitReport = async (formData) => {
  return (await api.post('/api/reports/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })).data;
};
export const sendChatMessage = async (question) => (await api.post('/api/chat/', { question })).data;
export const submitFeedback = async (payload) => (await api.post('/api/feedback/', payload)).data;
export const fetchCityAQI = async (countryCode, cityName) => (await api.get(`/api/aqi/city/${countryCode}/${cityName}`)).data;
export const fetchCountries = async () => (await api.get('/api/aqi/countries')).data;

export default api;
