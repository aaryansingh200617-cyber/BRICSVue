import React from 'react';
import { Flame } from 'lucide-react';

const FirePopup = ({ fire }) => (
  <div className="p-2 min-w-[200px]">
    <div className="flex items-center space-x-2 text-orange-600 font-bold border-b pb-2 mb-2">
      <Flame className="w-4 h-4" />
      <span>Fire Event Detected</span>
    </div>
    <div className="space-y-1 text-sm text-slate-700">
      <p><strong>Lat/Lon:</strong> {fire.lat.toFixed(2)}, {fire.lon.toFixed(2)}</p>
      <p><strong>Date:</strong> {fire.date}</p>
      <p><strong>Confidence:</strong> {fire.confidence}%</p>
      <p><strong>Brightness:</strong> {fire.brightness}K</p>
    </div>
    <div className="mt-3 pt-2 border-t text-xs text-slate-500">
      High potential for localized air quality degradation.
    </div>
  </div>
);

export default FirePopup;
