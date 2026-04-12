import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { RADIUS, SHADOW } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, MoreVertical, Edit2, Trash2, 
  UserSquare2, ChevronLeft, X, Save, 
  Mail, Shield, Key, Loader2, RotateCcw, Smartphone
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AdminTeachersScreen() {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://absensi-digital-i87xnkg8j-andikaarya0805s-projects.vercel.app';
    const router = useRouter();
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<any>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        nip: '',
        password: '',
        role: 'teacher'
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('teachers')
                .select('*')
                .order('full_name', { ascending: true });

            if (error) throw error;
            setTeachers(data || []);
        } catch (error: any) {
            Alert.alert('Error', 'Gagal memuat data guru: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.full_name || !formData.email) {
            Alert.alert('Peringatan', 'Nama dan Email wajib diisi');
            return;
        }

        setIsSaving(true);
        try {
            const payload: any = {
                full_name: formData.full_name,
                email: formData.email,
                nip: formData.nip,
                role: formData.role
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            if (editingTeacher) {
                const { error } = await supabase
                    .from('teachers')
                    .update(payload)
                    .eq('id', editingTeacher.id);
                if (error) throw error;
                Alert.alert('Sukses', 'Data guru berhasil diperbarui');
            } else {
                const { error } = await supabase
                    .from('teachers')
                    .insert([payload]);
                if (error) throw error;
                Alert.alert('Sukses', 'Guru berhasil ditambahkan');
            }

            setShowModal(false);
            fetchTeachers();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (teacher: any) => {
        Alert.alert(
            'Hapus Guru?',
            `Yakin ingin menghapus "${teacher.full_name}"?`,
            [
                { text: 'Batal', style: 'cancel' },
                { 
                    text: 'Hapus', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('teachers')
                                .delete()
                                .eq('id', teacher.id);
                            if (error) throw error;
                            fetchTeachers();
                        } catch (error: any) {
                            Alert.alert('Error', 'Gagal menghapus: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    const handleResetAction = async (teacher: any, action: 'reset_password' | 'reset_device_id') => {
        const actionTitle = action === 'reset_password' ? 'Reset Password' : 'Reset Device ID';
        const actionMsg = action === 'reset_password' 
            ? `Yakin ingin mereset password ${teacher.full_name} ke "123456"?`
            : `Yakin ingin menghapus Device ID ${teacher.full_name}? Ini akan membuat guru bisa login di HP baru.`;

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
                                    userId: teacher.id,
                                    type: 'teacher',
                                    action: action
                                })
                            });

                            const result = await response.json();
                            if (!response.ok) throw new Error(result.error || 'Gagal melakukan reset');

                            Alert.alert('Sukses', result.message);
                            fetchTeachers();
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    const openModal = (teacher: any = null) => {
        if (teacher) {
            setEditingTeacher(teacher);
            setFormData({
                full_name: teacher.full_name || '',
                email: teacher.email || '',
                nip: teacher.nip || '',
                password: '',
                role: teacher.role || 'teacher'
            });
        } else {
            setEditingTeacher(null);
            setFormData({ full_name: '', email: '', nip: '', password: '', role: 'teacher' });
        }
        setShowModal(true);
    };

    const filteredTeachers = teachers.filter(t =>
        t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.nip?.includes(searchTerm) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Manajemen Guru</Text>
                    <Text style={styles.headerSub}>Total {teachers.length} guru terdaftar</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, SHADOW.sm]}>
                <Search size={18} color={colors.textSub} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Cari guru (Nama, NIP, Email)..."
                    placeholderTextColor={colors.textSub}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>

            <ScrollView contentContainerStyle={styles.listContent}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher, idx) => (
                        <View key={teacher.id} style={styles.teacherCard}>
                            <View style={styles.cardMain}>
                                <View style={styles.avatarBox}>
                                    <UserSquare2 size={24} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.teacherName}>{teacher.full_name}</Text>
                                    <Text style={styles.teacherNip}>{teacher.nip || 'TIDAK ADA NIP'}</Text>
                                </View>
                                <View style={styles.actionRow}>
                                    <TouchableOpacity style={styles.iconAction} onPress={() => handleResetAction(teacher, 'reset_password')}>
                                        <Key size={16} color={colors.warning} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.iconAction} onPress={() => handleResetAction(teacher, 'reset_device_id')}>
                                        <Smartphone size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.iconAction} onPress={() => openModal(teacher)}>
                                        <Edit2 size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.iconAction} onPress={() => handleDelete(teacher)}>
                                        <Trash2 size={16} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.cardFooter}>
                                <View style={styles.footerInfo}>
                                    <Mail size={12} color={colors.textSub} />
                                    <Text style={styles.footerText}>{teacher.email}</Text>
                                </View>
                                <View style={[styles.roleBadge, { backgroundColor: teacher.role === 'admin' ? colors.warning + '15' : colors.primary + '15' }]}>
                                    <Shield size={10} color={teacher.role === 'admin' ? colors.warning : colors.primary} />
                                    <Text style={[styles.roleText, { color: teacher.role === 'admin' ? colors.warning : colors.primary }]}>
                                        {(teacher.role || 'teacher').toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Search size={48} color={colors.border} />
                        <Text style={styles.emptyText}>Data tidak ditemukan</Text>
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
                                <Text style={styles.modalTitle}>{editingTeacher ? 'Update Guru' : 'Tambah Guru'}</Text>
                                <Text style={styles.modalSubHeader}>Lengkapi profil & akun</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                                <X size={24} color={colors.textSub} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContent}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>NAMA LENGKAP</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Contoh: Budi Santoso, S.Pd."
                                    placeholderTextColor={colors.border}
                                    value={formData.full_name}
                                    onChangeText={(text) => setFormData({...formData, full_name: text})}
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>EMAIL (USER)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="email@sekolah.sch.id"
                                        placeholderTextColor={colors.border}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={formData.email}
                                        onChangeText={(text) => setFormData({...formData, email: text})}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                    <Text style={styles.inputLabel}>NIP</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="1987... (Opsional)"
                                        placeholderTextColor={colors.border}
                                        value={formData.nip}
                                        onChangeText={(text) => setFormData({...formData, nip: text})}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>PASSWORD {editingTeacher && '(Opsional)'}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="******"
                                    placeholderTextColor={colors.border}
                                    secureTextEntry
                                    value={formData.password}
                                    onChangeText={(text) => setFormData({...formData, password: text})}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>HAK AKSES (ROLE)</Text>
                                <View style={styles.roleSelector}>
                                    <TouchableOpacity 
                                      style={[styles.roleOption, formData.role === 'teacher' && styles.roleOptionActive]}
                                      onPress={() => setFormData({...formData, role: 'teacher'})}
                                    >
                                        <Text style={[styles.roleOptionText, formData.role === 'teacher' && styles.roleOptionTextActive]}>Teacher</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                      style={[styles.roleOption, formData.role === 'admin' && styles.roleOptionActive]}
                                      onPress={() => setFormData({...formData, role: 'admin'})}
                                    >
                                        <Text style={[styles.roleOptionText, formData.role === 'admin' && styles.roleOptionTextActive]}>Admin</Text>
                                    </TouchableOpacity>
                                </View>
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
        borderRadius: RADIUS.lg,
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
        borderRadius: RADIUS.lg,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOW.primary,
    },
    searchContainer: {
        margin: 24,
        marginBottom: 8,
        backgroundColor: colors.card,
        borderRadius: RADIUS.xl,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: colors.border,
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
    listContent: {
        padding: 24,
        paddingBottom: 40,
    },
    teacherCard: {
        backgroundColor: colors.card,
        borderRadius: RADIUS.xl,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
        ...SHADOW.sm,
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarBox: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.lg,
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    teacherName: {
        fontSize: 15,
        fontWeight: '900',
        color: colors.text,
    },
    teacherNip: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.textSub,
        marginTop: 2,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    iconAction: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.md,
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
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 11,
        color: colors.textSub,
        fontWeight: '600',
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.full,
    },
    roleText: {
        fontSize: 9,
        fontWeight: '900',
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
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
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
        borderRadius: RADIUS.lg,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    roleSelector: {
        flexDirection: 'row',
        gap: 12,
    },
    roleOption: {
        flex: 1,
        height: 50,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleOptionActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    roleOptionText: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.textSub,
    },
    roleOptionTextActive: {
        color: '#fff',
    },
    modalFooter: {
        padding: 24,
        flexDirection: 'row',
        gap: 12,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    cancelBtn: {
        flex: 1,
        height: 54,
        borderRadius: RADIUS.lg,
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
        borderRadius: RADIUS.lg,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        ...SHADOW.primary,
    },
    saveText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fff',
    },
});
