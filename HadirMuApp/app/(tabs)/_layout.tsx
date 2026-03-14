import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Users, Calendar, User, Scan, ClipboardList, QrCode, LayoutDashboard } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useMaintenance } from '../../hooks/useMaintenance';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { isMaintenance } = useMaintenance();
  const insets = useSafeAreaInsets();

  // Maintenance Gate
  if (isMaintenance) {
    return <Redirect href="/maintenance" />;
  }

  // Auth Gate
  if (!loading && !user) {
    return <Redirect href="/login" />;
  }

  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSub,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 65 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
        },
        headerStyle: {
          backgroundColor: COLORS.bg,
        },
        headerTintColor: '#fff',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* 1. ATTENDANCE (Web: Attendance) */}
      <Tabs.Screen
        name="home"
        options={{
          title: isAdmin ? 'Dashboard' : 'Attendance',
          tabBarIcon: ({ color, size }) => {
            if (isAdmin) return <LayoutDashboard size={size} color={color} />;
            return isTeacher ? <Users size={size} color={color} /> : <Scan size={size} color={color} />;
          },
        }}
      />
      
      {/* 2. CLASS SCHEDULE (Web: Class Schedule - Guru Only) */}
      <Tabs.Screen
        name="recap"
        options={{
          title: 'Class Schedule', 
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
          href: isTeacher ? '/recap' : null,
        }}
      />

      {/* 3. PROFIL SAYA (Web: Profil Saya) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil Saya',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />

      {/* HIDDEN SCREENS (Internal logic) */}
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="qr" options={{ href: null }} />
      <Tabs.Screen name="scan" options={{ href: null }} />
    </Tabs>
  );
}
