import 'react-native-get-random-values';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useMaintenance } from '../hooks/useMaintenance';
import { useRouter, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

export default function RootLayout() {
  const router = useRouter();

  // Listen for notification taps
  useEffect(() => {
    // remote notifications are not supported in Expo Go (SDK 53+)
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    
    if (isExpoGo) {
      console.log('Push notifications are not supported in Expo Go. Use a development build for full functionality.');
      return;
    }

    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      // When user taps notification, navigate to maintenance screen
    });
    return () => sub.remove();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootContent() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.bg} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="maintenance" options={{ headerShown: false }} />
        <Stack.Screen name="setup" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="recap" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
