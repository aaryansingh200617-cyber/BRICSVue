import React from 'react';
import CountryFlag from '../common/CountryFlag';

const getAQIColor = (aqi) => {
  if (aqi < 50) return 'text-green-600';
  if (aqi < 100) return 'text-yellow-600';
  if (aqi < 150) return 'text-orange-600';
  if (aqi < 200) return 'text-red-600';
  if (aqi < 300) return 'text-purple-600';
  return 'text-rose-900';
};

const PollutionPopup = ({ city }) => (
  <div className="p-2 min-w-[200px]">
    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
      <CountryFlag code={city.country_code || city.country} country={city.country_name} className="w-5 h-3.5" />
      <span>{city.name || city.city}</span>
    </h3>
    <p className="text-xs text-slate-500">{city.country_name || city.country}</p>
    
    <div className="my-3 flex items-center justify-between">
      <div>
        <span className="text-xs font-semibold text-slate-400">AQI</span>
        <div className={`text-3xl font-black ${getAQIColor(city.aqi)}`}>
          {city.aqi}
        </div>
      </div>
      <div className="text-right">
        <span className="text-xs font-semibold text-slate-400">PM2.5</span>
        <div className="text-xl font-bold text-slate-700">
          {city.pm25} <span className="text-[10px]">µg/m³</span>
        </div>
      </div>
    </div>
    
    <div className="px-2 py-1 bg-gray-100 rounded text-center text-xs font-semibold text-slate-700 mb-2">
      {city.status}
    </div>
  </div>
);

export default PollutionPopup;
