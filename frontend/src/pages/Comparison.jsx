import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import StatCard from '../components/common/StatCard';
import CountryFlag from '../components/common/CountryFlag';
import { ShieldAlert, ThumbsUp, Flame, ArrowUp, ArrowDown, Minus, ExternalLink, RefreshCw } from 'lucide-react';
import { fetchComparison, fetchFireStats } from '../services/api';
import { KNOWN_FIRE_COUNTS } from '../utils/countryData';

const DEFAULT_11_COUNTRIES = [
  { country_code: 'ID', name: 'Indonesia', flag: '🇮🇩', city: 'Jakarta', aqi_value: 142, pm25: 64, fire_count: KNOWN_FIRE_COUNTS.ID || 5964, aqi_risk_level: 'Unhealthy (SG)', trend_direction: '↑' },
  { country_code: 'BR', name: 'Brazil', flag: '🇧🇷', city: 'Brasilia', aqi_value: 42, pm25: 12, fire_count: KNOWN_FIRE_COUNTS.BR || 1815, aqi_risk_level: 'Good', trend_direction: '↓' },
  { country_code: 'RU', name: 'Russia', flag: '🇷🇺', city: 'Moscow', aqi_value: 48, pm25: 15, fire_count: KNOWN_FIRE_COUNTS.RU || 1187, aqi_risk_level: 'Good', trend_direction: '→' },
  { country_code: 'CN', name: 'China', flag: '🇨🇳', city: 'Beijing', aqi_value: 115, pm25: 45, fire_count: KNOWN_FIRE_COUNTS.CN || 681, aqi_risk_level: 'Unhealthy (SG)', trend_direction: '↓' },
  { country_code: 'ZA', name: 'South Africa', flag: '🇿🇦', city: 'Johannesburg', aqi_value: 58, pm25: 16, fire_count: KNOWN_FIRE_COUNTS.ZA || 376, aqi_risk_level: 'Moderate', trend_direction: '↑' },
  { country_code: 'IR', name: 'Iran', flag: '🇮🇷', city: 'Tehran', aqi_value: 132, pm25: 58, fire_count: KNOWN_FIRE_COUNTS.IR || 280, aqi_risk_level: 'Unhealthy (SG)', trend_direction: '↑' },
  { country_code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', city: 'Riyadh', aqi_value: 94, pm25: 34, fire_count: KNOWN_FIRE_COUNTS.SA || 235, aqi_risk_level: 'Moderate', trend_direction: '→' },
  { country_code: 'ET', name: 'Ethiopia', flag: '🇪🇹', city: 'Addis Ababa', aqi_value: 38, pm25: 9, fire_count: KNOWN_FIRE_COUNTS.ET || 122, aqi_risk_level: 'Good', trend_direction: '↓' },
  { country_code: 'IN', name: 'India', flag: '🇮🇳', city: 'Delhi', aqi_value: 185, pm25: 98, fire_count: KNOWN_FIRE_COUNTS.IN || 95, aqi_risk_level: 'Unhealthy', trend_direction: '↑' },
  { country_code: 'EG', name: 'Egypt', flag: '🇪🇬', city: 'Cairo', aqi_value: 124, pm25: 52, fire_count: KNOWN_FIRE_COUNTS.EG || 61, aqi_risk_level: 'Unhealthy (SG)', trend_direction: '→' },
  { country_code: 'AE', name: 'UAE', flag: '🇦🇪', city: 'Dubai', aqi_value: 88, pm25: 28, fire_count: KNOWN_FIRE_COUNTS.AE || 43, aqi_risk_level: 'Moderate', trend_direction: '→' },
];

const getAQIColorHex = (aqi) => {
  if (aqi <= 50) return '#22c55e';
  if (aqi <= 100) return '#eab308';
  if (aqi <= 150) return '#f97316';
  if (aqi <= 200) return '#ef4444';
  if (aqi <= 300) return '#a855f7';
  return '#831843';
};

const getAQIBadge = (aqi) => {
  if (aqi <= 50) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (aqi <= 100) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (aqi <= 150) return 'bg-orange-50 text-orange-700 border-orange-200';
  if (aqi <= 200) return 'bg-red-50 text-red-700 border-red-200';
  if (aqi <= 300) return 'bg-purple-50 text-purple-700 border-purple-200';
  return 'bg-rose-50 text-rose-900 border-rose-200';
};

const Comparison = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(DEFAULT_11_COUNTRIES);
  const [loading, setLoading] = useState(true);

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      const [compRes, fireStatsRes] = await Promise.allSettled([
        fetchComparison(),
        fetchFireStats()
      ]);

      const res = compRes.status === 'fulfilled' ? compRes.value : null;
      const fireStats = fireStatsRes.status === 'fulfilled' ? fireStatsRes.value : {};

      const byCode = {};
      if (Array.isArray(res)) {
        res.forEach(item => { byCode[item.country_code] = item; });
      }

      const merged = DEFAULT_11_COUNTRIES.map(def => {
        const live = byCode[def.country_code] || {};
        const liveFires = (fireStats && fireStats[def.country_code] > 0)
          ? fireStats[def.country_code]
          : (live.fire_count > 0 ? live.fire_count : def.fire_count);

        return {
          ...def,
          ...live,
          fire_count: liveFires
        };
      });
      merged.sort((a, b) => b.aqi_value - a.aqi_value);
      setData(merged);
    } catch (e) {
      console.error('Error loading comparison data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparisonData();
    const interval = setInterval(() => {
      loadComparisonData();
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  // Compute dynamic highlight metrics across all 11 countries
  const highestAqiCountry = data.reduce((prev, curr) => (curr.aqi_value > prev.aqi_value ? curr : prev), data[0]);
  const mostFiresCountry = data.reduce((prev, curr) => (curr.fire_count > prev.fire_count ? curr : prev), data[0]);
  const bestAqiCountry = data.reduce((prev, curr) => (curr.aqi_value < prev.aqi_value ? curr : prev), data[0]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-10 space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">BRICS Environmental Comparison</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
              All 11 Member Nations
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time multi-nation comparative metrics &amp; cross-country air quality index analysis
          </p>
        </div>
        <button
          onClick={loadComparisonData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-sm transition-colors self-start sm:self-auto flex-shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {/* ── HIGHLIGHT STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Highest AQI Risk"
          value={
            <span className="flex items-center gap-2">
              <CountryFlag code={highestAqiCountry.country_code} country={highestAqiCountry.name} className="w-7 h-5" />
              <span>{highestAqiCountry.name}</span>
            </span>
          }
          subtitle={`AQI: ${highestAqiCountry.aqi_value} (${highestAqiCountry.aqi_risk_level})`}
          icon={ShieldAlert}
          color="red"
        />
        <StatCard
          title="Most Active Fire Events"
          value={
            <span className="flex items-center gap-2">
              <CountryFlag code={mostFiresCountry.country_code} country={mostFiresCountry.name} className="w-7 h-5" />
              <span>{mostFiresCountry.name}</span>
            </span>
          }
          subtitle={`${mostFiresCountry.fire_count} active thermal clusters (NASA FIRMS)`}
          icon={Flame}
          color="orange"
        />
        <StatCard
          title="Best Air Quality"
          value={
            <span className="flex items-center gap-2">
              <CountryFlag code={bestAqiCountry.country_code} country={bestAqiCountry.name} className="w-7 h-5" />
              <span>{bestAqiCountry.name}</span>
            </span>
          }
          subtitle={`AQI: ${bestAqiCountry.aqi_value} (Lowest regional particulate)`}
          icon={ThumbsUp}
          color="green"
        />
      </div>

      {/* ── 11-COUNTRY BAR GRAPH ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">AQI Distribution Across All 11 BRICS Nations</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison of current air quality index. Color indicates environmental risk level.
            </p>
          </div>
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium text-slate-600">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Good (0-50)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Moderate (51-100)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Unhealthy (101-150)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Severe (151+)</span>
          </div>
        </div>

        <div className="h-56 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={({ x, y, payload }) => {
                  const item = data.find(d => d.name === payload.value);
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={0} dy={16} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={500}>
                        {item ? `${item.flag} ${item.name}` : payload.value}
                      </text>
                    </g>
                  );
                }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <CountryFlag code={d.country_code} country={d.name} className="w-4 h-3" />
                          <span>{d.name}</span>
                        </div>
                        <p className="text-slate-300">Monitored City: <strong>{d.city}</strong></p>
                        <p className="text-slate-300">AQI: <strong style={{ color: getAQIColorHex(d.aqi_value) }}>{d.aqi_value}</strong> ({d.aqi_risk_level})</p>
                        <p className="text-slate-300">PM2.5: <strong>{d.pm25} μg/m³</strong></p>
                        <p className="text-slate-300">Active Fires: <strong>{d.fire_count}</strong></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="aqi_value" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getAQIColorHex(entry.aqi_value)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── FULL 11-COUNTRY COMPARISON TABLE ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">All 11 BRICS Nations Comparison Table</h3>
            <p className="text-xs text-slate-500">Live environmental synchronization across members</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">11 of 11 countries reporting</span>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 sm:px-6 py-3.5">Country &amp; Hub</th>
                <th className="px-4 sm:px-6 py-3.5">AQI Value</th>
                <th className="px-4 sm:px-6 py-3.5">Trend</th>
                <th className="px-4 sm:px-6 py-3.5">PM2.5</th>
                <th className="px-4 sm:px-6 py-3.5">Active Fires</th>
                <th className="px-4 sm:px-6 py-3.5">Status</th>
                <th className="px-4 sm:px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, i) => (
                <tr key={row.country_code || i} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2.5">
                      <CountryFlag code={row.country_code} country={row.name} className="w-6 h-4.5 rounded-xs shadow-xs" />
                      <div>
                        <p className="font-bold text-slate-900 leading-tight text-xs sm:text-sm">{row.name}</p>
                        <p className="text-xs text-slate-400">{row.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className={`px-2 sm:px-3 py-1 rounded-full border text-xs font-extrabold ${getAQIBadge(row.aqi_value)}`}>
                      {row.aqi_value}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                      row.trend_direction === '↑' ? 'text-red-500' :
                      row.trend_direction === '↓' ? 'text-emerald-500' : 'text-slate-400'
                    }`}>
                      {row.trend_direction === '↑' && <ArrowUp className="w-3.5 h-3.5" />}
                      {row.trend_direction === '↓' && <ArrowDown className="w-3.5 h-3.5" />}
                      {row.trend_direction === '→' && <Minus className="w-3.5 h-3.5" />}
                      <span>{row.trend_direction === '↑' ? 'Rising' : row.trend_direction === '↓' ? 'Declining' : 'Stable'}</span>
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-700 text-xs sm:text-sm">
                    {row.pm25} <span className="text-xs text-slate-400 font-normal">μg/m³</span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-1.5 text-orange-600 font-bold">
                      <Flame className="w-4 h-4" />
                      <span className="text-xs sm:text-sm">{row.fire_count}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-600">
                    {row.aqi_risk_level}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Comparison;
