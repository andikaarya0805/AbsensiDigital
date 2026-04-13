if (typeof global.global === 'undefined') {
  global.global = global;
}
if (typeof global.FormData === 'undefined') {
  global.FormData = class {};
}
if (typeof global.window === 'undefined') {
  global.window = global;
}
if (typeof global.navigator === 'undefined') {
  global.navigator = { product: 'ReactNative' };
}

import 'react-native-get-random-values';
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
try {
  jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
} catch (e) {
  // Module not found in this RN version, skip
}

// Mock Expo Modules
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: { latitude: -6.123, longitude: 106.123, accuracy: 10 }
  })),
  hasServicesEnabledAsync: jest.fn(() => Promise.resolve(true)),
  getLastKnownPositionAsync: jest.fn(() => Promise.resolve(null)),
  Accuracy: { High: 4, Balanced: 3, Low: 2 }
}));

jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  Stack: () => null,
}));
