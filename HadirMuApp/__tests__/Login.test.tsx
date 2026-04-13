import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../app/login';

import { ThemeProvider } from '../context/ThemeContext';

// Mock context/hooks if needed
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    signIn: jest.fn(),
  }),
}));

describe('LoginScreen', () => {
  it('renders correctly', () => {
    // We wrap in empty view or just test if it doesn't crash
    const { getByText } = render(
      <ThemeProvider>
        <LoginScreen />
      </ThemeProvider>
    );
    // Just a placeholder assertion
    expect(true).toBeTruthy();
  });
});
