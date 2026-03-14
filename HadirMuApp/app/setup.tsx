import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, MessageCircle, CheckCircle2, Loader2 } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function SetupScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) return 'Password minimal 6 karakter.';
    if (!/^[A-Z]/.test(pwd)) return 'Password harus diawali huruf besar.';
    if (!/\d/.test(pwd)) return 'Password harus mengandung angka.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password harus mengandung minimal satu karakter spesial.';
    return null;
  };

  async function handleSetup() {
    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (password === '123456') {
      setError('Jangan gunakan password default 123456!');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    if (!whatsapp || whatsapp.length < 10) {
      setError('Masukkan nomor WhatsApp yang valid.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('students')
        .update({
          password: password,
          whatsapp_number: whatsapp,
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.successContainer}>
        <CheckCircle2 size={80} color={COLORS.primary} />
        <Text style={styles.successTitle}>Akun Diamankan!</Text>
        <Text style={styles.successSubtitle}>Password baru dan nomor WhatsApp berhasil disimpan.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <ShieldCheck size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Amankan Akunmu</Text>
          <Text style={styles.subtitle}>
            Hai {user?.fullName || 'Siswa'}, demi keamanan, kamu wajib mengganti PIN default menjadi password yang kuat.
          </Text>
        </View>

        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>Aturan Password:</Text>
          <Text style={styles.rule}>• Minimal 6 karakter</Text>
          <Text style={styles.rule}>• Diawali Huruf Besar (A-Z)</Text>
          <Text style={styles.rule}>• Mengandung Angka (0-9)</Text>
          <Text style={styles.rule}>• Mengandung Karakter Spesial (!@#$)</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password Baru</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Min. 6 karakter"
                placeholderTextColor={COLORS.textSub}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Konfirmasi Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ulangi password baru"
                placeholderTextColor={COLORS.textSub}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nomor WhatsApp (Aktif)</Text>
            <View style={styles.inputWrapper}>
              <MessageCircle size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contoh: 08123456789"
                placeholderTextColor={COLORS.textSub}
                value={whatsapp}
                onChangeText={setWhatsapp}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.disabledBtn]}
            onPress={handleSetup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.saveBtnText}>Simpan & Lanjutkan</Text>
                <ArrowRight size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => logout()} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>Batal & Keluar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSub,
    textAlign: 'center',
    lineHeight: 20,
  },
  rulesCard: {
    backgroundColor: '#1d2a45',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2e3b5e',
  },
  rulesTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  rule: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#fff',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#450a0a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.danger,
    gap: 10,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    flex: 1,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutBtn: {
    marginTop: 16,
    alignItems: 'center',
    padding: 8,
  },
  logoutBtnText: {
    color: COLORS.textSub,
    fontSize: 14,
  },
  successContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.textSub,
    textAlign: 'center',
    lineHeight: 24,
  },
});
