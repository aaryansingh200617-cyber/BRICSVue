import { useState, useEffect, useCallback } from 'react';
import { fetchBRICSOverview } from '../services/api';

export const useAQI = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchBRICSOverview();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
      // Dummy data for resilient UI development if API is not running
      setData({
        countries: [
          { name: 'Brazil', aqi: 45, status: 'Good' },
          { name: 'Russia', aqi: 62, status: 'Moderate' },
          { name: 'India', aqi: 155, status: 'Unhealthy' },
          { name: 'China', aqi: 110, status: 'Unhealthy for Sensitive Groups' },
          { name: 'South Africa', aqi: 55, status: 'Moderate' }
        ]
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000); // 60s
    return () => clearInterval(interval);
  }, [refresh]);

  return { data, loading, error, refresh };
};
