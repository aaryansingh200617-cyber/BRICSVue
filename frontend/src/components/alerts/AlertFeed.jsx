import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import CountryFlag from '../common/CountryFlag';

const SEVERITY_STYLES = {
  critical: {
    icon: AlertTriangle,
    iconColor: 'text-rose-600',
    rowBg: 'bg-rose-50/50 border-rose-200/80',
    badge: 'bg-rose-100 text-rose-800 border border-rose-200',
    bar: 'bg-rose-600',
  },
  high: {
    icon: AlertCircle,
    iconColor: 'text-orange-600',
    rowBg: 'bg-orange-50/50 border-orange-200/80',
    badge: 'bg-orange-100 text-orange-800 border border-orange-200',
    bar: 'bg-orange-500',
  },
  medium: {
    icon: Info,
    iconColor: 'text-amber-600',
    rowBg: 'bg-amber-50/50 border-amber-200/80',
    badge: 'bg-amber-100 text-amber-800 border border-amber-200',
    bar: 'bg-amber-500',
  },
  low: {
    icon: Info,
    iconColor: 'text-slate-500',
    rowBg: 'bg-slate-50 border-slate-200',
    badge: 'bg-slate-100 text-slate-700 border border-slate-200',
    bar: 'bg-slate-400',
  },
};

const AlertFeed = ({ alerts = [] }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
        {/* Soft, light-green circular check badge */}
        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200/70 flex items-center justify-center mb-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <p className="text-xs font-semibold text-slate-800 leading-snug">
          All clear — no active alerts across 11 nations
        </p>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-xs">
          NASA VIIRS satellites and Open-Meteo terrestrial telemetry reporting atmospheric conditions within nominal thresholds.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
      {alerts.map((alert, idx) => {
        const styles = SEVERITY_STYLES[alert.severity?.toLowerCase()] || SEVERITY_STYLES.low;
        const Icon = styles.icon;
        return (
          <div
            key={idx}
            className={`relative rounded-lg border p-3 pl-3.5 overflow-hidden transition-colors ${styles.rowBg}`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.bar}`} />
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3.5 h-3.5 ${styles.iconColor}`} />
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${styles.badge}`}>
                  {alert.severity}
                </span>
                {(alert.country || alert.country_name) && (
                  <span className="text-[11px] text-slate-500 font-medium ml-1 inline-flex items-center gap-1">
                    <CountryFlag code={alert.country || alert.country_code} country={alert.country_name} className="w-3.5 h-2.5" />
                    <span>{alert.country_name || alert.country}</span>
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-800">{alert.location}</p>
              <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{alert.message}</p>
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/40 text-[10px] text-slate-400">
                <span>
                  Current AQI: <strong className="text-slate-700 font-semibold">{alert.current_aqi}</strong> · {alert.status || 'Active Anomaly'}
                </span>
                <span className="text-teal-700 font-medium">Details →</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertFeed;