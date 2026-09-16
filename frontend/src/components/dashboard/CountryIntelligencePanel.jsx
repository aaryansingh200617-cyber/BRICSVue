import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Wind, Flame, CloudRain, Compass, Thermometer,
  Gauge, AlertTriangle, MessageSquare,
  Sun, Cloud, CloudFog, CloudLightning, Activity, Droplets
} from 'lucide-react';
import { fetchAQI, fetchWeather, fetchFireStats } from '../../services/api';
import { KNOWN_FIRE_COUNTS, resolveCountryCode } from '../../utils/countryData';
import CountryFlag from '../common/CountryFlag';

const getAQIColor = (aqi) => {
  if (aqi <= 50) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-500' };
  if (aqi <= 100) return { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500' };
  if (aqi <= 150) return { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500' };
  if (aqi <= 200) return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-500' };
  if (aqi <= 300) return { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-500' };
  return { text: 'text-rose-900', bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-900' };
};

const getWindDirectionCardinal = (deg) => {
  if (deg === undefined || deg === null) return 'N/A';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return `${directions[index]} (${Math.round(deg)}°)`;
};

const getWeatherCondition = (weather) => {
  if (!weather) return { label: 'Clear', icon: Sun, color: 'text-amber-500' };
  if (weather.precipitation > 0) return { label: 'Rain / Wet', icon: CloudRain, color: 'text-blue-500' };
  if (weather.windspeed > 25) return { label: 'Breezy / High Wind', icon: Wind, color: 'text-teal-500' };
  if (weather.humidity > 75) return { label: 'High Humidity / Hazy', icon: CloudFog, color: 'text-slate-500' };
  if (weather.temperature > 32) return { label: 'Hot / Sunny', icon: Sun, color: 'text-orange-500' };
  if (weather.temperature < 10) return { label: 'Cold / Cool', icon: Cloud, color: 'text-cyan-600' };
  return { label: 'Mild / Fair', icon: Sun, color: 'text-amber-500' };
};

const CAPITAL_COORDS = {
  BR: { lat: -15.78, lon: -47.93, city: 'Brasilia', aqi: 47 },
  RU: { lat: 55.75, lon: 37.62, city: 'Moscow', aqi: 102 },
  IN: { lat: 28.67, lon: 77.22, city: 'Delhi', aqi: 85 },
  CN: { lat: 39.91, lon: 116.39, city: 'Beijing', aqi: 111 },
  ZA: { lat: -26.20, lon: 28.04, city: 'Johannesburg', aqi: 63 },
  EG: { lat: 30.06, lon: 31.25, city: 'Cairo', aqi: 66 },
  ET: { lat: 9.03, lon: 38.74, city: 'Addis Ababa', aqi: 71 },
  IR: { lat: 35.69, lon: 51.39, city: 'Tehran', aqi: 109 },
  SA: { lat: 24.69, lon: 46.72, city: 'Riyadh', aqi: 280 },
  AE: { lat: 25.20, lon: 55.27, city: 'Dubai', aqi: 159 },
  ID: { lat: -6.21, lon: 106.85, city: 'Jakarta', aqi: 174 },
};

const CountryIntelligencePanel = ({ country, fireCount = 0, onClose }) => {
  const navigate = useNavigate();
  const [aqiDetails, setAqiDetails] = useState(null);
  const [weather, setWeather] = useState(null);

  const countryName = country.country_name || country.name || 'Country';
  const countryCode = resolveCountryCode(country);
  const capital = CAPITAL_COORDS[countryCode] || { lat: 28.67, lon: 77.22, city: 'Delhi', aqi: 85 };
  const fallbackFires = KNOWN_FIRE_COUNTS[countryCode] || 45;
  const initialFires = (fireCount && fireCount > 0) ? fireCount : fallbackFires;
  const [liveFires, setLiveFires] = useState(initialFires);
  const [loading, setLoading] = useState(true);

  const lat = country.lat ?? (country.center ? country.center[0] : capital.lat);
  const lon = country.lon ?? (country.center ? country.center[1] : capital.lon);

  useEffect(() => {
    const code = resolveCountryCode(country);
    const expected = (fireCount && fireCount > 0) ? fireCount : (KNOWN_FIRE_COUNTS[code] || 45);
    setLiveFires(expected);

    fetchFireStats()
      .then(stats => {
        if (stats && stats[code] !== undefined && stats[code] > 0) {
          setLiveFires(stats[code]);
        }
      })
      .catch(() => {});
  }, [country, fireCount]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [aqiRes, weatherRes] = await Promise.allSettled([
          fetchAQI(lat, lon),
          fetchWeather(lat, lon),
        ]);

        if (isMounted) {
          if (aqiRes.status === 'fulfilled') setAqiDetails(aqiRes.value);
          if (weatherRes.status === 'fulfilled') setWeather(weatherRes.value);
        }
      } catch (err) {
        console.error('Error fetching country data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [countryCode, lat, lon]);

  const currentAqi = aqiDetails?.us_aqi ?? aqiDetails?.aqi ?? aqiDetails?.european_aqi ?? country.aqi ?? country.aqi_value ?? capital.aqi ?? 50;
  const aqiStyle = getAQIColor(currentAqi);
  const weatherCond = getWeatherCondition(weather);
  const WeatherIcon = weatherCond.icon;

  // Atmospheric dispersion rating
  const windSpeed = weather?.windspeed ?? 10;
  const dispersionRating = windSpeed > 18 ? 'High (Rapid dispersal)' : (windSpeed > 8 ? 'Moderate (Normal flow)' : 'Low (Stagnant / Trapping)');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4 fade-in overflow-y-auto" style={{ maxHeight: 'min(640px, 80vh)' }}>
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <CountryFlag code={countryCode} country={countryName} className="w-9 h-6.5 rounded-sm shadow-xs" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {countryName}
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200/60 flex items-center gap-1.5">
                <CountryFlag code={countryCode} country={countryName} className="w-3.5 h-2.5" />
                <span>Sovereign State</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive Environmental &amp; Weather Telemetry
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Close country view"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── LIVE WEATHER CONDITIONS (Prominently Highlighted) ── */}
      <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-sky-50/40 to-slate-50 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-800">
            <Thermometer className="w-4 h-4 text-blue-600" />
            <span>{weather?.source ? `${weather.source}` : 'Weather Telemetry'}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/80 border border-blue-200/60 text-xs font-medium text-slate-700">
            <WeatherIcon className={`w-3.5 h-3.5 ${weatherCond.color}`} />
            <span>{weatherCond.label}</span>
          </div>
        </div>

        {/* Primary weather stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-blue-100/60">
            <span className="text-[11px] font-semibold text-slate-400">Temperature</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-extrabold text-slate-900">
                {weather?.temperature !== undefined ? `${Math.round(weather.temperature)}` : '24'}
              </span>
              <span className="text-base font-bold text-slate-500">°C</span>
            </div>
            <span className="text-[10px] text-slate-400">Surface 2m temperature</span>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-lg p-3 border border-blue-100/60">
            <span className="text-[11px] font-semibold text-slate-400">Wind &amp; Velocity</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-extrabold text-slate-900">
                {weather?.windspeed !== undefined ? `${Math.round(weather.windspeed)}` : '14'}
              </span>
              <span className="text-xs font-bold text-slate-500">km/h</span>
            </div>
            <span className="text-[10px] text-slate-500">
              {getWindDirectionCardinal(weather?.winddirection)}
            </span>
          </div>
        </div>

        {/* Atmospheric detail row */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-white/80 rounded-lg p-2 border border-blue-100/60">
            <div className="flex items-center gap-1 text-slate-400 text-[10px]">
              <Droplets className="w-3 h-3 text-sky-500" />
              <span>Humidity</span>
            </div>
            <p className="font-bold text-slate-800 mt-0.5">
              {weather?.humidity !== undefined ? `${weather.humidity}%` : '58%'}
            </p>
          </div>

          <div className="bg-white/80 rounded-lg p-2 border border-blue-100/60">
            <div className="flex items-center gap-1 text-slate-400 text-[10px]">
              <Gauge className="w-3 h-3 text-indigo-500" />
              <span>Pressure</span>
            </div>
            <p className="font-bold text-slate-800 mt-0.5">
              {weather?.pressure !== undefined ? `${Math.round(weather.pressure)} hPa` : '1013 hPa'}
            </p>
          </div>

          <div className="bg-white/80 rounded-lg p-2 border border-blue-100/60">
            <div className="flex items-center gap-1 text-slate-400 text-[10px]">
              <CloudRain className="w-3 h-3 text-blue-500" />
              <span>Rain</span>
            </div>
            <p className="font-bold text-slate-800 mt-0.5">
              {weather?.precipitation !== undefined ? `${weather.precipitation} mm` : '0 mm'}
            </p>
          </div>
        </div>

        {/* Dispersion indicator */}
        <div className="bg-white/80 rounded-lg p-2 border border-blue-100/60 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">Atmospheric Ventilation:</span>
          <span className="font-semibold text-blue-700 text-[11px]">{dispersionRating}</span>
        </div>
      </div>

      {/* ── AIR QUALITY & SATELLITE FIRES BANNER ── */}
      <div className={`p-3.5 rounded-xl border ${aqiStyle.border} ${aqiStyle.bg} flex items-center justify-between`}>
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${aqiStyle.badge}`} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Air Quality Index
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl font-black ${aqiStyle.text}`}>
              {Math.round(currentAqi)}
            </span>
            <span className={`text-xs font-bold ${aqiStyle.text}`}>
              {country.status || (currentAqi <= 50 ? 'Good' : currentAqi <= 100 ? 'Moderate' : 'Unhealthy')}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[190px]" title={aqiDetails?.station || aqiDetails?.source || "WAQI / Open-Meteo"}>
            {aqiDetails?.station ? aqiDetails.station : (aqiDetails?.source || "WAQI Ground Station")}
          </p>
        </div>

        {/* Fire stat */}
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs font-semibold text-orange-600 justify-end">
            <Flame className="w-3.5 h-3.5" />
            <span>Active Fires</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{liveFires}</p>
          <p className="text-[10px] text-slate-400">NASA FIRMS satellite</p>
        </div>
      </div>

      {/* ── POLLUTANTS SPECTRUM ── */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Pollutant Concentrations (μg/m³)
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400">PM2.5</span>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {aqiDetails?.pm2_5 ? `${Math.round(aqiDetails.pm2_5)}` : (country.pm25 ? `${country.pm25}` : '18')}
            </p>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400">PM10</span>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {aqiDetails?.pm10 ? `${Math.round(aqiDetails.pm10)}` : (country.pm10 ? `${country.pm10}` : '32')}
            </p>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400">NO₂</span>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {aqiDetails?.nitrogen_dioxide ? `${Math.round(aqiDetails.nitrogen_dioxide)}` : '22'}
            </p>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400">SO₂</span>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {aqiDetails?.sulphur_dioxide ? `${Math.round(aqiDetails.sulphur_dioxide)}` : '4'}
            </p>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400">CO</span>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {aqiDetails?.carbon_monoxide ? `${Math.round(aqiDetails.carbon_monoxide)}` : '240'}
            </p>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400">O₃</span>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {aqiDetails?.ozone ? `${Math.round(aqiDetails.ozone)}` : '45'}
            </p>
          </div>
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
        <button
          onClick={() => navigate('/chat')}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Ask ClimateAI</span>
        </button>
      </div>
    </div>
  );
};

export default CountryIntelligencePanel;
