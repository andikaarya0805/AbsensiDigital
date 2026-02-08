'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit2,
    Trash2,
    GraduationCap,
    ChevronLeft,
    ChevronRight,
    X,
    Save,
    Loader2,
    Mail,
    Hash,
    BookOpen,
    Key,
    Filter
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function StudentsPage() {
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
        password: '123456',
        recovery_email: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const supabase = createClient();
    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        // Fetch Classes first for the dropdowns
        const { data: classesData } = await supabase
            .from('classes')
            .select('*')
            .order('name');
        setClasses(classesData || []);

        // Fetch Students with Class info
        const { data: studentsData, error } = await supabase
            .from('students')
            .select('*, classes(name)')
            .eq('role', 'student')
            .order('full_name', { ascending: true });

        if (error) {
            showToast('Gagal mengambil data siswa', 'error');
        } else {
            setStudents(studentsData || []);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const payload: any = {
            full_name: formData.full_name,
            nis: formData.nis,
            class_id: formData.class_id || null,
            password: formData.password,
            recovery_email: formData.recovery_email || null,
            role: 'student'
        };

        let error;
        if (editingStudent) {
            const { error: updateError } = await supabase
                .from('students')
                .update(payload)
                .eq('id', editingStudent.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('students')
                .insert([payload]);
            error = insertError;
        }

        if (error) {
            showToast(error.message, 'error');
        } else {
            showToast(`Siswa berhasil ${editingStudent ? 'diupdate' : 'ditambahkan'}`, 'success');
            setShowModal(false);
            setEditingStudent(null);
            setFormData({ full_name: '', nis: '', class_id: '', password: '123456', recovery_email: '' });
            fetchData();
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus siswa ini?')) return;

        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);

        if (error) {
            showToast('Gagal menghapus siswa', 'error');
        } else {
            showToast('Siswa berhasil dihapus', 'success');
            fetchData();
        }
    };

    const openModal = (student: any = null) => {
        if (student) {
            setEditingStudent(student);
            setFormData({
                full_name: student.full_name || '',
                nis: student.nis || '',
                class_id: student.class_id || '',
                password: student.password || '123456',
                recovery_email: student.recovery_email || ''
            });
        } else {
            setEditingStudent(null);
            setFormData({
                full_name: '',
                nis: '',
                class_id: classes.length > 0 ? classes[0].id : '',
                password: '123456',
                recovery_email: ''
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
        <div className="space-y-8 py-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Manajemen Siswa</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Total {students.length} siswa aktif dalam sistem.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold text-sm tracking-tight hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100"
                >
                    <Plus className="h-5 w-5" />
                    Tambah Siswa
                </button>
            </div>

            {/* Content Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                {/* Toolbar */}
                <div className="p-6 md:p-8 border-b border-slate-50 dark:border-slate-800/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari siswa (Nama atau NIS)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:text-slate-200"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Filter className="h-4 w-4 text-slate-400" />
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">Semua Kelas</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white dark:bg-slate-900 transition-colors">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-800">Siswa</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-800">NIS</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-800">Kelas</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-800 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-8 py-6">
                                            <div className="h-4 bg-slate-100 rounded-md w-3/4"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-100/50 dark:border-emerald-900/50 group-hover:scale-110 transition-transform duration-300">
                                                    <GraduationCap className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white tracking-tight text-base">{student.full_name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-widest">{student.recovery_email || 'No email'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Hash className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                                                <span className="font-mono text-sm font-bold text-slate-600 dark:text-slate-400">{student.nis}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100/50 dark:border-blue-900/50">
                                                <BookOpen className="h-3 w-3" />
                                                {student.classes?.name || 'BELUM ADA KELAS'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openModal(student)}
                                                    className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student.id)}
                                                    className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="group-hover:hidden">
                                                <MoreHorizontal className="h-5 w-5 text-slate-300 dark:text-slate-600 ml-auto" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 scale-90 opacity-40">
                                            <GraduationCap className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                                            <p className="text-slate-500 dark:text-slate-400 font-bold">Tidak ada data siswa yang ditemukan.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                            <div>
                                <h3 className="text-xl font-black text-black dark:text-white tracking-tight">{editingStudent ? 'Update Siswa' : 'Tambah Siswa Baru'}</h3>
                                <p className="text-xs font-bold text-black dark:text-slate-400 uppercase tracking-[0.15em] mt-1">Lengkapi informasi akademik siswa</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 dark:text-slate-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">Nama Lengkap Siswa</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Andi Wijaya"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">NIS (Username)</label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="12..."
                                        value={formData.nis}
                                        onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">Password Login (Default: 123456)</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">Pilih Kelas</label>
                                <div className="relative">
                                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <select
                                        required
                                        value={formData.class_id}
                                        onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="">-- Pilih Kelas --</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">Email Pemulihan (Optional)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="email"
                                        placeholder="siswa@gmail.com"
                                        value={formData.recovery_email}
                                        onChange={(e) => setFormData({ ...formData, recovery_email: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 md:col-span-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-bold text-sm tracking-tight hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold text-sm tracking-tight hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    Simpan Data Siswa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
