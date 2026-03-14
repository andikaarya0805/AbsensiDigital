import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react-native';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    // Fetch riwayat (student/teacher adaptif)
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('*, classes(name)')
      .eq(user.role === 'student' ? 'student_id' : 'teacher_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (attendance) setData(attendance);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const renderItem = ({ item }: { item: any }) => {
    const date = new Date(item.timestamp);
    const day = date.toLocaleDateString('id-ID', { weekday: 'long' });
    const fullDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.item}>
        <View style={styles.itemDateRow}>
          <Text style={styles.itemDay}>{day}</Text>
          <Text style={styles.itemFullDate}>{fullDate}</Text>
        </View>
        <View style={styles.itemMain}>
          <View style={styles.itemIcon}>
            <CheckCircle2 color={COLORS.success} size={24} />
          </View>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>Hadir • {item.classes?.name || 'Umum'}</Text>
            <Text style={styles.itemInfo}>Terdaftar pada jam {time} WIB</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>VERIVIED</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <AlertCircle size={48} color={COLORS.textSub} />
              <Text style={styles.emptyText}>Belum ada riwayat kehadiran.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchData(); }}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 20,
  },
  item: {
    marginBottom: 24,
  },
  itemDateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    marginLeft: 4,
  },
  itemDay: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginRight: 10,
  },
  itemFullDate: {
    fontSize: 13,
    color: COLORS.textSub,
  },
  itemMain: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemInfo: {
    fontSize: 12,
    color: COLORS.textSub,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
    opacity: 0.5,
  },
  emptyText: {
    color: COLORS.textSub,
    marginTop: 16,
    fontSize: 14,
  }
});
