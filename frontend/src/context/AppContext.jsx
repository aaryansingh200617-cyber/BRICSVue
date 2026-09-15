import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [mapLayer, setMapLayer] = useState('aqi');
  const [liveData, setLiveData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connect = () => {
      const wsUrl = import.meta.env.VITE_WS_URL ||
        (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.startsWith('192.168.')
          ? 'wss://bricsvue-api.onrender.com/ws/live'
          : 'ws://localhost:8000/ws/live');
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLiveData(data);
          if (data.type === 'alert') {
            setAlerts((prev) => [data.alert, ...prev].slice(0, 50));
          }
        } catch (e) {
          console.error("Error parsing WS data", e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        console.error("WS Error", err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const value = {
    selectedCountry, setSelectedCountry,
    selectedCity, setSelectedCity,
    mapLayer, setMapLayer,
    liveData,
    alerts, setAlerts,
    wsConnected
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
