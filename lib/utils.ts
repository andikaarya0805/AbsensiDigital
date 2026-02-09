import { v4 as uuidv4 } from 'uuid';

/**
 * Generates or retrieves a unique device ID from localStorage.
 * Used for Device Binding functionality to ensure 1 account per 1 device.
 */

export const getDeviceId = (): string => {
    if (typeof window === 'undefined') return '';

    let deviceId = localStorage.getItem('hadirmu_device_id');
    if (!deviceId) {
        deviceId = crypto.randomUUID?.() || Math.random().toString(36).substring(2);
        localStorage.setItem('hadirmu_device_id', deviceId);
    }
    return deviceId;
};


/**
 * Calculates the distance between two coordinates in meters.
 * Uses the Haversine formula for spherical distance.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
};
