import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Linking, ActivityIndicator, TextInput } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { 
  LogOut, ChevronRight, HardDrive, Send, 
  User, Camera, Lock, Save
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form Data (Converted from Web)
  const [formData, setFormData] = useState({
      id: '',
      full_name: '',
      password: '',
      avatar_url: '',
      nis: '',
      class: '',
      email: ''
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(user.role === 'student' ? 'students' : 'teachers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
        setFormData({
          id: data.id,
          full_name: data.full_name || '',
          password: data.password || '',
          avatar_url: data.avatar_url || '',
          nis: data.nis || '',
          class: data.class || '',
          email: data.email || ''
        });
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      Alert.alert('Error', 'Gagal memuat data profil.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Maaf, kami membutuhkan izin akses galeri untuk mengunggah foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat memilih gambar.');
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.role}s/${fileName}`;

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        name: fileName,
        type: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
      } as any);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // Update Database
      const { error: updateError } = await supabase
        .from(user.role === 'student' ? 'students' : 'teachers')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }));
      setFormData((prev: any) => ({ ...prev, avatar_url: avatarUrl }));
      Alert.alert('Sukses', 'Foto profil berhasil diperbarui!');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', `Gagal mengunggah foto profil: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Ported Logic: Update Profile (Sync with Web API Route behavior)
      const { error } = await supabase
        .from(user?.role === 'student' ? 'students' : 'teachers')
        .update({ 
          full_name: formData.full_name,
          password: formData.password
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
      Alert.alert('Sukses', 'Profil berhasil diperbarui!');
    } catch (err: any) {
      console.error("Update error:", err);
      setMessage({ type: 'error', text: 'Gagal menyimpan profil: ' + err.message });
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Apakah kamu yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout }
    ]);
  };

  const handleVerifyTelegram = async () => {
    const token = Math.random().toString(36).substring(2, 15);
    await supabase.from(user?.role === 'student' ? 'students' : 'teachers').update({ verification_token: token }).eq('id', user?.id);
    Linking.openURL(`https://t.me/HadirMu_Bot?start=v_${token}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const identityLabel = user?.role === 'teacher' ? 'NIP' : 'NIS';
  const identityValue = profile?.nip || profile?.nis || '-';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 1. Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {uploadingAvatar ? (
             <View style={styles.avatarPlaceholder}>
               <ActivityIndicator size="large" color={COLORS.primary} />
             </View>
          ) : profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
               <User size={40} color={COLORS.primary} />
            </View>
          )}
          <TouchableOpacity style={styles.cameraBtn} onPress={handlePickImage} disabled={uploadingAvatar}>
            <Camera size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <Text style={styles.roleTag}>
          {user?.role?.toUpperCase()} • {identityLabel}: {identityValue}
        </Text>
      </View>

      {/* 2. Telegram Verification Alert (If not verified) */}
      {!profile?.telegram_chat_id && (
        <View style={styles.alertBox}>
          <View style={styles.alertIcon}>
            <Send size={20} color={COLORS.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Verifikasi Telegram</Text>
            <Text style={styles.alertSub}>Hubungkan akun Anda untuk notifikasi real-time.</Text>
          </View>
          <TouchableOpacity style={styles.alertBtn} onPress={handleVerifyTelegram}>
            <Text style={styles.alertBtnText}>Hubungkan</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Account Settings (Ported from Web) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Akun & Data Diri</Text>
        <View style={styles.card}>
           {message && (
             <View style={[styles.localMessage, { backgroundColor: message.type === 'success' ? COLORS.success + '15' : COLORS.danger + '15' }]}>
               <Text style={[styles.localMessageText, { color: message.type === 'success' ? COLORS.success : COLORS.danger }]}>{message.text}</Text>
             </View>
           )}

           {/* Full Name */}
           <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                 <User size={14} color={COLORS.textSub} />
                 <Text style={styles.inputLabel}>Nama Lengkap</Text>
              </View>
              <TextInput 
                style={[styles.input, user?.role === 'student' && { backgroundColor: COLORS.bg, opacity: 0.7 }]} 
                value={formData.full_name} 
                onChangeText={(text) => setFormData({ ...formData, full_name: text })} 
                placeholder="Nama Lengkap"
                editable={user?.role !== 'student'}
              />
           </View>

           {/* Password */}
           <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                 <Lock size={14} color={COLORS.textSub} />
                 <Text style={styles.inputLabel}>Password Login</Text>
              </View>
              <TextInput 
                style={styles.input} 
                value={formData.password} 
                onChangeText={(text) => setFormData({ ...formData, password: text })} 
                placeholder="Password"
                secureTextEntry
               />
            </View>

           <View style={styles.divider} />

           {/* Readonly Info Row */}
           <View style={styles.readonlyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.readLabel}>{user?.role === 'teacher' ? 'EMail' : 'NIS'}</Text>
                <Text style={styles.readVal}>{formData.email || formData.nis}</Text>
              </View>
              {user?.role === 'student' && (
                <View style={{ flex: 1 }}>
                  <Text style={styles.readLabel}>Kelas</Text>
                  <Text style={styles.readVal}>{formData.class}</Text>
                </View>
              )}
           </View>

           <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Save size={18} color="#fff" />
                  <Text style={styles.saveText}>Simpan Perubahan</Text>
                </>
              )}
           </TouchableOpacity>
        </View>
      </View>

      {/* 4. Security & Others */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Keamanan & Sistem</Text>
        <View style={styles.card}>
           <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconBox}>
                <Lock size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.menuTitle}>Ganti Password</Text>
              <ChevronRight size={18} color={COLORS.border} />
           </TouchableOpacity>
           <View style={styles.divider} />
           <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconBox}>
                <HardDrive size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.menuTitle}>Device Binding</Text>
              <View style={styles.statusBadge}>
                 <Text style={styles.statusText}>{profile?.device_id ? 'AKTIF' : 'NONAKTIF'}</Text>
              </View>
           </TouchableOpacity>
        </View>
      </View>

      {/* 5. Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>Keluar dari Aplikasi</Text>
      </TouchableOpacity>
      
      <Text style={styles.version}>HadirMu v1.2.0 • Build 2026</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: COLORS.primary,
    padding: 2,
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.card,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
  },
  roleTag: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSub,
    marginTop: 4,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '10',
    margin: 20,
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.info + '30',
    gap: 12,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.info + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  alertSub: {
    fontSize: 11,
    color: COLORS.textSub,
    marginTop: 2,
  },
  alertBtn: {
    backgroundColor: COLORS.info,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
  },
  alertBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textSub,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    ...SHADOW.card,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSub,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    gap: 10,
  },
  saveText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 16,
    backgroundColor: COLORS.danger + '10',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.danger,
  },
  version: {
    textAlign: 'center',
    color: COLORS.textSub,
    fontSize: 12,
    marginTop: 30,
    opacity: 0.5,
    fontWeight: '600',
  },
  localMessage: {
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  localMessageText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  readonlyRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    marginTop: 10,
  },
  readLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textSub,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  readVal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    opacity: 0.7,
  },
});
