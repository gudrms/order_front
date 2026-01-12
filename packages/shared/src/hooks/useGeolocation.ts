'use client';

import { useState, useEffect } from 'react';

interface GeolocationState {
    loaded: boolean;
    coordinates: { lat: number; lng: number } | null;
    error?: { code: number; message: string };
}

export const useGeolocation = () => {
    const [location, setLocation] = useState<GeolocationState>({
        loaded: false,
        coordinates: null,
    });

    const onSuccess = (location: GeolocationPosition) => {
        setLocation({
            loaded: true,
            coordinates: {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            },
        });
    };

    const onError = (error: GeolocationPositionError) => {
        setLocation({
            loaded: true,
            coordinates: null,
            error: {
                code: error.code,
                message: error.message,
            },
        });
    };

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            onError({
                code: 0,
                message: "Geolocation not supported",
            } as GeolocationPositionError);
            return;
        }

        navigator.geolocation.getCurrentPosition(onSuccess, onError);
    }, []);

    return location;
};
