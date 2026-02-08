'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit2,
    Trash2,
    FileText,
    X,
    Save,
    Loader2,
    Book
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '' });
    const [isSaving, setIsSaving] = useState(false);

    const supabase = createClient();
    const { showToast } = useToast();

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            showToast('Gagal mengambil data mata pelajaran', 'error');
        } else {
            setSubjects(data || []);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const payload = {
            name: formData.name
        };

        let error;
        if (editingSubject) {
            const { error: updateError } = await supabase
                .from('subjects')
                .update(payload)
                .eq('id', editingSubject.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('subjects')
                .insert([payload]);
            error = insertError;
        }

        if (error) {
            showToast(error.message, 'error');
        } else {
            showToast(`Mata pelajaran berhasil ${editingSubject ? 'diupdate' : 'ditambahkan'}`, 'success');
            setShowModal(false);
            setEditingSubject(null);
            setFormData({ name: '' });
            fetchSubjects();
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) return;

        const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('id', id);

        if (error) {
            showToast('Gagal menghapus mata pelajaran', 'error');
        } else {
            showToast('Mata pelajaran berhasil dihapus', 'success');
            fetchSubjects();
        }
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
        <div className="space-y-8 py-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mata Pelajaran</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Daftar mata pelajaran yang tersedia di sistem.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold text-sm tracking-tight hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100"
                >
                    <Plus className="h-5 w-5" />
                    Tambah Mapel
                </button>
            </div>

            {/* Content Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px] transition-colors">
                {/* Toolbar */}
                <div className="p-6 md:p-8 border-b border-slate-50 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari mata pelajaran..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:text-white"
                        />
                    </div>
                </div>

                {/* Grid View for Subjects (looks cleaner for simple names) */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="h-24 bg-slate-50 dark:bg-slate-800/50 animate-pulse rounded-[24px]"></div>
                        ))
                    ) : filteredSubjects.length > 0 ? (
                        filteredSubjects.map((subj) => (
                            <div key={subj.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[28px] hover:shadow-xl dark:hover:shadow-indigo-900/10 hover:shadow-slate-200/40 transition-all duration-300 group flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/50 group-hover:scale-110 transition-transform duration-300">
                                        <Book className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white tracking-tight text-base leading-tight">{subj.name}</p>
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">Subject ID: {subj.id.slice(0, 8)}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openModal(subj)}
                                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                                    >
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(subj.id)}
                                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <div className="flex flex-col items-center gap-4 scale-90 opacity-40">
                                <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                                <p className="text-slate-500 dark:text-slate-400 font-bold">Tidak ada mata pelajaran ditemukan.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                            <div>
                                <h3 className="text-xl font-black text-black dark:text-white tracking-tight">{editingSubject ? 'Update Mapel' : 'Tambah Mapel Baru'}</h3>
                                <p className="text-xs font-bold text-black dark:text-slate-400 uppercase tracking-[0.15em] mt-1">Masukkan nama mata pelajaran</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 dark:text-slate-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">Nama Mata Pelajaran</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Matematika Peminatan"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                />
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
                                    Simpan Mapel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
