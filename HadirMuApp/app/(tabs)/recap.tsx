import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Calendar as CalIcon, Clock, BookOpen, ChevronRight, LayoutGrid } from 'lucide-react-native';

const { width } = Dimensions.get('window');
interface DayColor {
  bg: string;
  text: string;
  border: string;
}

const DAYS = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const DAY_COLORS: (DayColor | string)[] = [
  '',
  { bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE' }, // Senin
  { bg: '#ECFDF5', text: '#047857', border: '#D1FAE5' }, // Selasa
  { bg: '#F5F3FF', text: '#6D28D9', border: '#EDE9FE' }, // Rabu
  { bg: '#FFF7ED', text: '#C2410C', border: '#FFEDD5' }, // Kamis
  { bg: '#FDF2F8', text: '#BE185D', border: '#FCE7F3' }, // Jumat
  { bg: '#ECFEFF', text: '#0E7490', border: '#CFFAFE' }, // Sabtu
  { bg: '#FEF2F2', text: '#B91C1C', border: '#FEE2E2' }, // Minggu
];

interface Schedule {
  id: string;
  class_name: string;
  subject: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1);

  useEffect(() => {
    fetchSchedules();
  }, [user]);

  const fetchSchedules = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('teacher_id', user.id)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setSchedules(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = selectedDay === 0
    ? schedules
    : schedules.filter(s => s.day_of_week === selectedDay);

  const formatTime = (time: string) => time?.slice(0, 5) || '00:00';

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Jadwal Mengajar</Text>
        <Text style={styles.subtitle}>
          {schedules.length} Sesi Terjadwal • <Text style={{ color: COLORS.primary }}>Minggu ini</Text>
        </Text>
      </View>

      {/* Day Filter Chips */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.chip, selectedDay === 0 && styles.activeChip]} 
            onPress={() => setSelectedDay(0)}
          >
            <Text style={[styles.chipText, selectedDay === 0 && styles.activeChipText]}>Semua</Text>
          </TouchableOpacity>
          {[1, 2, 3, 4, 5].map(day => (
            <TouchableOpacity 
              key={day} 
              style={[styles.chip, selectedDay === day && styles.activeChip]} 
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.chipText, selectedDay === day && styles.activeChipText]}>{DAYS[day]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredSchedules.length > 0 ? (
          filteredSchedules.map((s, idx) => {
            const colors = (DAY_COLORS[s.day_of_week] || DAY_COLORS[1]) as DayColor;
            return (
              <View key={idx} style={[styles.scheduleCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.subjectBox}>
                    <Text style={[styles.subjectName, { color: colors.text }]}>{s.subject}</Text>
                    <Text style={[styles.className, { color: colors.text, opacity: 0.7 }]}>{s.class_name}</Text>
                  </View>
                  <View style={[styles.dayBadge, { backgroundColor: colors.text + '20' }]}>
                    <Text style={[styles.dayText, { color: colors.text }]}>{DAYS[s.day_of_week]}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.cardFooter}>
                  <View style={styles.timeRow}>
                    <Clock size={14} color={colors.text} />
                    <Text style={[styles.timeText, { color: colors.text }]}>
                      {formatTime(s.start_time)} - {formatTime(s.end_time)}
                    </Text>
                  </View>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.text }]}>
                    <ChevronRight size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
             <CalIcon size={64} color={COLORS.border} />
             <Text style={styles.emptyTitle}>Tidak Ada Jadwal</Text>
             <Text style={styles.emptySub}>Belum ada sesi mengajar untuk hari {DAYS[selectedDay]}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: COLORS.card,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSub,
    marginTop: 4,
    fontWeight: '600',
  },
  filterWrapper: {
    backgroundColor: COLORS.card,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSub,
  },
  activeChipText: {
    color: '#fff',
  },
  content: {
    padding: 24,
  },
  scheduleCard: {
    borderRadius: RADIUS.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    ...SHADOW.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subjectBox: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '900',
  },
  className: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 20,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSub,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  }
});
