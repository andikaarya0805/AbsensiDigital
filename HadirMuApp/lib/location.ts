import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationResult {
    latitude: number;
    longitude: number;
    accuracy: number | null;
}

/**
 * Mendapatkan lokasi saat ini dengan mekanisme fallback dan timeout yang kuat.
 */
export async function getRobustLocation(): Promise<LocationResult> {
    try {
        // 1. Cek Service GPS
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
            throw new Error('Layanan lokasi (GPS) tidak aktif. Silakan aktifkan GPS Anda.');
        }

        // 2. Cek/Request Izin
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Izin lokasi ditolak. Aplikasi butuh izin lokasi untuk validasi.');
        }

        // 3. Coba dapatkan lokasi (High Accuracy) dengan timeout singkat
        try {
            const location = await Promise.race([
                Location.getCurrentPositionAsync({ 
                    accuracy: Location.Accuracy.High,
                }),
                new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
            ]);

            if (location) {
                return {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    accuracy: location.coords.accuracy
                };
            }
        } catch (e) {
            console.log('High accuracy failed or timed out, trying balanced...');
        }

        // 4. Fallback ke Balanced Accuracy
        const balancedLocation = await Location.getCurrentPositionAsync({ 
            accuracy: Location.Accuracy.Balanced 
        });

        if (balancedLocation) {
            return {
                latitude: balancedLocation.coords.latitude,
                longitude: balancedLocation.coords.longitude,
                accuracy: balancedLocation.coords.accuracy
            };
        }

        // 5. Fallback Terakhir: Last Known Position
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
            return {
                latitude: lastKnown.coords.latitude,
                longitude: lastKnown.coords.longitude,
                accuracy: lastKnown.coords.accuracy
            };
        }

        throw new Error('Gagal mendapatkan koordinat lokasi. Coba buka aplikasi Maps sejenak lalu kembali lagi.');
    } catch (error: any) {
        throw error;
    }
}
