import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchBRICSOverview, fetchFires, fetchHotspots } from '../../services/api';
import FirePopup from './FirePopup';
import PollutionPopup from './PollutionPopup';
import { Layers, Globe, Compass } from 'lucide-react';
import { resolveCountryFlag } from '../../utils/countryData';

// Initial fallback cities so the map is never empty even while live API is fetching
const DEFAULT_CITIES = [
  { country_code: 'BR', city: 'Brasilia', country_name: 'Brazil', flag: '🇧🇷', lat: -15.78, lon: -47.93, aqi: 42, pm25: 12, status: 'Good' },
  { country_code: 'RU', city: 'Moscow', country_name: 'Russia', flag: '🇷🇺', lat: 55.75, lon: 37.62, aqi: 48, pm25: 14, status: 'Good' },
  { country_code: 'IN', city: 'Delhi', country_name: 'India', flag: '🇮🇳', lat: 28.67, lon: 77.22, aqi: 184, pm25: 112, status: 'Unhealthy' },
  { country_code: 'CN', city: 'Beijing', country_name: 'China', flag: '🇨🇳', lat: 39.91, lon: 116.39, aqi: 115, pm25: 42, status: 'Unhealthy for Sensitive Groups' },
  { country_code: 'ZA', city: 'Johannesburg', country_name: 'South Africa', flag: '🇿🇦', lat: -26.20, lon: 28.04, aqi: 62, pm25: 18, status: 'Moderate' },
  { country_code: 'EG', city: 'Cairo', country_name: 'Egypt', flag: '🇪🇬', lat: 30.06, lon: 31.25, aqi: 128, pm25: 48, status: 'Unhealthy for Sensitive Groups' },
  { country_code: 'ET', city: 'Addis Ababa', country_name: 'Ethiopia', flag: '🇪🇹', lat: 9.03, lon: 38.74, aqi: 35, pm25: 9, status: 'Good' },
  { country_code: 'IR', city: 'Tehran', country_name: 'Iran', flag: '🇮🇷', lat: 35.69, lon: 51.39, aqi: 110, pm25: 39, status: 'Unhealthy for Sensitive Groups' },
  { country_code: 'AE', city: 'Dubai', country_name: 'UAE', flag: '🇦🇪', lat: 25.20, lon: 55.27, aqi: 88, pm25: 29, status: 'Moderate' },
  { country_code: 'SA', city: 'Riyadh', country_name: 'Saudi Arabia', flag: '🇸🇦', lat: 24.69, lon: 46.72, aqi: 95, pm25: 32, status: 'Moderate' },
  { country_code: 'ID', city: 'Jakarta', country_name: 'Indonesia', flag: '🇮🇩', lat: -6.21, lon: 106.85, aqi: 142, pm25: 56, status: 'Unhealthy for Sensitive Groups' },
];

// Sovereign territories for all 11 BRICS member states
const BRICS_TERRITORIES = [
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', center: [-14.235, -51.925], bbox: [-73.98, -33.75, -34.79, 5.27], capital: 'Brasilia' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', center: [58.5, 60.0], bbox: [26.0, 42.0, 160.0, 77.0], capital: 'Moscow' },
  { code: 'IN', name: 'India', flag: '🇮🇳', center: [21.5, 78.9], bbox: [68.11, 7.5, 97.41, 35.5], capital: 'Delhi' },
  { code: 'CN', name: 'China', flag: '🇨🇳', center: [34.5, 104.0], bbox: [73.5, 18.2, 134.8, 53.5], capital: 'Beijing' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', center: [-29.0, 24.5], bbox: [16.45, -34.8, 32.9, -22.1], capital: 'Johannesburg' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', center: [26.8, 30.0], bbox: [24.7, 22.0, 36.9, 31.7], capital: 'Cairo' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', center: [9.1, 40.0], bbox: [33.0, 3.4, 48.0, 14.9], capital: 'Addis Ababa' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', center: [32.4, 53.7], bbox: [44.0, 25.1, 63.3, 39.8], capital: 'Tehran' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', center: [24.0, 45.0], bbox: [34.5, 16.4, 55.7, 32.2], capital: 'Riyadh' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', center: [23.9, 54.2], bbox: [51.58, 22.6, 56.4, 26.1], capital: 'Dubai' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', center: [-2.0, 118.0], bbox: [95.0, -11.0, 141.0, 6.1], capital: 'Jakarta' },
];

export const CAPITAL_COORDS = {
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

import { BASEMAP_PRESETS } from '../../utils/mapConstants';

const getAQIColor = (aqi) => {
  if (aqi <= 50)  return '#10b981'; // emerald green
  if (aqi <= 100) return '#eab308'; // amber yellow
  if (aqi <= 150) return '#f97316'; // orange
  if (aqi <= 200) return '#ef4444'; // rose red
  if (aqi <= 300) return '#a855f7'; // purple
  return '#881337';                 // dark maroon
};

// World bounds covering all BRICS countries
// Optimally framed global bounds for all 11 BRICS countries (excluding empty Arctic)
export const BRICS_BOUNDS = [[-38, -60], [54, 122]];

// Smooth map controller for resizing and animated country pan/zoom
const MapController = ({ bounds, selectedCountry }) => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (!selectedCountry && bounds) {
        try {
          map.fitBounds(bounds, { padding: [20, 20], maxZoom: 3 });
        } catch (e) {
          // ignore
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (!map) return;
    if (selectedCountry) {
      const lat = selectedCountry.lat ?? selectedCountry.center?.[0];
      const lon = selectedCountry.lon ?? selectedCountry.center?.[1];
      if (typeof lat === 'number' && typeof lon === 'number') {
        map.flyTo([lat, lon], 4.5, { duration: 1.2 });
      }
    } else if (bounds) {
      try {
        map.flyToBounds(bounds, { padding: [25, 25], maxZoom: 3, duration: 1.0 });
      } catch (e) {
        // ignore
      }
    }
  }, [map, selectedCountry, bounds]);

  return null;
};

// Helper to create sovereign country centroid badge HTML icon
const createCountryBadgeIcon = (territory, isHovered) => {
  return L.divIcon({
    className: 'brics-sovereign-badge-icon',
    html: `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: ${isHovered ? '#0f172a' : 'rgba(255, 255, 255, 0.94)'};
        color: ${isHovered ? '#38bdf8' : '#0f172a'};
        padding: 3px 8px;
        border-radius: 9999px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.22);
        border: 1.5px solid ${isHovered ? '#0ea5e9' : '#0d9488'};
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
        pointer-events: auto;
        transform: translate(-50%, -50%);
        transition: all 0.15s ease;
      ">
        <span style="font-size: 13px; line-height: 1;">${territory.flag}</span>
        <span style="letter-spacing: -0.01em;">${territory.name}</span>
        <span style="
          font-size: 9px;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 9999px;
          background: ${isHovered ? '#0284c7' : '#ecfdf5'};
          color: ${isHovered ? '#ffffff' : '#065f46'};
          border: 1px solid ${isHovered ? '#38bdf8' : '#a7f3d0'};
        ">BRICS</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const BRICSMap = ({
  layer = 'aqi',
  selectedCountry = null,
  basemapId = 'topo',
  onCountrySelect,
  onLoadingChange,
  hideBasemapSwitcher = true
}) => {
  const [aqiCities, setAqiCities] = useState(DEFAULT_CITIES);
  const [fires, setFires] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [internalBasemapId, setInternalBasemapId] = useState(basemapId);

  useEffect(() => {
    if (basemapId) setInternalBasemapId(basemapId);
  }, [basemapId]);

  const activeBasemapKey = basemapId || internalBasemapId;
  const currentBasemap = BASEMAP_PRESETS[activeBasemapKey] || BASEMAP_PRESETS.topo;

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (onLoadingChange) onLoadingChange(true);
      try {
        const overview = await fetchBRICSOverview().catch(() => null);
        if (isMounted && Array.isArray(overview) && overview.length > 0) {
          setAqiCities(overview);
        }

        if (layer === 'fire') {
          const fireData = await fetchFires().catch(() => null);
          const events = fireData?.events || (Array.isArray(fireData) ? fireData : []);
          if (isMounted) setFires(events);
        }

        if (layer === 'hotspots') {
          const hs = await fetchHotspots().catch(() => null);
          if (isMounted && Array.isArray(hs)) setHotspots(hs);
        }
      } catch (err) {
        console.error('Map data error:', err);
      } finally {
        if (isMounted && onLoadingChange) {
          onLoadingChange(false);
        }
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [layer]);

  return (
    <div
      className="relative w-full overflow-hidden transition-colors duration-300"
      style={{
        height: '520px',
        minHeight: '520px',
        backgroundColor: currentBasemap.oceanBg
      }}
    >
      <MapContainer
        center={[16, 32]}
        zoom={2}
        minZoom={2}
        maxZoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ height: '520px', width: '100%', zIndex: 0 }}
      >
        <MapController bounds={BRICS_BOUNDS} selectedCountry={selectedCountry} />

        {/* ── Authentic Basemap TileLayer ── */}
        <TileLayer
          key={`tile-${currentBasemap.id}`}
          attribution={currentBasemap.attribution}
          url={currentBasemap.url}
          subdomains={currentBasemap.subdomains || []}
          maxZoom={currentBasemap.maxZoom}
        />
        {currentBasemap.refUrl && (
          <TileLayer
            key={`ref-${currentBasemap.id}`}
            attribution=""
            url={currentBasemap.refUrl}
            maxZoom={currentBasemap.maxZoom}
          />
        )}

        {/* ── Sovereign Country Centroid Badges (Blocks Removed) ── */}
        {BRICS_TERRITORIES.map((t) => {
          const isHov = hoveredCountry === t.code;
          const isSelected = selectedCountry?.country_code === t.code || selectedCountry?.code === t.code;
          const cap = CAPITAL_COORDS[t.code] || { lat: t.center[0], lon: t.center[1], city: t.capital, aqi: 50 };

          return (
            <Marker
              key={`terr-badge-${t.code}`}
              position={t.center}
              icon={createCountryBadgeIcon(t, isHov || isSelected)}
              eventHandlers={{
                mouseover: () => setHoveredCountry(t.code),
                mouseout: () => setHoveredCountry(null),
                click: () => onCountrySelect && onCountrySelect({
                  country_code: t.code,
                  code: t.code,
                  name: t.name,
                  country_name: t.name,
                  flag: t.flag,
                  city: cap.city || t.capital,
                  lat: cap.lat,
                  lon: cap.lon,
                  aqi: cap.aqi,
                  center: t.center
                })
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <div className="text-xs font-sans text-slate-800 p-0.5">
                  <span className="font-bold">{t.flag} {t.name}</span> (BRICS Sovereign Member)<br />
                  <span className="text-slate-500 text-[10px]">Click to inspect {cap.city} &amp; national telemetry</span>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* === Layer 1: AQI City Observation Stations === */}
        {(layer === 'aqi' || layer === 'weather' || layer === 'prediction') &&
          aqiCities.map((city, idx) => {
            const lat = city.lat ?? city.latitude;
            const lon = city.lon ?? city.longitude;
            if (typeof lat !== 'number' || typeof lon !== 'number') return null;
            const aqi = city.aqi ?? 0;
            const color = getAQIColor(aqi);
            const radius = Math.min(Math.max(9, aqi / 10), 20);
            return (
              <CircleMarker
                key={`aqi-${city.country_code || idx}-${idx}`}
                center={[lat, lon]}
                radius={radius}
                eventHandlers={{
                  click: () => onCountrySelect && onCountrySelect(city)
                }}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: color,
                  fillOpacity: 0.92,
                  weight: 2.5
                }}
              >
                {/* Instant hover tooltip */}
                <Tooltip direction="top" offset={[0, -8]} opacity={0.97} sticky>
                  <div className="text-xs font-sans text-slate-800 p-0.5 leading-snug">
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="text-base">{city.flag || resolveCountryFlag(city.country_code)}</span>
                      <span>{city.city || city.city_name}</span>
                      {city.country_name && (
                        <span className="text-slate-400 font-normal text-[11px]">({city.country_name})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold" style={{ color }}>AQI {aqi}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600">{city.status}</span>
                    </div>
                  </div>
                </Tooltip>

                <Popup maxWidth={260}>
                  <PollutionPopup city={city} />
                </Popup>
              </CircleMarker>
            );
          })}

        {/* === Layer 2: Fire Incidents === */}
        {layer === 'fire' &&
          fires.slice(0, 1500).map((fire, idx) => {
            const lat = fire.latitude ?? fire.lat;
            const lon = fire.longitude ?? fire.lon;
            if (typeof lat !== 'number' || typeof lon !== 'number') return null;
            return (
              <CircleMarker
                key={`fire-${idx}`}
                center={[lat, lon]}
                radius={4}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: '#ea580c',
                  fillOpacity: 0.9,
                  weight: 1.2
                }}
              >
                <Tooltip direction="top" offset={[0, -4]} opacity={0.97}>
                  <div className="text-xs font-sans p-0.5 leading-snug">
                    <span className="font-bold text-orange-700">🔥 Thermal Incident</span><br />
                    <span className="text-slate-500 flex items-center gap-1">
                      <span>{resolveCountryFlag(fire.country_code)}</span>
                      <span>Conf: {fire.confidence || 'Nominal'}</span>
                    </span>
                  </div>
                </Tooltip>
                <Popup maxWidth={260}>
                  <FirePopup fire={fire} />
                </Popup>
              </CircleMarker>
            );
          })}

        {/* === Layer 4: AI Hotspots === */}
        {layer === 'hotspots' &&
          hotspots.map((hs, idx) => {
            if (typeof hs.lat !== 'number' || typeof hs.lon !== 'number' || hs.lat === 0) return null;
            const color = hs.severity === 'high' ? '#dc2626' : hs.severity === 'medium' ? '#f97316' : '#d97706';
            return (
              <React.Fragment key={`hs-${idx}`}>
                <CircleMarker
                  center={[hs.lat, hs.lon]}
                  radius={24}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.14,
                    weight: 1.5,
                    dashArray: '4 4'
                  }}
                />
                <CircleMarker
                  center={[hs.lat, hs.lon]}
                  radius={9}
                  eventHandlers={{
                    click: () => onCountrySelect && onCountrySelect({
                      country_code: hs.country,
                      country_name: hs.country_name || hs.country,
                      city: hs.city,
                      lat: hs.lat,
                      lon: hs.lon,
                      aqi: hs.current_aqi,
                    })
                  }}
                  pathOptions={{
                    color: '#ffffff',
                    fillColor: color,
                    fillOpacity: 0.9,
                    weight: 2
                  }}
                >
                  <Tooltip direction="top" offset={[0, -6]} opacity={0.97}>
                    <div className="text-xs font-sans p-0.5">
                      <span className="font-bold text-red-700">⚠️ AI Hotspot</span>: {hs.city} ({Math.round(hs.current_aqi)} AQI)
                    </div>
                  </Tooltip>
                  <Popup maxWidth={280}>
                    <div className="text-sm">
                      <div className="font-bold text-red-700 mb-1">🔴 AI Hotspot Detected</div>
                      <div><strong>City:</strong> {hs.city}</div>
                      <div><strong>Country:</strong> {hs.country_name || hs.country}</div>
                      <div><strong>Current AQI:</strong> {Math.round(hs.current_aqi)}</div>
                      <div><strong>Baseline AQI:</strong> {Math.round(hs.baseline_aqi)}</div>
                      <div><strong>Severity:</strong> <span className="capitalize">{hs.severity}</span></div>
                      <div><strong>Source:</strong> {hs.source}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}

        {/* === Layer 5: Prediction === */}
        {layer === 'prediction' &&
          aqiCities
            .filter(c => (c.aqi ?? 0) > 90)
            .map((city, idx) => {
              const lat = city.lat ?? city.latitude;
              const lon = city.lon ?? city.longitude;
              if (typeof lat !== 'number' || typeof lon !== 'number') return null;
              const risk = city.aqi > 200 ? '#9333ea' : city.aqi > 150 ? '#dc2626' : '#ea580c';
              return (
                <CircleMarker
                  key={`pred-${idx}`}
                  center={[lat, lon]}
                  radius={22}
                  eventHandlers={{
                    click: () => onCountrySelect && onCountrySelect(city)
                  }}
                  pathOptions={{
                    color: risk,
                    fillColor: risk,
                    fillOpacity: 0.2,
                    weight: 1.8,
                    dashArray: '5 3'
                  }}
                >
                  <Tooltip direction="top" offset={[0, -6]} opacity={0.97}>
                    <div className="text-xs font-sans p-0.5">
                      <span className="font-bold text-orange-700">📈 Risk Zone</span>: {city.city} (AQI {city.aqi})
                    </div>
                  </Tooltip>
                  <Popup maxWidth={240}>
                    <div className="text-sm">
                      <div className="font-bold text-orange-700 mb-1">📈 High-Risk Prediction Zone</div>
                      <div><strong>{city.flag} {city.country_name}</strong> — {city.city}</div>
                      <div>Current AQI: <strong>{city.aqi}</strong></div>
                      <div className="text-xs text-slate-500 mt-1">Projected transboundary transport risk in next 6–24h.</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
      </MapContainer>

      {/* ── Optional Floating Basemap Switcher (Only if not in parent toolbar) ── */}
      {!hideBasemapSwitcher && (
        <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.08)] p-1 flex items-center gap-1">
          {Object.entries(BASEMAP_PRESETS).map(([key, style]) => (
            <button
              key={key}
              onClick={() => setInternalBasemapId(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeBasemapKey === key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Soft, Light Map Legend (Bottom-Left) ── */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md rounded-lg border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.06)] px-3 py-2 text-[11px] text-slate-600 pointer-events-auto hidden sm:block">
        <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1">
          Air Quality Index (AQI)
        </p>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>0–50 Good</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>51–100 Mod</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>101–150 Sens</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>151+ Alert</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BRICSMap;
