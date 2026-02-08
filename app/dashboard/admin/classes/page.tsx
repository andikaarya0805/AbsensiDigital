'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit2,
    Trash2,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    X,
    Save,
    Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function ClassesPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingClass, setEditingClass] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', level: '10' });
    const [isSaving, setIsSaving] = useState(false);

    const supabase = createClient();
    const { showToast } = useToast();

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            showToast('Gagal mengambil data kelas', 'error');
        } else {
            setClasses(data || []);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const payload = {
            name: formData.name,
            level: parseInt(formData.level)
        };

        let error;
        if (editingClass) {
            const { error: updateError } = await supabase
                .from('classes')
                .update(payload)
                .eq('id', editingClass.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('classes')
                .insert([payload]);
            error = insertError;
        }

        if (error) {
            showToast(error.message, 'error');
        } else {
            showToast(`Kelas berhasil ${editingClass ? 'diupdate' : 'ditambahkan'}`, 'success');
            setShowModal(false);
            setEditingClass(null);
            setFormData({ name: '', level: '10' });
            fetchClasses();
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return;

        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', id);

        if (error) {
            showToast('Gagal menghapus kelas', 'error');
        } else {
            showToast('Kelas berhasil dihapus', 'success');
            fetchClasses();
        }
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

    const filteredClasses = classes.filter(cls =>
        cls.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 py-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Manajemen Kelas</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Total {classes.length} kelas terdaftar dalam sistem.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold text-sm tracking-tight hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100"
                >
                    <Plus className="h-5 w-5" />
                    Tambah Kelas
                </button>
            </div>

            {/* Content Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                {/* Toolbar */}
                <div className="p-6 md:p-8 border-b border-slate-50 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama kelas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Filter Level:</span>
                        {['Semua', '10', '11', '12'].map(lv => (
                            <button key={lv} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${lv === 'Semua' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-600 hover:text-blue-600'}`}>
                                {lv}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white dark:bg-slate-900 transition-colors">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-800">Nama Kelas</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-800">Level</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-800">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-800 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-8 py-6">
                                            <div className="h-4 bg-slate-100 rounded-md w-3/4"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredClasses.length > 0 ? (
                                filteredClasses.map((cls) => (
                                    <tr key={cls.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border border-blue-100/50 dark:border-blue-900/50 group-hover:scale-110 transition-transform duration-300">
                                                    <BookOpen className="h-5 w-5" />
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base">{cls.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-black">
                                                LEVEL {cls.level}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Aktif</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openModal(cls)}
                                                    className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cls.id)}
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
                                            <p className="text-slate-500 font-bold">Tidak ada kelas yang ditemukan.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-6 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing {filteredClasses.length} results</p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 hover:border-blue-600 hover:text-blue-600 transition-all opacity-50 cursor-not-allowed">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button className="h-9 w-9 bg-blue-600 text-white rounded-xl text-xs font-black shadow-md shadow-blue-100 flex items-center justify-center">1</button>
                        <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 hover:border-blue-600 hover:text-blue-600 transition-all">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                            <div>
                                <h3 className="text-xl font-black text-black dark:text-white tracking-tight">{editingClass ? 'Update Kelas' : 'Tambah Kelas Baru'}</h3>
                                <p className="text-xs font-bold text-black dark:text-slate-400 uppercase tracking-[0.15em] mt-1">Lengkapi informasi kelas berikut</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 dark:text-slate-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">Nama Kelas</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: XII RPL 1"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">Level (Tingkat)</label>
                                <select
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                    className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value="10">Level 10</option>
                                    <option value="11">Level 11</option>
                                    <option value="12">Level 12</option>
                                </select>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl flex gap-4 border border-blue-100/50 dark:border-blue-900/30">
                                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 leading-relaxed">
                                    Pastikan nama kelas unik dan belum terdaftar sebelumnya untuk menghindari duplikasi data.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
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
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
