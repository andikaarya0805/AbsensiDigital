'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit2,
    Trash2,
    CalendarCheck,
    X,
    Save,
    Loader2,
    User,
    BookOpen,
    FileText,
    Clock,
    Calendar
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const DAYS = [
    { value: 1, label: 'Senin' },
    { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' },
    { value: 4, label: 'Kamis' },
    { value: 5, label: 'Jumat' },
    { value: 6, label: 'Sabtu' },
    { value: 7, label: 'Minggu' },
];

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<any>(null);
    const [formData, setFormData] = useState({
        teacher_id: '',
        class_id: '',
        subject_id: '',
        day_of_week: 1,
        start_time: '07:30',
        end_time: '09:00'
    });
    const [isSaving, setIsSaving] = useState(false);

    const supabase = createClient();
    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        // Fetch all dependencies
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

        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const payload = {
            teacher_id: formData.teacher_id,
            class_id: formData.class_id,
            subject_id: formData.subject_id,
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            // Keep old string columns for compatibility if they still exist in schema
            class_name: classes.find(c => c.id === formData.class_id)?.name,
            subject: subjects.find(s => s.id === formData.subject_id)?.name
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

        if (error) {
            showToast(error.message, 'error');
        } else {
            showToast(`Jadwal berhasil ${editingSchedule ? 'diupdate' : 'ditambahkan'}`, 'success');
            setShowModal(false);
            setEditingSchedule(null);
            fetchData();
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;

        const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', id);

        if (error) {
            showToast('Gagal menghapus jadwal', 'error');
        } else {
            showToast('Jadwal berhasil dihapus', 'success');
            fetchData();
        }
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

    return (
        <div className="space-y-8 py-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Jadwal Pelajaran</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Atur alokasi waktu pengajar dan kelas.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold text-sm tracking-tight hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100"
                >
                    <Plus className="h-5 w-5" />
                    Tambah Jadwal
                </button>
            </div>

            {/* List by Day */}
            <div className="grid grid-cols-1 gap-8">
                {DAYS.map((day) => {
                    const daySchedules = schedules.filter(s => s.day_of_week === day.value);
                    if (daySchedules.length === 0 && loading) return null;

                    return (
                        <div key={day.value} className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-sm shadow-blue-100">
                                    {day.label[0]}
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{day.label}</h3>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1 transition-colors"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {daySchedules.length > 0 ? (
                                    daySchedules.map((sch) => (
                                        <div key={sch.id} className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-blue-900/10 hover:shadow-slate-200/40 transition-all duration-300 group">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700 transition-colors">
                                                    <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 tabular-nums">
                                                        {sch.start_time?.slice(0, 5)} - {sch.end_time?.slice(0, 5)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openModal(sch)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                                                    <button onClick={() => handleDelete(sch.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                        <FileText className="h-3 w-3" /> Mata Pelajaran
                                                    </p>
                                                    <p className="font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{sch.subjects?.name || sch.subject}</p>
                                                </div>

                                                <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-[10px] border border-blue-100/50 dark:border-blue-900/50 transition-colors">
                                                            {sch.teachers?.full_name?.charAt(0)}
                                                        </div>
                                                        <div className="max-w-[120px]">
                                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter truncate leading-none mb-1">Pengajar</p>
                                                            <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate leading-none">{sch.teachers?.full_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="inline-flex px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900/30 transition-colors">
                                                            {sch.classes?.name || sch.class_name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    !loading && <p className="text-xs font-medium text-slate-400 dark:text-slate-600 italic">Tidak ada jadwal.</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                            <div>
                                <h3 className="text-xl font-black text-black dark:text-white tracking-tight">{editingSchedule ? 'Update Jadwal' : 'Tambah Jadwal Baru'}</h3>
                                <p className="text-xs font-bold text-black dark:text-slate-400 uppercase tracking-[0.15em] mt-1">Konfigurasi waktu dan pengajar</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 dark:text-slate-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">Nama Pengajar (Guru)</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <select
                                        required
                                        value={formData.teacher_id}
                                        onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="" className="dark:bg-slate-900">-- Pilih Guru --</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id} className="dark:bg-slate-900">{t.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">Mata Pelajaran</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <select
                                        required
                                        value={formData.subject_id}
                                        onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="" className="dark:bg-slate-900">-- Pilih Mapel --</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id} className="dark:bg-slate-900">{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">Kelas Target</label>
                                <div className="relative">
                                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <select
                                        required
                                        value={formData.class_id}
                                        onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="" className="dark:bg-slate-900">-- Pilih Kelas --</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id} className="dark:bg-slate-900">{cls.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">Hari</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <select
                                        required
                                        value={formData.day_of_week}
                                        onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                                        className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all appearance-none"
                                    >
                                        {DAYS.map(day => (
                                            <option key={day.value} value={day.value} className="dark:bg-slate-900">{day.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">Jam Mulai</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="time"
                                        required
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-black dark:text-slate-200 uppercase tracking-widest ml-1">Jam Selesai</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="time"
                                        required
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 md:col-span-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-bold text-sm tracking-tight hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all shadow-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold text-sm tracking-tight hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    Simpan Jadwal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
