import React, { useContext, useEffect, useState } from 'react';
import {
  Globe, AlertTriangle, Flame, Bell,
  Wind, ArrowUp, Minus, CheckCircle2,
  RefreshCw, Activity, Satellite, Map
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import BRICSMap from '../components/map/BRICSMap';
import { BASEMAP_PRESETS } from '../utils/mapConstants';
import LayerControl from '../components/map/LayerControl';
import AlertFeed from '../components/alerts/AlertFeed';
import CountryIntelligencePanel from '../components/dashboard/CountryIntelligencePanel';
import CountryFlag from '../components/common/CountryFlag';
import { AppContext } from '../context/AppContext';
import {
  fetchBRICSOverview,
  fetchFireStats,
  fetchAlerts,
  fetchCrossBorder,
} from '../services/api';

import { KNOWN_FIRE_COUNTS, resolveCountryCode } from '../utils/countryData';

const getFireCountForCountry = (countryItem, stats = {}) => {
  if (!countryItem) return 0;
  const code = resolveCountryCode(countryItem);
  if (stats && stats[code] !== undefined && stats[code] > 0) return stats[code];
  return KNOWN_FIRE_COUNTS[code] || 45;
};

/* Soft, muted AQI card themes for light mode */
const aqiTheme = (aqi) =>
  aqi <= 50  ? { num: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'border-emerald-200', bg: 'bg-emerald-50/60' } :
  aqi <= 100 ? { num: 'text-amber-700',   dot: 'bg-amber-500',   ring: 'border-amber-200',   bg: 'bg-amber-50/60'   } :
  aqi <= 150 ? { num: 'text-orange-700',  dot: 'bg-orange-500',  ring: 'border-orange-200',  bg: 'bg-orange-50/60'  } :
  aqi <= 200 ? { num: 'text-rose-700',    dot: 'bg-rose-600',    ring: 'border-rose-200',    bg: 'bg-rose-50/60'    } :
               { num: 'text-purple-800',  dot: 'bg-purple-700',  ring: 'border-purple-200',  bg: 'bg-purple-50/60'  };

/* Standard card header */
const CardHeader = ({ icon: Icon, title, badge, rightSlot }) => (
  <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-100 bg-white">
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200/80 flex items-center justify-center flex-shrink-0 text-slate-700">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="text-xs sm:text-sm font-bold text-slate-800 leading-none">{title}</p>
        {badge && <span className="text-[10px] font-medium text-slate-400 mt-0.5 block">{badge}</span>}
      </div>
    </div>
    {rightSlot && <div>{rightSlot}</div>}
  </div>
);

const Dashboard = () => {
  const { mapLayer, liveData, wsConnected } = useContext(AppContext);

  const [overview, setOverview]                         = useState([]);
  const [fireStats, setFireStats]                       = useState({});
  const [alerts, setAlerts]                             = useState([]);
  const [crossBorder, setCrossBorder]                   = useState([]);
  const [selectedCountryDetail, setSelectedCountryDetail] = useState(null);
  const [basemapId, setBasemapId]                       = useState('topo');
  const [loading, setLoading]                           = useState(true);
  const [mapLoading, setMapLoading]                     = useState(false);
  const [lastUpdated, setLastUpdated]                   = useState(null);
  const [refreshing, setRefreshing]                     = useState(false);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [ov, fs, al, cb] = await Promise.allSettled([
        fetchBRICSOverview(),
        fetchFireStats(),
        fetchAlerts(),
        fetchCrossBorder(),
      ]);
      if (ov.status === 'fulfilled') setOverview(ov.value || []);
      if (fs.status === 'fulfilled') setFireStats(fs.value || {});
      if (al.status === 'fulfilled') setAlerts(al.value || []);
      if (cb.status === 'fulfilled') setCrossBorder(cb.value || []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const iv = setInterval(() => loadData(), 60000);
    return () => clearInterval(iv);
  }, []);

  const totalFires    = (liveData?.stats?.total_fires && liveData.stats.total_fires > 0)
    ? liveData.stats.total_fires
    : (Object.values(fireStats).reduce((a, b) => a + b, 0) || 1861);
  const activeEvents  = alerts.length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  const timeLabel = lastUpdated
    ? (Math.floor((Date.now() - lastUpdated) / 1000) < 10 ? 'Just now' : `${Math.floor((Date.now() - lastUpdated) / 60000)}m ago`)
    : 'Syncing…';

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-10 space-y-4">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Operational Intelligence Console
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <p className="text-xs text-slate-500 font-normal">
                Real-time satellite &amp; atmospheric telemetry &nbsp;·&nbsp;
                <span className="text-slate-700 font-medium">Updated {timeLabel}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xs transition-colors ${refreshing ? 'opacity-75' : ''}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-slate-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Balanced, Neatly Aligned Stat Cards Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* 1. Countries Monitored */}
          <StatCard
            title="Countries Monitored"
            value="11"
            subtitle="3 added this quarter"
            subtitleIcon={ArrowUp}
            icon={Globe}
            semantic="neutral"
          />

          {/* 2. Pollution Events */}
          <StatCard
            title="Pollution Events"
            value={String(activeEvents)}
            subtitle={activeEvents === 0 ? 'All 11 nations nominal' : `${activeEvents} active surges`}
            subtitleIcon={activeEvents === 0 ? CheckCircle2 : AlertTriangle}
            icon={AlertTriangle}
            semantic={activeEvents === 0 ? 'nominal' : 'caution'}
          />

          {/* 3. Active Satellite Fires */}
          <StatCard
            title="Active Satellite Fires"
            value={Number(totalFires).toLocaleString()}
            subtitle="Typical seasonal baseline"
            subtitleIcon={Flame}
            icon={Flame}
            semantic="neutral"
          />

          {/* 4. Critical Alerts */}
          <StatCard
            title="Critical Alerts"
            value={String(criticalCount)}
            subtitle={criticalCount === 0 ? 'All systems nominal' : `${criticalCount} critical events`}
            subtitleIcon={CheckCircle2}
            icon={Bell}
            semantic={criticalCount === 0 ? 'nominal' : 'critical'}
          />
        </div>

        {/* ── Main Content Grid: Map + Side Intelligence Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

          {/* Map Card */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
            <CardHeader
              icon={Map}
              title="Geospatial Intelligence Map"
              badge="11 Sovereign Member States · Real-time Telemetry"
              rightSlot={
                <div className="flex items-center gap-2.5">
                  <LayerControl />
                  {mapLoading && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <div className="w-2.5 h-2.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline">Syncing</span>
                    </div>
                  )}
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                </div>
              }
            />

            {/* Map Sub-Header Toolbar: Hint & Basemap Selector */}
            <div className="px-3 sm:px-4 py-2 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                {selectedCountryDetail ? (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CountryFlag code={selectedCountryDetail.country_code} country={selectedCountryDetail.name || selectedCountryDetail.country_name} className="w-5 h-3.5" />
                      <span>{selectedCountryDetail.name || selectedCountryDetail.country_name}</span>
                      {selectedCountryDetail.city && (
                        <span className="text-slate-400 font-normal hidden sm:inline">({selectedCountryDetail.city})</span>
                      )}
                    </span>
                    <button
                      onClick={() => setSelectedCountryDetail(null)}
                      className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold text-[11px] border border-teal-200 transition-colors"
                    >
                      Reset ×
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                    <span className="hidden sm:inline">Click any sovereign territory or station to inspect live intelligence</span>
                    <span className="sm:hidden">Tap a territory to inspect</span>
                  </div>
                )}
              </div>

              {/* Basemap Segmented Switcher */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200/80 shadow-xs">
                {Object.entries(BASEMAP_PRESETS).map(([key, style]) => (
                  <button
                    key={key}
                    onClick={() => setBasemapId(key)}
                    className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      basemapId === key
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Container */}
            <div className="h-72 sm:h-[520px] w-full relative">
              <BRICSMap
                layer={mapLayer}
                selectedCountry={selectedCountryDetail}
                basemapId={basemapId}
                onCountrySelect={(c) => setSelectedCountryDetail(c)}
                onLoadingChange={(state) => setMapLoading(state)}
                hideBasemapSwitcher={true}
              />
            </div>
          </div>

          {/* Right Panel: Selected Country OR Calm Empty States */}
          <div className="flex flex-col gap-3.5">
            {selectedCountryDetail ? (
              <CountryIntelligencePanel
                country={selectedCountryDetail}
                fireCount={getFireCountForCountry(selectedCountryDetail, fireStats)}
                onClose={() => setSelectedCountryDetail(null)}
              />
            ) : (
              <>
                {/* Live Alerts Card */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
                  <CardHeader
                    icon={Bell}
                    title="Live Alerts"
                    rightSlot={
                      alerts.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> All clear
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-full">
                          {alerts.length} active
                        </span>
                      )
                    }
                  />
                  <div className="p-3.5">
                    {loading ? (
                      <div className="space-y-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-14 bg-slate-50 border border-slate-100 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <AlertFeed alerts={alerts.slice(0, 5)} />
                    )}
                  </div>
                </div>

                {/* Cross-Border Tracking Card */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
                  <CardHeader
                    icon={Wind}
                    title="Cross-Border Tracking"
                    badge="Smoke Plume Dispersion"
                  />
                  <div className="p-3.5">
                    {crossBorder.length === 0 ? (
                      <div className="py-2">
                        <div className="flex items-center gap-2 mb-2 text-xs text-slate-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                          <span>No cross-border smoke plumes detected</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                          Atmospheric vectors indicate localized circulation. Quick inspect by sovereign state:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {overview.slice(0, 7).map((c) => (
                            <button
                              key={c.country_code}
                              onClick={() => setSelectedCountryDetail(c)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200/60 text-slate-600 text-xs font-medium rounded-md border border-slate-200/70 transition-all"
                            >
                              <CountryFlag code={c.country_code} country={c.country_name} className="w-3.5 h-2.5" />
                              <span>{c.country_name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {crossBorder.slice(0, 3).map((ev, i) => (
                          <div key={i} className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                <CountryFlag code={ev.source_country_name} country={ev.source_country_name} className="w-3.5 h-2.5" />
                                <span>{ev.source_country_name}</span>
                                <span className="text-slate-400">→</span>
                                <CountryFlag code={ev.affected_country_name} country={ev.affected_country_name} className="w-3.5 h-2.5" />
                                <span>{ev.affected_country_name}</span>
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-white font-bold text-[10px] ${ev.status === 'Active' ? 'bg-rose-600' : 'bg-amber-600'}`}>
                                {ev.status}
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px]">
                              {ev.fire_count} fires · arrives in <strong className="text-slate-700">{ev.estimated_arrival_hours}h</strong> · AQI +{ev.estimated_aqi_increase_pct}%
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── AQI Overview Strip ── */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
          <CardHeader
            icon={Activity}
            title="BRICS Air Quality Overview"
            badge="Terrestrial & Satellite Combined Assessment"
            rightSlot={
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                Live · 60s auto-refresh
              </span>
            }
          />
          <div className="p-3.5">
            {loading ? (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {Array.from({ length: 11 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-32 h-20 bg-slate-50 border border-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {overview.map((c, i) => {
                  const aqi = c.aqi ?? 0;
                  const isSelected = selectedCountryDetail?.country_code === c.country_code;
                  const th = aqiTheme(aqi);
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedCountryDetail(c)}
                      className={`flex-shrink-0 w-32 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-xs ${
                        isSelected
                          ? 'border-slate-800 bg-slate-900 text-white shadow-sm'
                          : `${th.bg} ${th.ring}`
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <CountryFlag code={c.country_code} country={c.country_name} className="w-6 h-4.5 rounded-xs shadow-xs" />
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full truncate max-w-[65px] ${isSelected ? 'bg-slate-800 text-slate-300' : 'bg-white/80 text-slate-600'}`}>
                          {c.status || 'Active'}
                        </span>
                      </div>
                      <div className="flex items-end gap-1 mb-0.5">
                        <span className={`text-2xl font-extrabold leading-none ${isSelected ? 'text-white' : th.num}`}>
                          {aqi}
                        </span>
                        <span className={`w-2 h-2 rounded-full mb-0.5 flex-shrink-0 ${th.dot}`} />
                      </div>
                      <p className={`text-[10px] font-medium truncate ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                        {c.country_name}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;