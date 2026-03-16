import { useState, useEffect } from 'react';

const LOCATION_KEY = 'user_location_cache';
const CACHE_HOURS = 1;

export function useUserLocation() {
    const [location, setLocation] = useState(null);

    useEffect(() => {
        // Cek cache
        const cached = localStorage.getItem(LOCATION_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                const now = new Date().getTime();
                if (now - parsed.timestamp < CACHE_HOURS * 60 * 60 * 1000) {
                    setLocation({ lat: parsed.lat, lng: parsed.lng });
                }
            } catch (e) {
                console.error("Failed to parse cached location", e);
            }
        }

        // Auto request lokasi jika belum ada atau expired
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const loc = { lat: latitude, lng: longitude };
                    setLocation(loc);
                    localStorage.setItem(LOCATION_KEY, JSON.stringify({
                        ...loc,
                        timestamp: new Date().getTime()
                    }));
                },
                (error) => {
                    console.log("Geolocation error or denied", error);
                }
            );
        }
    }, []);

    return location;
}

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius bumi dalam kilometer
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Hasil dalam kilometer
};

const deg2rad = (deg) => deg * (Math.PI / 180);

export const formatDistance = (distanceInKm) => {
    if (distanceInKm === null || distanceInKm === undefined || isNaN(distanceInKm)) return '';
    if (distanceInKm < 1) return `${Math.round(distanceInKm * 1000)} m`;
    return `${distanceInKm.toFixed(1)} km`;
};
