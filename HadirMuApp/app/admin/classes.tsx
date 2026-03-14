import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, MoreVertical, Edit2, Trash2, 
  BookOpen, ChevronLeft, X, Save, 
  AlertCircle, Loader2
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AdminClassesScreen() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<string>('Semua');
    const [showModal, setShowModal] = useState(false);
    const [editingClass, setEditingClass] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', level: '10' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setClasses(data || []);
        } catch (error: any) {
            Alert.alert('Error', 'Gagal memuat data kelas: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            Alert.alert('Peringatan', 'Nama kelas wajib diisi');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name: formData.name,
                level: parseInt(formData.level)
            };

            if (editingClass) {
                const { error } = await supabase
                    .from('classes')
                    .update(payload)
                    .eq('id', editingClass.id);
                if (error) throw error;
                Alert.alert('Sukses', 'Data kelas berhasil diperbarui');
            } else {
                const { error } = await supabase
                    .from('classes')
                    .insert([payload]);
                if (error) throw error;
                Alert.alert('Sukses', 'Kelas berhasil ditambahkan');
            }

            setShowModal(false);
            fetchClasses();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (cls: any) => {
        Alert.alert(
            'Hapus Kelas?',
            `Yakin ingin menghapus kelas "${cls.name}"?`,
            [
                { text: 'Batal', style: 'cancel' },
                { 
                    text: 'Hapus', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('classes')
                                .delete()
                                .eq('id', cls.id);
                            if (error) throw error;
                            fetchClasses();
                        } catch (error: any) {
                            Alert.alert('Error', 'Gagal menghapus: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    const openModal = (cls: any = null) => {
        if (cls) {
            setEditingClass(cls);
            setFormData({ name: cls.name, level: cls.level.toString() });
        } else {
            setEditingClass(null);
            setFormData({ name: '', level: '10' });
        }
        setShowModal(true);
    };

    const filteredClasses = classes.filter(cls => {
        const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = selectedLevel === 'Semua' || cls.level.toString() === selectedLevel;
        return matchesSearch && matchesLevel;
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Manajemen Kelas</Text>
                    <Text style={styles.headerSub}>Total {classes.length} kelas terdaftar</Text>
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
                        placeholder="Cari nama kelas..."
                        placeholderTextColor={COLORS.textSub}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
                
                <View style={styles.filterRow}>
                    {['Semua', '10', '11', '12'].map(lv => (
                        <TouchableOpacity 
                          key={lv}
                          style={[styles.levelTab, selectedLevel === lv && styles.levelTabActive]}
                          onPress={() => setSelectedLevel(lv)}
                        >
                            <Text style={[styles.levelTabText, selectedLevel === lv && styles.levelTabTextActive]}>{lv === 'Semua' ? 'Semua' : `Level ${lv}`}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.listContent}>
                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
                ) : filteredClasses.length > 0 ? (
                    filteredClasses.map((cls, idx) => (
                        <View key={cls.id} style={styles.classCard}>
                            <View style={styles.cardMain}>
                                <View style={styles.iconBox}>
                                    <BookOpen size={24} color={COLORS.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.className}>{cls.name}</Text>
                                    <Text style={styles.classLevel}>Tingkat {cls.level}</Text>
                                </View>
                                <View style={styles.actionRow}>
                                    <TouchableOpacity style={styles.iconAction} onPress={() => openModal(cls)}>
                                        <Edit2 size={16} color={COLORS.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.iconAction} onPress={() => handleDelete(cls)}>
                                        <Trash2 size={16} color={COLORS.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.cardFooter}>
                                <View style={styles.statusRow}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusText}>AKTIF</Text>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <BookOpen size={48} color={COLORS.border} />
                        <Text style={styles.emptyText}>Tidak ada kelas yang ditemukan</Text>
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
                                <Text style={styles.modalTitle}>{editingClass ? 'Update Kelas' : 'Tambah Kelas'}</Text>
                                <Text style={styles.modalSubHeader}>Informasi Dasar Kelas</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                                <X size={24} color={COLORS.textSub} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContent}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>NAMA KELAS</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Contoh: XII RPL 1"
                                    placeholderTextColor={COLORS.border}
                                    value={formData.name}
                                    onChangeText={(text) => setFormData({...formData, name: text})}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>LEVEL (TINGKAT)</Text>
                                <View style={styles.roleSelector}>
                                    {['10', '11', '12'].map(lv => (
                                        <TouchableOpacity 
                                          key={lv}
                                          style={[styles.roleOption, formData.level === lv && styles.roleOptionActive]}
                                          onPress={() => setFormData({...formData, level: lv})}
                                        >
                                            <Text style={[styles.roleOptionText, formData.level === lv && styles.roleOptionTextActive]}>{lv}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.infoBox}>
                                <AlertCircle size={18} color={COLORS.primary} />
                                <Text style={styles.infoText}>
                                    Pastikan nama kelas unik untuk menghindari duplikasi data dalam sistem.
                                </Text>
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
        marginBottom: 16,
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
    filterRow: {
        flexDirection: 'row',
        gap: 8,
    },
    levelTab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelTabActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        ...SHADOW.primary,
    },
    levelTabText: {
        fontSize: 11,
        fontWeight: '900',
        color: COLORS.textSub,
    },
    levelTabTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 24,
        paddingBottom: 40,
    },
    classCard: {
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.xl,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOW.sm,
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    className: {
        fontSize: 15,
        fontWeight: '900',
        color: COLORS.text,
    },
    classLevel: {
        fontSize: 11,
        fontWeight: '800',
        color: COLORS.textSub,
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
        backgroundColor: COLORS.bg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardFooter: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.bg,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.success,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        color: COLORS.success,
        letterSpacing: 1,
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
        maxHeight: '80%',
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
    roleSelector: {
        flexDirection: 'row',
        gap: 12,
    },
    roleOption: {
        flex: 1,
        height: 50,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleOptionActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    roleOptionText: {
        fontSize: 14,
        fontWeight: '900',
        color: COLORS.textSub,
    },
    roleOptionTextActive: {
        color: '#fff',
    },
    infoBox: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        backgroundColor: COLORS.primary + '08',
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.primary + '15',
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.textSub,
        fontWeight: '600',
        lineHeight: 18,
    },
    modalFooter: {
        padding: 24,
        flexDirection: 'row',
        gap: 12,
        backgroundColor: COLORS.card,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
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
