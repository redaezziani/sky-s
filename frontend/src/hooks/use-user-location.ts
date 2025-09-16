"use client";

import { useState, useEffect } from "react";

interface UserLocation {
  lat: number | null;
  lng: number | null;
  place: string | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

export function useUserLocation(): UserLocation {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [place, setPlace] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    async function fetchLocation() {
      setLoading(true);
      try {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              setLat(latitude);
              setLng(longitude);
              setPlace(`Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`);
              setLoading(false);
            },
            () => {
              // user denied
              setPermissionDenied(true);
              setLoading(false);
            }
          );
        } else {
          setError("Geolocation not supported");
          setPermissionDenied(true);
          setLoading(false);
        }
      } catch (err) {
        setError("Error detecting location");
        setPermissionDenied(true);
        setLoading(false);
      }
    }

    fetchLocation();
  }, []);

  return { lat, lng, place, loading, error, permissionDenied };
}
