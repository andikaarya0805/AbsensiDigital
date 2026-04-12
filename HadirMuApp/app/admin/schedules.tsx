import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Alert, Modal, TextInput, Platform,
  KeyboardAvoidingView
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { 
  Plus, ChevronLeft, Clock, Calendar, 
  User, BookOpen, Trash2, Edit2, X, Save
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const DAYS = [
    { value: 1, label: 'Senin' },
    { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' },
    { value: 4, label: 'Kamis' },
    { value: 5, label: 'Jumat' },
    { value: 6, label: 'Sabtu' },
    { value: 7, label: 'Minggu' },
];

export default function AdminSchedulesScreen() {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const router = useRouter();

    const [schedules, setSchedules] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        teacher_id: '',
        class_id: '',
        subject_id: '',
        day_of_week: 1,
        start_time: '07:30',
        end_time: '09:00'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [
                { data: teachersData },
                { data: classesData },
                { data: subjectsData },
                { data: schedulesData }
            ] = await Promise.all([
                supabase.from('teachers').select('*').order('full_name'),
                supabase.from('classes').select('*').order('name'),
                supabase.from('subjects').select('*').order('name'),
                supabase.from('schedules').select('*, teachers(full_name), classes(name), subjects(name)').order('day_of_week').order('start_time')
            ]);

            setTeachers(teachersData || []);
            setClasses(classesData || []);
            setSubjects(subjectsData || []);
            setSchedules(schedulesData || []);
        } catch (error) {
            console.error('Fetch data error:', error);
            Alert.alert('Error', 'Gagal memuat data jadwal.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.teacher_id || !formData.class_id || !formData.subject_id) {
            Alert.alert('Peringatan', 'Mohon lengkapi semua data!');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                teacher_id: formData.teacher_id,
                class_id: formData.class_id,
                subject_id: formData.subject_id,
                day_of_week: formData.day_of_week,
                start_time: formData.start_time,
                end_time: formData.end_time
            };

            let error;
            if (editingSchedule) {
                const { error: updateError } = await supabase
                    .from('schedules')
                    .update(payload)
                    .eq('id', editingSchedule.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('schedules')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            Alert.alert('Sukses', `Jadwal berhasil ${editingSchedule ? 'diupdate' : 'ditambahkan'}`);
            setShowModal(false);
            setEditingSchedule(null);
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Konfirmasi',
            'Apakah Anda yakin ingin menghapus jadwal ini?',
            [
                { text: 'Batal', style: 'cancel' },
                { 
                    text: 'Hapus', 
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase.from('schedules').delete().eq('id', id);
                        if (error) {
                            Alert.alert('Error', 'Gagal menghapus jadwal');
                        } else {
                            fetchData();
                        }
                    }
                }
            ]
        );
    };

    const openModal = (sch: any = null) => {
        if (sch) {
            setEditingSchedule(sch);
            setFormData({
                teacher_id: sch.teacher_id || '',
                class_id: sch.class_id || '',
                subject_id: sch.subject_id || '',
                day_of_week: sch.day_of_week || 1,
                start_time: sch.start_time?.slice(0, 5) || '07:30',
                end_time: sch.end_time?.slice(0, 5) || '09:00'
            });
        } else {
            setEditingSchedule(null);
            setFormData({
                teacher_id: teachers.length > 0 ? teachers[0].id : '',
                class_id: classes.length > 0 ? classes[0].id : '',
                subject_id: subjects.length > 0 ? subjects[0].id : '',
                day_of_week: 1,
                start_time: '07:30',
                end_time: '09:00'
            });
        }
        setShowModal(true);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Jadwal Pelajaran</Text>
                    <Text style={styles.subtitle}>Kelola alokasi waktu pengajar</Text>
                </View>
                <TouchableOpacity onPress={() => openModal()} style={styles.addBtn}>
                    <Plus size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                {DAYS.map((day) => {
                    const daySchedules = schedules.filter(s => s.day_of_week === day.value);
                    if (daySchedules.length === 0) return null;

                    return (
                        <View key={day.value} style={styles.daySection}>
                            <View style={styles.dayHeader}>
                                <View style={styles.dayIcon}>
                                    <Calendar size={14} color={colors.primary} />
                                </View>
                                <Text style={styles.dayLabel}>{day.label}</Text>
                                <View style={styles.line} />
                            </View>

                            {daySchedules.map((sch) => (
                                <View key={sch.id} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.timeBadge}>
                                            <Clock size={12} color={colors.primary} />
                                            <Text style={styles.timeText}>
                                                {sch.start_time?.slice(0, 5)} - {sch.end_time?.slice(0, 5)}
                                            </Text>
                                        </View>
                                        <View style={styles.actionGroup}>
                                            <TouchableOpacity onPress={() => openModal(sch)} style={styles.miniBtn}>
                                                <Edit2 size={16} color={colors.textSub} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDelete(sch.id)} style={styles.miniBtn}>
                                                <Trash2 size={16} color={colors.danger} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <Text style={styles.subjectName}>{sch.subjects?.name || sch.subject}</Text>
                                    
                                    <View style={styles.cardFooter}>
                                        <View style={styles.infoRow}>
                                            <View style={styles.avatar}>
                                                <Text style={styles.avatarText}>{sch.teachers?.full_name?.charAt(0)}</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.infoLabel}>PENGAJAR</Text>
                                                <Text style={styles.infoVal}>{sch.teachers?.full_name}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.classBadge}>
                                            <Text style={styles.classText}>{sch.classes?.name || sch.class_name}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    );
                })}

                {schedules.length === 0 && !loading && (
                    <View style={styles.emptyBox}>
                        <ActivityIndicator size="small" color={colors.textSub} style={{ marginBottom: 10 }} />
                        <Text style={styles.emptyText}>Belum ada jadwal yang diatur.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{editingSchedule ? 'Edit Jadwal' : 'Tambah Jadwal'}</Text>
                                <Text style={styles.modalSubtitle}>Atur waktu dan pengajar</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                           <View style={styles.inputGroup}>
                                <Text style={styles.label}>Guru</Text>
                                <View style={styles.pickerBox}>
                                    <User size={18} color={colors.textSub} style={styles.pickerIcon} />
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                                        {teachers.map(t => (
                                            <TouchableOpacity 
                                                key={t.id} 
                                                onPress={() => setFormData({...formData, teacher_id: t.id})}
                                                style={[styles.chip, formData.teacher_id === t.id && styles.chipActive]}
                                            >
                                                <Text style={[styles.chipText, formData.teacher_id === t.id && styles.chipTextActive]}>{t.full_name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                           </View>

                           <View style={styles.inputGroup}>
                                <Text style={styles.label}>Mata Pelajaran</Text>
                                <View style={styles.pickerBox}>
                                    <BookOpen size={18} color={colors.textSub} style={styles.pickerIcon} />
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                                        {subjects.map(s => (
                                            <TouchableOpacity 
                                                key={s.id} 
                                                onPress={() => setFormData({...formData, subject_id: s.id})}
                                                style={[styles.chip, formData.subject_id === s.id && styles.chipActive]}
                                            >
                                                <Text style={[styles.chipText, formData.subject_id === s.id && styles.chipTextActive]}>{s.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                           </View>

                           <View style={styles.inputGroup}>
                                <Text style={styles.label}>Kelas</Text>
                                <View style={styles.pickerBox}>
                                    <Save size={18} color={colors.textSub} style={styles.pickerIcon} />
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                                        {classes.map(c => (
                                            <TouchableOpacity 
                                                key={c.id} 
                                                onPress={() => setFormData({...formData, class_id: c.id})}
                                                style={[styles.chip, formData.class_id === c.id && styles.chipActive]}
                                            >
                                                <Text style={[styles.chipText, formData.class_id === c.id && styles.chipTextActive]}>{c.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                           </View>

                           <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.label}>Hari</Text>
                                    <View style={styles.pickerBox}>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                                            {DAYS.map(d => (
                                                <TouchableOpacity 
                                                    key={d.value} 
                                                    onPress={() => setFormData({...formData, day_of_week: d.value})}
                                                    style={[styles.chip, formData.day_of_week === d.value && styles.chipActive]}
                                                >
                                                    <Text style={[styles.chipText, formData.day_of_week === d.value && styles.chipTextActive]}>{d.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </View>
                           </View>

                           <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.label}>Mulai</Text>
                                    <TextInput 
                                        style={styles.input}
                                        value={formData.start_time}
                                        onChangeText={(t) => setFormData({...formData, start_time: t})}
                                        placeholder="07:30"
                                        placeholderTextColor={colors.textSub}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Selesai</Text>
                                    <TextInput 
                                        style={styles.input}
                                        value={formData.end_time}
                                        onChangeText={(t) => setFormData({...formData, end_time: t})}
                                        placeholder="09:00"
                                        placeholderTextColor={colors.textSub}
                                    />
                                </View>
                           </View>
                        </ScrollView>

                        <TouchableOpacity 
                            onPress={handleSave} 
                            style={styles.saveBtn}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Save size={20} color="#FFF" />
                                    <Text style={styles.saveBtnText}>Simpan Jadwal</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
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
        marginRight: 15,
        borderWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.text,
    },
    subtitle: {
        fontSize: 12,
        color: colors.textSub,
        fontWeight: '600',
    },
    addBtn: {
        marginLeft: 'auto',
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    daySection: {
        marginBottom: 30,
    },
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    dayIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    dayLabel: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.text,
        marginRight: 15,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bg,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    timeText: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.textSub,
        marginLeft: 5,
    },
    actionGroup: {
        flexDirection: 'row',
    },
    miniBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    subjectName: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: colors.border + '50',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.primary,
    },
    infoLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: colors.textSub,
        marginBottom: 2,
    },
    infoVal: {
        fontSize: 11,
        fontWeight: '900',
        color: colors.text,
    },
    classBadge: {
        backgroundColor: '#F59E0B20',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F59E0B40',
    },
    classText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#D97706',
    },
    emptyBox: {
        padding: 40,
        alignItems: 'center',
        opacity: 0.5,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSub,
        fontWeight: '500',
        fontStyle: 'italic',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.bg,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: '90%',
    },
    modalHeader: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.text,
    },
    modalSubtitle: {
        fontSize: 12,
        color: colors.textSub,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    closeBtn: {
        padding: 8,
    },
    modalBody: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.text,
        marginBottom: 10,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    pickerBox: {
        paddingVertical: 5,
    },
    chips: {
        flexDirection: 'row',
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: 8,
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSub,
    },
    chipTextActive: {
        color: '#FFF',
    },
    pickerIcon: {
        marginBottom: 10,
        marginLeft: 4,
    },
    row: {
        flexDirection: 'row',
    },
    input: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 15,
        color: colors.text,
        fontSize: 14,
        fontWeight: '700',
    },
    saveBtn: {
        margin: 24,
        backgroundColor: colors.primary,
        height: 60,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFF',
        marginLeft: 10,
    },
});
