import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, MoreVertical, Edit2, Trash2, 
  BookOpen, ChevronLeft, X, Save, 
  AlertCircle
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AdminClassesScreen() {
    const { colors } = useTheme();
    const styles = createStyles(colors);
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
                    <ChevronLeft size={24} color={colors.text} />
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
                <View style={styles.searchBox}>
                    <Search size={16} color={colors.textSub} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari nama kelas..."
                        placeholderTextColor={colors.textSub}
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
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : filteredClasses.length > 0 ? (
                    filteredClasses.map((cls, idx) => (
                        <View key={cls.id} style={styles.classCard}>
                            <View style={styles.cardMain}>
                                <View style={styles.iconBox}>
                                    <BookOpen size={24} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.className}>{cls.name}</Text>
                                    <Text style={styles.classLevel}>Tingkat {cls.level}</Text>
                                </View>
                                <View style={styles.actionRow}>
                                    <TouchableOpacity style={styles.iconAction} onPress={() => openModal(cls)}>
                                        <Edit2 size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.iconAction} onPress={() => handleDelete(cls)}>
                                        <Trash2 size={16} color={colors.danger} />
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
                        <BookOpen size={48} color={colors.border} />
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
                                <X size={24} color={colors.textSub} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContent}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>NAMA KELAS</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Contoh: XII RPL 1"
                                    placeholderTextColor={colors.textSub}
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
                                <AlertCircle size={18} color={colors.primary} />
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
        gap: 8,
    },
    levelTab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelTabActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    levelTabText: {
        fontSize: 11,
        fontWeight: '900',
        color: colors.textSub,
    },
    levelTabTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 24,
        paddingBottom: 40,
    },
    classCard: {
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
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    className: {
        fontSize: 15,
        fontWeight: '900',
        color: colors.text,
    },
    classLevel: {
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
        backgroundColor: colors.success,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.success,
        letterSpacing: 1,
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
        maxHeight: '80%',
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
    roleSelector: {
        flexDirection: 'row',
        gap: 12,
    },
    roleOption: {
        flex: 1,
        height: 50,
        borderRadius: 12,
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
    infoBox: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        backgroundColor: colors.primary + '08',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.primary + '15',
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: colors.textSub,
        fontWeight: '600',
        lineHeight: 18,
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

