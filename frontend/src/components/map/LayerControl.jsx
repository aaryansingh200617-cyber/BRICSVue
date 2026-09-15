import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Wind, Flame, Cpu } from 'lucide-react';

const LAYERS = [
  { id: 'aqi',      icon: Wind,  label: 'AQI' },
  { id: 'fire',     icon: Flame, label: 'Fires' },
  { id: 'hotspots', icon: Cpu,   label: 'Hotspots' },
];

/**
 * LayerControl — horizontal segmented control with icons and labels.
 */
const LayerControl = () => {
  const { mapLayer, setMapLayer } = useContext(AppContext);

  return (
    <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
      {LAYERS.map(({ id, icon: Icon, label }) => {
        const isActive = mapLayer === id;
        return (
          <button
            key={id}
            onClick={() => setMapLayer(id)}
            title={`Layer: ${label}`}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
              isActive
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default LayerControl;
