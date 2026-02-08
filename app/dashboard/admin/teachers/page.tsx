'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit2,
    Trash2,
    UserSquare2,
    ChevronLeft,
    ChevronRight,
    X,
    Save,
    Loader2,
    Mail,
    Shield,
    Key
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function TeachersPage() {
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

    const supabase = createClient();
    const { showToast } = useToast();

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) {
            showToast('Gagal mengambil data guru', 'error');
        } else {
            setTeachers(data || []);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const payload: any = {
            full_name: formData.full_name,
            email: formData.email,
            nip: formData.nip,
            role: formData.role
        };

        // Only include password if it's new or being changed
        if (formData.password) {
            payload.password = formData.password;
        }

        let error;
        if (editingTeacher) {
            const { error: updateError } = await supabase
                .from('teachers')
                .update(payload)
                .eq('id', editingTeacher.id);
            error = updateError;
        } else {
            // Check if teacher with same email/nip exists or let DB handle it
            const { error: insertError } = await supabase
                .from('teachers')
                .insert([payload]);
            error = insertError;
        }

        if (error) {
            showToast(error.message, 'error');
        } else {
            showToast(`Guru berhasil ${editingTeacher ? 'diupdate' : 'ditambahkan'}`, 'success');
            setShowModal(false);
            setEditingTeacher(null);
            setFormData({ full_name: '', email: '', nip: '', password: '', role: 'teacher' });
            fetchTeachers();
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus guru ini?')) return;

        const { error } = await supabase
            .from('teachers')
            .delete()
            .eq('id', id);

        if (error) {
            showToast('Gagal menghapus guru', 'error');
        } else {
            showToast('Guru berhasil dihapus', 'success');
            fetchTeachers();
        }
    };

    const openModal = (teacher: any = null) => {
        if (teacher) {
            setEditingTeacher(teacher);
            setFormData({
                full_name: teacher.full_name || '',
                email: teacher.email || '',
                nip: teacher.nip || '',
                password: '', // Don't show password
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
        <div className="space-y-8 py-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Manajemen Guru</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Total {teachers.length} guru & staf terdaftar.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold text-sm tracking-tight hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100"
                >
                    <Plus className="h-5 w-5" />
                    Tambah Guru
                </button>
            </div>

            {/* Content Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-6 md:p-8 border-b border-slate-50 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari guru (Nama, NIP, Email)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:text-slate-200"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white dark:bg-slate-900">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-800">Nama & NIP</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">Kontak</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">Role</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 text-right">Aksi</th>
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
                            ) : filteredTeachers.length > 0 ? (
                                filteredTeachers.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group border-b border-slate-50 dark:border-slate-800/50">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/50 group-hover:scale-110 transition-transform duration-300">
                                                    <UserSquare2 className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 tracking-tight text-base">{teacher.full_name}</p>
                                                    <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{teacher.nip || 'TIDAK ADA NIP'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium text-sm">
                                                    <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                                    {teacher.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${teacher.role === 'admin'
                                                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50'
                                                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50'}`}>
                                                <Shield className="h-3 w-3" />
                                                {teacher.role || 'teacher'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openModal(teacher)}
                                                    className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(teacher.id)}
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
                                            <Search className="h-12 w-12 text-slate-300" />
                                            <p className="text-slate-500 font-bold">Tidak ada data guru yang ditemukan.</p>
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
                                <h3 className="text-xl font-black text-black dark:text-white tracking-tight">{editingTeacher ? 'Update Guru' : 'Tambah Guru Baru'}</h3>
                                <p className="text-xs font-bold text-black dark:text-slate-400 uppercase tracking-[0.15em] mt-1">Lengkapi informasi profil & akun</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Budi Santoso, S.Pd."
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">Email (Username)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="email@sekolah.sch.id"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase tracking-widest ml-1">NIP</label>
                                <input
                                    type="text"
                                    placeholder="19870505..."
                                    value={formData.nip}
                                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                                    className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase tracking-widest ml-1">
                                    {editingTeacher ? 'Password Baru (Kosongkan jika tetap)' : 'Password Awal'}
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="password"
                                        required={!editingTeacher}
                                        placeholder="******"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase tracking-widest ml-1">Hak Akses (Role)</label>
                                <div className="relative">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="teacher">Guru (User)</option>
                                        <option value="admin">Administrator</option>
                                    </select>
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
                                    Simpan Data Guru
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
