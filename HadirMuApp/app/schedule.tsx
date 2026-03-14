import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { 
  Calendar, Clock, BookOpen, Users, 
  ChevronLeft, LayoutDashboard, LogOut, Info
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface Schedule {
    id: string;
    class_name: string;
    subject: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
}

const DAYS = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const DAY_COLORS = [
    '',
    '#3B82F6', // Senin - Blue
    '#10B981', // Selasa - Emerald
    '#8B5CF6', // Rabu - Purple
    '#F59E0B', // Kamis - Orange
    '#EC4899', // Jumat - Pink
    '#06B6D4', // Sabtu - Cyan
    '#EF4444', // Minggu - Red
];

export default function ScheduleScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1);
    const [teacherProfile, setTeacherProfile] = useState<any>(null);

    useEffect(() => {
        if (!user) return;
        fetchSchedule();
    }, [user]);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            
            // Get teacher profile
            const { data: teacher, error: profileError } = await supabase
                .from('teachers')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (teacher) setTeacherProfile(teacher);

            // Get schedules (Teacher version from web)
            const { data, error } = await supabase
                .from('schedules')
                .select('*')
                .eq('teacher_id', user?.id)
                .order('day_of_week')
                .order('start_time');

            if (error) throw error;
            setSchedules(data || []);
        } catch (error: any) {
            console.error('Error fetching schedules:', error.message);
            Alert.alert('Error', 'Gagal memuat jadwal: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (time: string) => {
        return time.slice(0, 5);
    };

    const getTodaySchedule = () => {
        const today = new Date().getDay();
        return schedules.filter(s => s.day_of_week === (today === 0 ? 7 : today));
    };

    const filteredSchedules = selectedDay === 0
        ? schedules
        : schedules.filter(s => s.day_of_week === selectedDay);

    const todaySchedule = getTodaySchedule();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Memuat Jadwa Mengajar...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View>
                  <Text style={styles.headerTitle}>Jadwal Mengajar</Text>
                  <Text style={styles.headerSub}>Total {schedules.length} sesi per minggu</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Today's Special Card (Web Parity) */}
                {todaySchedule.length > 0 && (
                    <View style={styles.todayCard}>
                        <View style={styles.todayHeader}>
                            <Clock size={20} color="#FFFFFF" />
                            <Text style={styles.todayTitle}>Jadwal Hari Ini ({DAYS[new Date().getDay() || 7]})</Text>
                        </View>
                        <View style={styles.todayGrid}>
                            {todaySchedule.map(s => (
                                <View key={s.id} style={styles.todayItem}>
                                    <Text style={styles.todaySubject} numberOfLines={1}>{s.subject}</Text>
                                    <View style={styles.todayInfoRow}>
                                      <Text style={styles.todayClass}>{s.class_name}</Text>
                                      <Text style={styles.todayTime}>{formatTime(s.start_time)} - {formatTime(s.end_time)}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Day Filter */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.filterContainer}
                  style={styles.filterOuter}
                >
                    <TouchableOpacity 
                      style={[styles.filterBtn, selectedDay === 0 && styles.filterBtnActive]}
                      onPress={() => setSelectedDay(0)}
                    >
                        <Text style={[styles.filterText, selectedDay === 0 && styles.filterTextActive]}>Semua</Text>
                    </TouchableOpacity>
                    {[1, 2, 3, 4, 5].map(day => (
                        <TouchableOpacity 
                          key={day}
                          style={[styles.filterBtn, selectedDay === day && styles.filterBtnActive]}
                          onPress={() => setSelectedDay(day)}
                        >
                            <Text style={[styles.filterText, selectedDay === day && styles.filterTextActive]}>{DAYS[day]}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Schedule List */}
                <View style={styles.listContainer}>
                    {filteredSchedules.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Calendar size={48} color={COLORS.border} />
                            <Text style={styles.emptyText}>Tidak ada jadwal untuk hari ini</Text>
                        </View>
                    ) : (
                      filteredSchedules.map(s => (
                        <View key={s.id} style={[styles.card, { borderLeftColor: DAY_COLORS[s.day_of_week] }]}>
                          <View style={styles.cardHeader}>
                            <View>
                              <Text style={styles.cardSubject}>{s.subject}</Text>
                              <Text style={styles.cardClass}>{s.class_name}</Text>
                            </View>
                            <View style={[styles.cardIconBox, { backgroundColor: DAY_COLORS[s.day_of_week] + '15' }]}>
                              <BookOpen size={20} color={DAY_COLORS[s.day_of_week]} />
                            </View>
                          </View>
                          <View style={styles.cardFooter}>
                            <View style={styles.footerItem}>
                              <Clock size={14} color={COLORS.textSub} />
                              <Text style={styles.footerText}>{formatTime(s.start_time)} - {formatTime(s.end_time)}</Text>
                            </View>
                            <View style={styles.footerItem}>
                              <Calendar size={14} color={COLORS.textSub} />
                              <Text style={styles.footerText}>{DAYS[s.day_of_week]}</Text>
                            </View>
                          </View>
                        </View>
                      ))
                    )}
                </View>

                {/* Footer Tip */}
                <View style={styles.tipBox}>
                  <Info size={16} color={COLORS.primary} />
                  <Text style={styles.tipText}>Gunakan "Pilih dari jadwal" di Dashboard saat membuat QR presensi.</Text>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.bg,
    },
    loadingText: {
        marginTop: 12,
        color: COLORS.textSub,
        fontSize: 14,
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
    scrollContent: {
        padding: 24,
        paddingBottom: 80,
    },
    todayCard: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.xl,
        padding: 20,
        marginBottom: 24,
        ...SHADOW.primary,
    },
    todayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    todayTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    todayGrid: {
        gap: 12,
    },
    todayItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: RADIUS.lg,
        padding: 12,
    },
    todaySubject: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    todayInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    todayClass: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    todayTime: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    filterOuter: {
        marginBottom: 20,
    },
    filterContainer: {
        gap: 8,
        paddingRight: 24,
    },
    filterBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderBottomWidth: 2,
        borderColor: COLORS.border,
    },
    filterBtnActive: {
        backgroundColor: COLORS.text,
        borderColor: COLORS.text,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.textSub,
    },
    filterTextActive: {
        color: COLORS.card,
    },
    listContainer: {
        gap: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: COLORS.border,
    },
    emptyText: {
        marginTop: 12,
        color: COLORS.textSub,
        fontSize: 14,
        fontWeight: '600',
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.xl,
        padding: 20,
        borderWidth: 1,
        borderLeftWidth: 6,
        borderColor: COLORS.border,
        ...SHADOW.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    cardSubject: {
        fontSize: 16,
        fontWeight: '900',
        color: COLORS.text,
        marginBottom: 4,
    },
    cardClass: {
        fontSize: 13,
        color: COLORS.textSub,
        fontWeight: '600',
    },
    cardIconBox: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardFooter: {
        flexDirection: 'row',
        gap: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.bg,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.textSub,
        fontWeight: '700',
    },
    tipBox: {
      marginTop: 30,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: COLORS.primary + '08',
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.primary + '15',
    },
    tipText: {
      flex: 1,
      fontSize: 12,
      color: COLORS.primary,
      fontWeight: '600',
      lineHeight: 18,
    },
});
