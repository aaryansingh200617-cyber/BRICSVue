import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

// Simple wrapper around the global context for consistent API
export const useWebSocket = () => {
  const { liveData, wsConnected } = useContext(AppContext);
  return { liveData, connected: wsConnected };
};
