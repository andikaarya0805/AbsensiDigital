import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../context/ThemeContext';

export default function Index() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // 1. Pastikan Device ID ada (buat jika belum ada)
      let deviceId = await SecureStore.getItemAsync('expo_device_id');
      if (!deviceId) {
        deviceId = `dev_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
        await SecureStore.setItemAsync('expo_device_id', deviceId);
      }

      // 2. Cek Sesi User
      const stored = await SecureStore.getItemAsync('hadirmu_user');
      if (stored) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
