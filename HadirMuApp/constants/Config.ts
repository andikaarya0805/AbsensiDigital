export const CONFIG = {
  // Centralized API URL for all mobile app requests
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://absensi-digital-five.vercel.app',
  
  // Debug mode for testing (e.g., bypass certain restrictions)
  DEBUG_MODE: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',

  // App Version
  VERSION: '1.2.0',
  BUILD: '2026',
};
