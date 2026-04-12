export const LIGHT_COLORS = {
  // Background layers
  bg: '#f8fafc',       // slate-50
  card: '#ffffff',     // white
  border: '#e2e8f0',   // slate-200

  // Brand
  primary: '#0ea5e9',  // sky-500
  primaryDark: '#0284c7', // sky-600
  accent: '#38bdf8',   // sky-400

  // Status
  success: '#22c55e',  // green-500
  warning: '#f59e0b',  // amber-500
  danger: '#ef4444',   // red-500
  info: '#3b82f6',     // blue-500

  // Text
  text: '#0f172a',     // slate-900 (Dark text for light mode)
  textMuted: '#64748b', // slate-500
  textSub: '#94a3b8',  // slate-400
};

export const DARK_COLORS = {
  // Background layers
  bg: '#0f172a',       // slate-900
  card: '#1e293b',     // slate-800
  border: '#334155',   // slate-700

  // Brand
  primary: '#0ea5e9',  // sky-500
  primaryDark: '#0284c7', // sky-600
  accent: '#38bdf8',   // sky-400

  // Status
  success: '#22c55e',  // green-500
  warning: '#f59e0b',  // amber-500
  danger: '#ef4444',   // red-500
  info: '#818cf8',     // indigo-400

  // Text
  text: '#f1f5f9',     // slate-100
  textMuted: '#94a3b8', // slate-400
  textSub: '#64748b',  // slate-500
};

// Aliased as COLORS for backward compatibility during transition
export const COLORS = DARK_COLORS;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  primary: {
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};
