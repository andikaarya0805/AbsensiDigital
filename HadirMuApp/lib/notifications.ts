import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(userId: string, role: 'student' | 'teacher') {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return;
  }

  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (isExpoGo) {
    console.log('Push notifications are not supported in Expo Go. Use a development build.');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('maintenance', {
      name: 'Maintenance',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0ea5e9',
    });
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Save token to Supabase
    const table = role === 'student' ? 'students' : 'teachers';
    await supabase
      .from(table)
      .update({ expo_push_token: token })
      .eq('id', userId);

    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
  }
}

export function usePushNotificationListener(onReceived: (notification: Notifications.Notification) => void) {
  return Notifications.addNotificationReceivedListener(onReceived);
}
