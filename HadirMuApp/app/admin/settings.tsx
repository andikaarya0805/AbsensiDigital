import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';
import { ChevronLeft, MapPin, Save, Map, Crosshair, HelpCircle, Loader2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function AdminSettingsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    
    const [formData, setFormData] = useState({
        latitude: '',
        longitude: '',
        radius: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/admin/settings`);
            const result = await response.json();
            
            if (response.ok && result.data) {
                setFormData({
                    latitude: result.data.school_latitude.toString(),
                    longitude: result.data.school_longitude.toString(),
                    radius: result.data.geofence_radius.toString()
                });
            }
        } catch (error: any) {
            console.error('Fetch settings error:', error);
            Alert.alert('Error', 'Gagal memuat pengaturan sistem.');
        } finally {
            setLoading(false);
        }
    };

    const handleGetCurrentLocation = async () => {
        try {
            setIsLocating(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Izin Ditolak', 'Izinkan akses lokasi untuk mendapatkan koordinat saat ini.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setFormData({
                ...formData,
                latitude: location.coords.latitude.toString(),
                longitude: location.coords.longitude.toString()
            });
            Alert.alert('Sukses', 'Berhasil mendapatkan lokasi saat ini.');
        } catch (error: any) {
            Alert.alert('Error', 'Gagal mendapatkan lokasi: ' + error.message);
        } finally {
            setIsLocating(false);
        }
    };

    const handleSave = async () => {
        const { latitude, longitude, radius } = formData;
        
        if (!latitude || !longitude || !radius) {
            Alert.alert('Peringatan', 'Semua kolom wajib diisi!');
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schoolLatitude: parseFloat(latitude),
                    schoolLongitude: parseFloat(longitude),
                    geofenceRadius: parseInt(radius)
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Gagal menyimpan pengaturan');
            }

            Alert.alert('Sukses', 'Pengaturan sekolah berhasil diperbarui.');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Radius & Lokasi</Text>
                    <Text style={styles.headerSub}>Pengaturan Geofencing Sekolah</Text>
                </View>
                <View style={styles.iconBox}>
                    <MapPin size={24} color={COLORS.primary} />
                </View>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                           <Map size={18} color={COLORS.primary} />
                           <Text style={styles.cardTitle}>Koordinat Sekolah</Text>
                        </View>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>LATITUDE</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.latitude}
                                onChangeText={(text) => setFormData({...formData, latitude: text})}
                                keyboardType="numeric"
                                placeholder="-6.123456"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>LONGITUDE</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.longitude}
                                onChangeText={(text) => setFormData({...formData, longitude: text})}
                                keyboardType="numeric"
                                placeholder="106.123456"
                            />
                        </View>

                        <TouchableOpacity 
                            style={styles.locationBtn} 
                            onPress={handleGetCurrentLocation}
                            disabled={isLocating}
                        >
                            {isLocating ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Crosshair size={18} color={COLORS.primary} />}
                            <Text style={styles.locationBtnText}>Ambil Lokasi Saat Ini</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                           <MapPin size={18} color={COLORS.primary} />
                           <Text style={styles.cardTitle}>Radius Geofencing</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>RADIUS (METER)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.radius}
                                onChangeText={(text) => setFormData({...formData, radius: text})}
                                keyboardType="numeric"
                                placeholder="20"
                            />
                        </View>

                        <View style={styles.infoBox}>
                            <HelpCircle size={16} color={COLORS.textSub} />
                            <Text style={styles.infoText}>
                                Siswa harus berada dalam radius ini untuk melakukan absensi. Rekomendasi: 20-50 meter.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.saveBtn} 
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Save size={20} color="#fff" />
                                <Text style={styles.saveText}>Simpan Pengaturan</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 20,
        backgroundColor: COLORS.card,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.bg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.text,
    },
    headerSub: {
        fontSize: 12,
        color: COLORS.textSub,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        gap: 20,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.xl,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOW.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: COLORS.text,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 10,
        fontWeight: '900',
        color: COLORS.textSub,
        letterSpacing: 1,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.bg,
        borderRadius: RADIUS.lg,
        padding: 14,
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '700',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    locationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginTop: 8,
    },
    locationBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.primary,
    },
    infoBox: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 11,
        color: COLORS.textSub,
        fontWeight: '600',
        lineHeight: 16,
    },
    saveBtn: {
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.xl,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        ...SHADOW.primary,
        marginTop: 10,
        marginBottom: 40,
    },
    saveText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#fff',
    },
});
