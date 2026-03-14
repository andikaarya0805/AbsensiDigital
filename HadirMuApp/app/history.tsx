import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { 
  CalendarDays, Filter, Download, 
  Search, FileText, CheckCircle2, 
  XCircle, Clock, ChevronLeft,
  AlertCircle
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function HistoryScreen() {
    const router = useRouter();
    const [attendance, setAttendance] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('all');
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        checkUser();
        fetchClasses();
    }, []);

    useEffect(() => {
        fetchAttendance();
    }, [selectedDate, selectedClass]);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
            setUserRole(data?.role || 'student');
        }
    };

    const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('*').order('name');
        if (data) setClasses(data);
    };

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('attendance')
                .select(`
                    *,
                    students (
                        full_name,
                        nis,
                        class_id,
                        classes (name)
                    )
                `)
                .eq('date', selectedDate)
                .order('time', { ascending: true });

            const { data, error } = await query;
            if (error) throw error;

            if (data) {
                let filtered = data;
                if (selectedClass !== 'all') {
                    filtered = data.filter((record: any) => 
                        record.students?.classes?.id === selectedClass || 
                        record.students?.class_id === selectedClass
                    );
                }
                setAttendance(filtered);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        present: attendance.filter(a => a.status === 'present' || a.status === 'hadir').length,
        late: attendance.filter(a => a.status === 'late' || a.status === 'terlambat').length,
        absent: attendance.filter(a => a.status === 'absent' || a.status === 'alpha' || a.status === 'alfa').length,
        total: attendance.length
    };

    const handleExport = async () => {
        if (attendance.length === 0) {
            Alert.alert('Info', 'Tidak ada data untuk dieksport');
            return;
        }

        try {
            const header = 'Waktu,Nama Siswa,NIS,Kelas,Status\n';
            const rows = attendance.map(a => 
                `${a.time},${a.students?.full_name},${a.students?.nis},${a.students?.classes?.name || '-'},${a.status}`
            ).join('\n');
            const csvContent = header + rows;

            const filename = `Laporan_Presensi_${selectedDate}.csv`;
            const fileUri = (FileSystem.documentDirectory || FileSystem.cacheDirectory || "") + filename;

            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' as any });
            
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Sukses', `File disimpan di: ${fileUri}`);
            }
        } catch (error: any) {
            Alert.alert('Error', 'Gagal eksport data: ' + error.message);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Laporan Presensi</Text>
                    <Text style={styles.headerSub}>Rekapitulasi harian</Text>
                </View>
                <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
                    <Download size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Filters */}
                <View style={[styles.filterCard, SHADOW.sm]}>
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>TANGGAL</Text>
                        <View style={styles.inputWrapper}>
                            <CalendarDays size={16} color={COLORS.textSub} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={selectedDate}
                                onChangeText={setSelectedDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={COLORS.textSub}
                            />
                        </View>
                    </View>

                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>FILTER KELAS</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classScroll}>
                            <TouchableOpacity 
                                style={[styles.classChip, selectedClass === 'all' && styles.classChipActive]}
                                onPress={() => setSelectedClass('all')}
                            >
                                <Text style={[styles.classChipText, selectedClass === 'all' && styles.classChipActiveText]}>Semua</Text>
                            </TouchableOpacity>
                            {classes.map(c => (
                                <TouchableOpacity 
                                    key={c.id}
                                    style={[styles.classChip, selectedClass === c.id && styles.classChipActive]}
                                    onPress={() => setSelectedClass(c.id)}
                                >
                                    <Text style={[styles.classChipText, selectedClass === c.id && styles.classChipActiveText]}>{c.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statBox, { backgroundColor: COLORS.success + '10', borderColor: COLORS.success + '20' }]}>
                        <Text style={[styles.statLabel, { color: COLORS.success }]}>HADIR</Text>
                        <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.present}</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: COLORS.warning + '10', borderColor: COLORS.warning + '20' }]}>
                        <Text style={[styles.statLabel, { color: COLORS.warning }]}>TELAT</Text>
                        <Text style={[styles.statValue, { color: COLORS.warning }]}>{stats.late}</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: COLORS.danger + '10', borderColor: COLORS.danger + '20' }]}>
                        <Text style={[styles.statLabel, { color: COLORS.danger }]}>ABSEN</Text>
                        <Text style={[styles.statValue, { color: COLORS.danger }]}>{stats.absent}</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: COLORS.primary + '10', borderColor: COLORS.primary + '20' }]}>
                        <Text style={[styles.statLabel, { color: COLORS.primary }]}>TOTAL</Text>
                        <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.total}</Text>
                    </View>
                </View>

                {/* Table Header */}
                <View style={styles.tableHead}>
                    <Text style={[styles.headCol, { flex: 1.5 }]}>WAKTU / SISWA</Text>
                    <Text style={[styles.headCol, { flex: 1, textAlign: 'center' }]}>KELAS</Text>
                    <Text style={[styles.headCol, { flex: 1, textAlign: 'right' }]}>STATUS</Text>
                </View>

                {/* List */}
                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
                ) : attendance.length > 0 ? (
                    attendance.map((record) => (
                        <View key={record.id} style={styles.attendanceRow}>
                            <View style={{ flex: 1.5 }}>
                                <View style={styles.timeLabel}>
                                    <Clock size={10} color={COLORS.textSub} />
                                    <Text style={styles.timeText}>{record.time}</Text>
                                </View>
                                <Text style={styles.studentName} numberOfLines={1}>{record.students?.full_name}</Text>
                                <Text style={styles.studentNis}>{record.students?.nis}</Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <View style={styles.classBadge}>
                                    <Text style={styles.classBadgeText}>{record.students?.classes?.name || '-'}</Text>
                                </View>
                            </View>
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <View style={[
                                    styles.statusBadge, 
                                    (record.status === 'present' || record.status === 'hadir') ? styles.statusPresent :
                                    (record.status === 'late' || record.status === 'terlambat') ? styles.statusLate : 
                                    styles.statusAbsent
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        (record.status === 'present' || record.status === 'hadir') ? { color: COLORS.success } :
                                        (record.status === 'late' || record.status === 'terlambat') ? { color: COLORS.warning } :
                                        { color: COLORS.danger }
                                    ]}>
                                        {(record.status === 'present' || record.status === 'hadir') ? 'HADIR' :
                                         (record.status === 'late' || record.status === 'terlambat') ? 'TELAT' : 'ABSEN'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyBox}>
                        <FileText size={48} color={COLORS.border} />
                        <Text style={styles.emptyText}>Tidak ada data presensi</Text>
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
    exportBtn: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOW.sm,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    filterCard: {
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.xl,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 24,
    },
    filterGroup: {
        marginBottom: 16,
    },
    filterLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: COLORS.textSub,
        letterSpacing: 1,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bg,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '700',
    },
    classScroll: {
        gap: 8,
    },
    classChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    classChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    classChipText: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.textSub,
    },
    classChipActiveText: {
        color: '#fff',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
    },
    tableHead: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.card,
        borderTopLeftRadius: RADIUS.lg,
        borderTopRightRadius: RADIUS.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headCol: {
        fontSize: 10,
        fontWeight: '900',
        color: COLORS.textSub,
        letterSpacing: 1,
    },
    attendanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    timeLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    timeText: {
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.textSub,
    },
    studentName: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.text,
    },
    studentNis: {
        fontSize: 10,
        fontWeight: '900',
        color: COLORS.textSub,
        textTransform: 'uppercase',
    },
    classBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: COLORS.bg,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    classBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: COLORS.textSub,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: RADIUS.full,
    },
    statusPresent: {
        backgroundColor: COLORS.success + '15',
    },
    statusLate: {
        backgroundColor: COLORS.warning + '15',
    },
    statusAbsent: {
        backgroundColor: COLORS.danger + '15',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    emptyBox: {
        alignItems: 'center',
        paddingVertical: 60,
        opacity: 0.3,
    },
    emptyText: {
        marginTop: 12,
        fontWeight: '800',
        color: COLORS.textSub,
    },
});
