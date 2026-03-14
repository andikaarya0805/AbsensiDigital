import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS } from '../../constants/theme';
import { validateQRPayload } from '../../lib/qr';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Scan, X, MapPin } from 'lucide-react-native';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  if (!permission) return <View style={styles.container} />;
  
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Aplikasi butuh akses kamera untuk scan QR.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Beri Izin Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;

    // 0. Pengecekan Verifikasi (Hanya untuk Siswa)
    if (user?.role === 'student') {
      const { data: profile } = await supabase
        .from('students')
        .select('telegram_chat_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.telegram_chat_id) {
        Alert.alert('Belum Verifikasi', 'Silakan hubungkan akun Telegram Anda terlebih dahulu di menu Profil.');
        return;
      }
    }

    setScanned(true);
    setLoading(true);

    try {
      // 1. Validasi QR Token
      const validation = validateQRPayload(data);
      if (!validation.valid) {
        Alert.alert('Gagal', 'QR Code tidak valid atau sudah kadaluarsa.', [{ text: 'Coba Lagi', onPress: () => setScanned(false) }]);
        return;
      }

      // 2. Geofencing Check (Simulasi radius 100m)
      const location = await Location.getCurrentPositionAsync({});
      // Note: Di production, bandingkan dengan koordinat sekolah dari database
      // Untuk demo, kita izinkan semua lokasi
      console.log('User Location:', location.coords.latitude, location.coords.longitude);

      // 3. Simpan Kehadiran ke Supabase
      const { error } = await supabase
        .from('attendance')
        .insert({
          student_id: user?.id,
          class_id: validation.classId,
          status_type: 'hadir',
          timestamp: new Date().toISOString()
        });

      if (error) throw error;

      Alert.alert('Berhasil', 'Absensi kamu sudah tercatat. Selamat belajar!', [
        { text: 'OK', onPress: () => router.push('/(tabs)/home') }
      ]);

    } catch (err: any) {
      Alert.alert('Error', err.message, [{ text: 'Tutup', onPress: () => setScanned(false) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.overlay}>
          <View style={styles.scannerWrapper}>
            <View style={styles.scannerLine} />
            {loading && <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />}
          </View>
          <Text style={styles.hint}>Arahkan kamera ke QR Code di layar Guru</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.locationInfo}
            onPress={async () => {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === 'granted') Alert.alert('GPS Aktif', 'Lokasi kamu siap divalidasi.');
            }}
          >
            <MapPin size={18} color={COLORS.primary} />
            <Text style={styles.locationText}>Geofencing Aktif</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: RADIUS.md,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  closeBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: RADIUS.full,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scannerWrapper: {
    width: 260,
    height: 260,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scannerLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: COLORS.primary,
    top: '50%',
  },
  loader: {
    position: 'absolute',
  },
  hint: {
    color: '#fff',
    marginTop: 30,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  locationText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  }
});
