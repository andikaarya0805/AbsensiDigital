import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, MoreVertical, Edit2, Trash2, 
  GraduationCap, ChevronLeft, X, Save, 
  Mail, BookOpen, Key, Loader2, Hash, Filter,
  RotateCcw, Smartphone
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';

export default function AdminStudentsScreen() {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://absensi-digital-i87xnkg8j-andikaarya0805s-projects.vercel.app';
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        nis: '',
        class_id: '',
        password: '123456'
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch Classes
            const { data: classesData } = await supabase
                .from('classes')
                .select('*')
                .order('name');
            setClasses(classesData || []);

            // 2. Fetch Students (Web Parity Logic)
            const { data: studentsData, error } = await supabase
                .from('students')
                .select('*, classes(name)')
                .eq('role', 'student')
                .order('full_name', { ascending: true });

            if (error) throw error;
            setStudents(studentsData || []);
        } catch (error: any) {
            Alert.alert('Error', 'Gagal memuat data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.full_name || !formData.nis || !formData.class_id) {
            Alert.alert('Peringatan', 'Nama, NIS, dan Kelas wajib diisi');
            return;
        }

        setIsSaving(true);
        try {
            const payload: any = {
                full_name: formData.full_name,
                nis: formData.nis,
                class_id: formData.class_id,
                password: formData.password,
                role: 'student'
            };

            if (editingStudent) {
                const { error } = await supabase
                    .from('students')
                    .update(payload)
                    .eq('id', editingStudent.id);
                if (error) throw error;
                Alert.alert('Sukses', 'Data siswa berhasil diperbarui');
            } else {
                // Generate UUID for new student to prevent null id constraint error
                payload.id = Crypto.randomUUID();
                
                const { error } = await supabase
                    .from('students')
                    .insert([payload]);
                if (error) throw error;
                Alert.alert('Sukses', 'Siswa berhasil ditambahkan');
            }

            setShowModal(false);
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (student: any) => {
        Alert.alert(
            'Hapus Siswa?',
            `Yakin ingin menghapus "${student.full_name}"?`,
            [
                { text: 'Batal', style: 'cancel' },
                { 
                    text: 'Hapus', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('students')
                                .delete()
                                .eq('id', student.id);
                            if (error) throw error;
                            fetchData();
                        } catch (error: any) {
                            Alert.alert('Error', 'Gagal menghapus: ' + error.message);
                        }
                    }
                }
            ]
        );
    };
    
    const handleResetAction = async (student: any, action: 'reset_password' | 'reset_device_id') => {
        const actionTitle = action === 'reset_password' ? 'Reset Password' : 'Reset Device ID';
        const actionMsg = action === 'reset_password' 
            ? `Yakin ingin mereset password ${student.full_name} ke "123456"?`
            : `Yakin ingin menghapus Device ID ${student.full_name}? Ini akan membuat siswa bisa login di HP baru.`;

        Alert.alert(
            actionTitle,
            actionMsg,
            [
                { text: 'Batal', style: 'cancel' },
                { 
                    text: 'Reset', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_URL}/api/admin/users/reset`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    userId: student.id,
                                    type: 'student',
                                    action: action
                                })
                            });

                            const text = await response.text();
                            let result;
                            try {
                                result = JSON.parse(text);
                            } catch (e) {
                                throw new Error(`Server returned invalid response (Status: ${response.status})`);
                            }

                            if (!response.ok) throw new Error(result.error || result.details || 'Gagal melakukan reset');

                            Alert.alert('Sukses', result.message);
                            fetchData();
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    const openModal = (student: any = null) => {
        if (student) {
            setEditingStudent(student);
            setFormData({
                full_name: student.full_name || '',
                nis: student.nis || '',
                class_id: student.class_id || '',
                password: student.password || '123456'
            });
        } else {
            setEditingStudent(null);
            setFormData({
                full_name: '',
                nis: '',
                class_id: classes.length > 0 ? classes[0].id : '',
                password: '123456'
            });
        }
        setShowModal(true);
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis?.includes(searchTerm);
        const matchesClass = selectedClassId === 'all' || s.class_id === selectedClassId;
        return matchesSearch && matchesClass;
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Manajemen Siswa</Text>
                    <Text style={styles.headerSub}>Total {students.length} siswa aktif</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Toolbar (Search & Filter) */}
            <View style={styles.toolbar}>
                <View style={styles.searchBox}>
                    <Search size={16} color={colors.textSub} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari siswa (Nama/NIS)..."
                        placeholderTextColor={colors.textSub}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
                
                <View style={styles.filterRow}>
                   <Filter size={14} color={colors.textSub} />
                   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classFilter}>
                        <TouchableOpacity 
                          style={[styles.classTab, selectedClassId === 'all' && styles.classTabActive]}
                          onPress={() => setSelectedClassId('all')}
                        >
                            <Text style={[styles.classTabText, selectedClassId === 'all' && styles.classTabTextActive]}>Semua</Text>
                        </TouchableOpacity>
                        {classes.map(cls => (
                            <TouchableOpacity 
                              key={cls.id}
                              style={[styles.classTab, selectedClassId === cls.id && styles.classTabActive]}
                              onPress={() => setSelectedClassId(cls.id)}
                            >
                                <Text style={[styles.classTabText, selectedClassId === cls.id && styles.classTabTextActive]}>{cls.name}</Text>
                            </TouchableOpacity>
                        ))}
                   </ScrollView>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.listContent}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student, idx) => (
                        <View key={student.id} style={styles.studentCard}>
                            <View style={styles.cardMain}>
                                <View style={styles.avatarBox}>
                                    <GraduationCap size={24} color={colors.success} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.studentName}>{student.full_name}</Text>
                                    <View style={styles.metaRow}>
                                        <Hash size={10} color={colors.textSub} />
                                        <Text style={styles.studentNis}>{student.nis}</Text>
                                        <Text style={styles.metaDivider}>•</Text>
                                        <BookOpen size={10} color={colors.textSub} />
                                        <Text style={styles.studentClass}>{student.classes?.name || 'No Class'}</Text>
                                    </View>
                                </View>
                                <View style={styles.actionRow}>
                                    <TouchableOpacity style={styles.iconAction} onPress={() => handleResetAction(student, 'reset_password')}>
                                        <Key size={16} color={colors.warning} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.iconAction} onPress={() => handleResetAction(student, 'reset_device_id')}>
                                        <Smartphone size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.iconAction} onPress={() => openModal(student)}>
                                        <Edit2 size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.iconAction} onPress={() => handleDelete(student)}>
                                        <Trash2 size={16} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <GraduationCap size={48} color={colors.border} />
                        <Text style={styles.emptyText}>Tidak ada siswa yang ditemukan</Text>
                    </View>
                )}
            </ScrollView>

            {/* Form Modal */}
            <Modal visible={showModal} animationType="slide" transparent={true}>
                <KeyboardAvoidingView 
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                  style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{editingStudent ? 'Update Siswa' : 'Tambah Siswa'}</Text>
                                <Text style={styles.modalSubHeader}>Lengkapi data akademik</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                                <X size={24} color={colors.textSub} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContent}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>NAMA LENGKAP SISWA</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Contoh: Andi Wijaya"
                                    placeholderTextColor={colors.textSub}
                                    value={formData.full_name}
                                    onChangeText={(text) => setFormData({...formData, full_name: text})}
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>NIS (USERNAME)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="12..."
                                        placeholderTextColor={colors.textSub}
                                        value={formData.nis}
                                        onChangeText={(text) => setFormData({...formData, nis: text})}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                    <Text style={styles.inputLabel}>KELAS</Text>
                                    <View style={styles.selectWrapper}>
                                        <TextInput
                                            style={[styles.input, { opacity: 0.5 }]}
                                            editable={false}
                                            value={classes.find(c => c.id === formData.class_id)?.name || 'Pilih...'}
                                        />
                                        <ScrollView style={styles.miniPicker}>
                                            {classes.map(c => (
                                                <TouchableOpacity 
                                                  key={c.id} 
                                                  onPress={() => setFormData({...formData, class_id: c.id})}
                                                  style={[styles.pickerItem, formData.class_id === c.id && { backgroundColor: colors.primary + '10' }]}
                                                >
                                                    <Text style={[styles.pickerText, formData.class_id === c.id && { color: colors.primary }]}>{c.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>PASSWORD LOGIN (DEFAULT: 123456)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="******"
                                    placeholderTextColor={colors.textSub}
                                    secureTextEntry
                                    value={formData.password}
                                    onChangeText={(text) => setFormData({...formData, password: text})}
                                />
                            </View>

                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Save size={18} color="#fff" />
                                        <Text style={styles.saveText}>Simpan</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
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
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    toolbar: {
        padding: 24,
        paddingBottom: 8,
    },
    searchBox: {
        backgroundColor: colors.card,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 1,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 14,
        color: colors.text,
        fontWeight: '600',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    classFilter: {
        gap: 8,
        paddingRight: 20,
    },
    classTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    classTabActive: {
        backgroundColor: colors.text,
        borderColor: colors.text,
    },
    classTabText: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.textSub,
    },
    classTabTextActive: {
        color: colors.card,
    },
    listContent: {
        padding: 24,
        paddingBottom: 40,
    },
    studentCard: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 1,
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.success + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    studentName: {
        fontSize: 15,
        fontWeight: '900',
        color: colors.text,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    studentNis: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textSub,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    metaDivider: {
        color: colors.border,
        fontSize: 10,
    },
    studentClass: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.primary,
        textTransform: 'uppercase',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    iconAction: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardFooter: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.bg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 11,
        color: colors.textSub,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
        opacity: 0.5,
    },
    emptyText: {
        marginTop: 12,
        color: colors.textSub,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.bg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.card,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.text,
    },
    modalSubHeader: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.textSub,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 2,
    },
    closeBtn: {
        padding: 4,
    },
    formContent: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.text,
        marginBottom: 8,
        letterSpacing: 1,
    },
    input: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    selectWrapper: {
        position: 'relative',
    },
    miniPicker: {
        maxHeight: 120,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        marginTop: 4,
    },
    pickerItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.bg,
    },
    pickerText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text,
    },
    modalFooter: {
        padding: 24,
        flexDirection: 'row',
        gap: 12,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    cancelBtn: {
        flex: 1,
        height: 54,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.textSub,
    },
    saveBtn: {
        flex: 2,
        height: 54,
        backgroundColor: colors.primary,
        borderRadius: 12,
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
    saveText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fff',
    },
});

