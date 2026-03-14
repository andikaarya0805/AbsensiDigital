import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, Edit2, Trash2, 
  Book, ChevronLeft, X, Save, 
  FileText
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AdminSubjectsScreen() {
    const router = useRouter();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setSubjects(data || []);
        } catch (error: any) {
            Alert.alert('Error', 'Gagal memuat data mapel: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            Alert.alert('Peringatan', 'Nama mata pelajaran wajib diisi');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name: formData.name
            };

            if (editingSubject) {
                const { error } = await supabase
                    .from('subjects')
                    .update(payload)
                    .eq('id', editingSubject.id);
                if (error) throw error;
                Alert.alert('Sukses', 'Mata pelajaran berhasil diperbarui');
            } else {
                const { error } = await supabase
                    .from('subjects')
                    .insert([payload]);
                if (error) throw error;
                Alert.alert('Sukses', 'Mata pelajaran berhasil ditambahkan');
            }

            setShowModal(false);
            fetchSubjects();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (subj: any) => {
        Alert.alert(
            'Hapus Mapel?',
            `Yakin ingin menghapus "${subj.name}"?`,
            [
                { text: 'Batal', style: 'cancel' },
                { 
                    text: 'Hapus', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('subjects')
                                .delete()
                                .eq('id', subj.id);
                            if (error) throw error;
                            fetchSubjects();
                        } catch (error: any) {
                            Alert.alert('Error', 'Gagal menghapus: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    const openModal = (subj: any = null) => {
        if (subj) {
            setEditingSubject(subj);
            setFormData({ name: subj.name });
        } else {
            setEditingSubject(null);
            setFormData({ name: '' });
        }
        setShowModal(true);
    };

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Mata Pelajaran</Text>
                    <Text style={styles.headerSub}>Daftar kurikulum aktif</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Toolbar */}
            <View style={styles.toolbar}>
                <View style={[styles.searchBox, SHADOW.sm]}>
                    <Search size={16} color={COLORS.textSub} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari mata pelajaran..."
                        placeholderTextColor={COLORS.textSub}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.listContent}>
                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
                ) : filteredSubjects.length > 0 ? (
                    <View style={styles.gridContainer}>
                        {filteredSubjects.map((subj) => (
                            <View key={subj.id} style={styles.subjectCard}>
                                <View style={styles.iconBox}>
                                    <Book size={20} color={COLORS.info} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.subjectName} numberOfLines={2}>{subj.name}</Text>
                                    <View style={styles.actionRow}>
                                        <TouchableOpacity onPress={() => openModal(subj)} style={styles.miniAction}>
                                            <Edit2 size={12} color={COLORS.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(subj)} style={styles.miniAction}>
                                            <Trash2 size={12} color={COLORS.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <FileText size={48} color={COLORS.border} />
                        <Text style={styles.emptyText}>Tidak ada mata pelajaran</Text>
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
                                <Text style={styles.modalTitle}>{editingSubject ? 'Update Mapel' : 'Tambah Mapel'}</Text>
                                <Text style={styles.modalSubHeader}>Manajemen Kurikulum</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                                <X size={24} color={COLORS.textSub} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formContent}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>NAMA MATA PELAJARAN</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Contoh: Matematika"
                                    placeholderTextColor={COLORS.border}
                                    value={formData.name}
                                    onChangeText={(text) => setFormData({...formData, name: text})}
                                    autoFocus
                                />
                            </View>
                        </View>

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
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOW.primary,
    },
    toolbar: {
        padding: 24,
        paddingBottom: 8,
    },
    searchBox: {
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.xl,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '600',
    },
    listContent: {
        padding: 24,
        paddingBottom: 40,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    subjectCard: {
        width: '48.2%',
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.xl,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOW.sm,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.info + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    subjectName: {
        fontSize: 14,
        fontWeight: '900',
        color: COLORS.text,
        height: 40,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        justifyContent: 'flex-end',
    },
    miniAction: {
        width: 28,
        height: 28,
        borderRadius: RADIUS.sm,
        backgroundColor: COLORS.bg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
        opacity: 0.5,
    },
    emptyText: {
        marginTop: 12,
        color: COLORS.textSub,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.bg,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
    },
    modalHeader: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.card,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.text,
    },
    modalSubHeader: {
        fontSize: 11,
        fontWeight: '800',
        color: COLORS.textSub,
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
    inputLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: COLORS.text,
        marginBottom: 8,
        letterSpacing: 1,
    },
    input: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.lg,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
    },
    modalFooter: {
        padding: 24,
        flexDirection: 'row',
        gap: 12,
        backgroundColor: COLORS.card,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    cancelBtn: {
        flex: 1,
        height: 54,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.textSub,
    },
    saveBtn: {
        flex: 2,
        height: 54,
        backgroundColor: COLORS.primary,
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
