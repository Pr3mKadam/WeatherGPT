import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

export const DEFAULT_LOCATION = {
  name: 'Pune',
  admin1: 'Maharashtra',
  country: 'India',
  lat: 18.5196,
  lon: 73.8554,
  timezone: 'Asia/Kolkata',
};

const STORAGE_KEY = 'weathergpt.location.v1';
const LocationContext = createContext(null);

function readStoredLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LOCATION;
    const parsed = JSON.parse(raw);
    if (!Number.isFinite(Number(parsed?.lat)) || !Number.isFinite(Number(parsed?.lon))) {
      return DEFAULT_LOCATION;
    }
    return {
      name: parsed.name || 'Selected location',
      admin1: parsed.admin1 || '',
      country: parsed.country || '',
      lat: Number(parsed.lat),
      lon: Number(parsed.lon),
      timezone: parsed.timezone || null,
    };
  } catch {
    return DEFAULT_LOCATION;
  }
}

function normalise(location) {
  if (!location || !Number.isFinite(Number(location.lat)) || !Number.isFinite(Number(location.lon))) {
    return null;
  }
  return {
    name: location.name || 'Selected location',
    admin1: location.admin1 || '',
    country: location.country || '',
    lat: Number(location.lat),
    lon: Number(location.lon),
    timezone: location.timezone || null,
  };
}

function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser. Search for a city instead.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        const messages = {
          1: 'Location permission was denied. Search for a city instead.',
          2: 'Your location is unavailable right now. Try searching instead.',
          3: 'Location lookup timed out. Try again or search for a city.',
        };
        reject(new Error(messages[error.code] || 'Could not read your location.'));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(readStoredLocation);
  const [locating, setLocating] = useState(false);

  const setLocation = useCallback((next) => {
    const normalised = normalise(next);
    if (!normalised) return;
    setLocationState(normalised);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalised));
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const detectLocation = useCallback(async () => {
    setLocating(true);
    try {
      const position = await getBrowserPosition();
      const lat = Number(position.coords.latitude.toFixed(4));
      const lon = Number(position.coords.longitude.toFixed(4));
      let resolved = { name: 'My location', admin1: '', country: '', lat, lon, timezone: null };
      try {
        const response = await api.get(`/geo/reverse?lat=${lat}&lon=${lon}`);
        if (response?.location) resolved = { ...response.location, lat, lon };
      } catch {
        /* naming is optional — coordinates are still usable */
      }
      setLocation(resolved);
      return resolved;
    } finally {
      setLocating(false);
    }
  }, [setLocation]);

  const resetLocation = useCallback(() => setLocation(DEFAULT_LOCATION), [setLocation]);

  const value = useMemo(
    () => ({ location, setLocation, detectLocation, locating, resetLocation, defaultLocation: DEFAULT_LOCATION }),
    [location, setLocation, detectLocation, locating, resetLocation]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used inside LocationProvider');
  return context;
}
