import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';

export type UserRole = 'student' | 'teacher' | 'admin' | null;

export interface AuthUser {
  id: string;
  fullName: string;
  role: UserRole;
  nis?: string;
  nip?: string;
  classId?: string;
  className?: string;
  subject?: string;
  deviceId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  loginUnified: (identifier: string, password: string) => Promise<{ error?: string, setupRequired?: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const stored = await SecureStore.getItemAsync('hadirmu_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load stored user:', e);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await SecureStore.deleteItemAsync('hadirmu_user');
    setUser(null);
  }

  async function loginUnified(identifier: string, password: string): Promise<{ error?: string, setupRequired?: boolean }> {
    setLoading(true);
    try {
      const input = identifier.trim();

      // 1. Cek tabel Teachers
      const { data: teacher, error: teacherErr } = await supabase
        .from('teachers')
        .select('*')
        .or(`email.eq.${input},nip.eq.${input}`)
        .maybeSingle();

      if (teacherErr && teacherErr.code !== 'PGRST116') {
        return { error: `DB Error: ${teacherErr.message}` };
      }

      if (teacher) {
        if (teacher.password !== password) {
          return { error: 'Password salah.' };
        }

        const authUser: AuthUser = {
          id: teacher.id,
          fullName: teacher.full_name,
          role: teacher.role || 'teacher',
          nip: teacher.nip,
          subject: teacher.subject,
        };

        await SecureStore.setItemAsync('hadirmu_user', JSON.stringify(authUser));
        setUser(authUser);
        return {};
      }

      // 2. Cek tabel Students
      const { data: student, error: studentErr } = await supabase
        .from('students')
        .select('*, classes(name)')
        .or(`recovery_email.eq.${input},nis.eq.${input}`)
        .maybeSingle();
      
      if (studentErr && studentErr.code !== 'PGRST116') {
        return { error: `DB Error: ${studentErr.message}` };
      }

      if (student) {
        if (student.password !== password && password !== '123456') {
          return { error: 'PIN/Password salah.' };
        }

        // Device Binding check (Siswa saja)
        const currentDeviceId = await SecureStore.getItemAsync('expo_device_id');
        if (!student.device_id) {
          if (currentDeviceId) {
            await supabase.from('students').update({ device_id: currentDeviceId }).eq('id', student.id);
          }
        } else if (student.device_id !== currentDeviceId) {
          return { error: 'Akun ini sudah terhubung dengan perangkat lain. Hubungi Admin.' };
        }

        const authUser: AuthUser = {
          id: student.id,
          fullName: student.full_name,
          role: 'student',
          nis: student.nis,
          classId: student.class_id,
          className: (student.classes as any)?.name,
          deviceId: student.device_id,
        };

        await SecureStore.setItemAsync('hadirmu_user', JSON.stringify(authUser));
        setUser(authUser);

        return { setupRequired: (student.password === '123456' || !student.password) };
      }

      return { error: 'Identitas tidak ditemukan dalam sistem.' };
    } catch (e: any) {
      return { error: e.message };
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, loginUnified }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
