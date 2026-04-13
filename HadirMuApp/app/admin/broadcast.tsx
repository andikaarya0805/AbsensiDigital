import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ChevronLeft, Send, Megaphone, AlertCircle, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://absensi-digital-i87xnkg8j-andikaarya0805s-projects.vercel.app';

export default function BroadcastScreen() {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const router = useRouter();
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState<'all' | 'students' | 'teachers'>('all');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!message.trim()) {
            Alert.alert('Peringatan', 'Pesan tidak boleh kosong!');
            return;
        }

        const targetName = target === 'all' ? 'SELURUH' : target === 'students' ? 'SELURUH SISWA' : 'SELURUH GURU';
        Alert.alert(
            'Konfirmasi Broadcast',
            `Pesan akan dikirimkan ke ${targetName} pengguna Telegram yang terhubung. Lanjutkan?`,
            [
                { text: 'Batal', style: 'cancel' },
                { 
                    text: 'Kirim Sekarang', 
                    onPress: async () => {
                        setIsSending(true);
                        try {
                            const response = await fetch(`${API_URL}/api/admin/broadcast`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ message, target })
                            });

                            const text = await response.text();
                            let result;
                            
                            try {
                                result = JSON.parse(text);
                            } catch (e) {
                                throw new Error(`Server returned invalid response (Status: ${response.status})`);
                            }

                            if (!response.ok) {
                                throw new Error(result.error || `Gagal mengirim broadcast (Status: ${response.status})`);
                            }

                            if (result.successCount === 0) {
                                Alert.alert('Peringatan', result.message || 'Tidak ada penerima yang ditemukan.');
                            } else {
                                Alert.alert('Sukses', result.message || `Berhasil mengirim pesan ke ${result.successCount} pengguna.`);
                            }
                            setMessage('');
                        } catch (error: any) {
                            console.error('Broadcast Network Error:', error);
                            
                            let errorMsg = error.message;
                            if (errorMsg.includes('Unexpected token <')) {
                                errorMsg = `Server error (Terjadi kesalahan sistem atau endpoint tidak ditemukan).\nURL: ${API_URL}/api/admin/broadcast`;
                            }

                            Alert.alert('Gagal Mengirim', errorMsg);
                        } finally {
                            setIsSending(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Broadcast Telegram</Text>
                    <Text style={styles.headerSub}>Kirim pengumuman massal</Text>
                </View>
                <View style={styles.iconBox}>
                    <Megaphone size={24} color={colors.primary} />
                </View>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.card}>
                        <Text style={styles.label}>TARGET PENERIMA</Text>
                        <View style={styles.targetRow}>
                            {[
                                { id: 'all', label: 'Semua' },
                                { id: 'students', label: 'Siswa' },
                                { id: 'teachers', label: 'Guru' }
                            ].map((t) => (
                                <TouchableOpacity 
                                    key={t.id}
                                    style={[styles.targetBtn, target === t.id && styles.targetBtnActive]}
                                    onPress={() => setTarget(t.id as any)}
                                >
                                    <Text style={[styles.targetText, target === t.id && styles.targetTextActive]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.label, { marginTop: 20 }]}>PESAN BROADCAST</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Tulis pengumuman di sini..."
                            placeholderTextColor={colors.textSub}
                            multiline
                            numberOfLines={10}
                            textAlignVertical="top"
                            value={message}
                            onChangeText={setMessage}
                        />

                        <View style={styles.infoBox}>
                            <Info size={18} color={colors.primary} />
                            <Text style={styles.infoText}>
                                Gunakan fitur ini dengan bijak. Pesan akan langsung muncul di bot Telegram siswa dan guru.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.sendBtn, !message.trim() && { opacity: 0.6 }]} 
                        onPress={handleSend}
                        disabled={isSending || !message.trim()}
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Send size={20} color="#fff" />
                                <Text style={styles.sendText}>Kirim Sekarang</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.warningBox}>
                        <AlertCircle size={18} color={colors.danger} />
                        <Text style={styles.warningText}>
                            Tindakan ini tidak dapat dibatalkan setelah tombol kirim ditekan.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 20,
        backgroundColor: colors.card,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.text,
    },
    headerSub: {
        fontSize: 12,
        color: colors.textSub,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        gap: 20,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 1,
    },
    label: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.text,
        letterSpacing: 1,
        marginBottom: 12,
    },
    input: {
        backgroundColor: colors.bg,
        borderRadius: 16,
        padding: 16,
        fontSize: 14,
        color: colors.text,
        fontWeight: '600',
        minHeight: 200,
        borderWidth: 1,
        borderColor: colors.border,
    },
    infoBox: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        padding: 12,
        backgroundColor: colors.primary + '08',
        borderRadius: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: colors.textSub,
        fontWeight: '600',
        lineHeight: 18,
    },
    sendBtn: {
        height: 56,
        backgroundColor: colors.primary,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    sendText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#fff',
    },
    warningBox: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        opacity: 0.7,
    },
    warningText: {
        flex: 1,
        fontSize: 11,
        color: colors.danger,
        fontWeight: '700',
    },
    targetRow: {
        flexDirection: 'row',
        gap: 8,
    },
    targetBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    targetBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    targetText: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.textSub,
    },
    targetTextActive: {
        color: '#fff',
    }
});

