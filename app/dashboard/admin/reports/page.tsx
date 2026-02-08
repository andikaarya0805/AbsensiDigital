'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import {
    CalendarDays,
    Filter,
    Download,
    Search,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle
} from 'lucide-react';

export default function ReportsPage() {
    const [attendance, setAttendance] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('all');

    const supabase = createClient();

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        fetchAttendance();
    }, [selectedDate, selectedClass]);

    const fetchClasses = async () => {
        const { data } = await supabase.from('classes').select('*').order('name');
        if (data) setClasses(data);
    };

    const fetchAttendance = async () => {
        setLoading(true);
        let query = supabase
            .from('attendance')
            .select(`
                *,
                students (
                    full_name,
                    nis,
                    class
                )
            `)
            .eq('date', selectedDate)
            .order('time', { ascending: true });

        if (selectedClass !== 'all') {
            // Filter by class logic. 
            // Note: Currently 'attendance' table might not have class_id directly, 
            // but let's assume we filter after fetch or if schema supports it.
            // Best practice: Filter on DB side if possible.
            // If attendance has class_id, use it. If not, we might need to filter client side 
            // or join with students table (Supabase filtering on joined table is possible but specific syntax).
            // For now let's try assuming we can filter results client side if not large, 
            // or use specific logic.
            // Actually, let's filter client-side for simplicity if dataset is small, 
            // or use the inner join filter if Supabase supports '!inner' hint easily here.

            // To be safe and robust given uncertain schema of 'attendance', let's fetch for date and filter in memory 
            // or if we rely on student's class.
        }

        const { data, error } = await query;

        if (data) {
            let filtered = data;
            if (selectedClass !== 'all') {
                filtered = data.filter((record: any) => record.students?.class === selectedClass || record.students?.class_id === selectedClass);
            }
            setAttendance(filtered);
        }
        setLoading(false);
    };

    const stats = {
        present: attendance.filter(a => a.status === 'present').length,
        late: attendance.filter(a => a.status === 'late').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        total: attendance.length
    };

    return (
        <div className="space-y-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Laporan Presensi</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Rekapitulasi kehadiran siswa harian.</p>
                </div>
                <button className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 text-white px-6 py-3.5 rounded-2xl font-bold text-sm tracking-tight hover:bg-slate-800 transition-all shadow-lg shadow-slate-200/50 dark:shadow-none">
                    <Download className="h-5 w-5" />
                    Export Data
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                    <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Tanggal</label>
                    <div className="relative">
                        <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 space-y-2">
                    <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Filter Kelas</label>
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all appearance-none"
                        >
                            <option value="all">Semua Kelas</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-900/50">
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest mb-1">Hadir</p>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{stats.present}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/50">
                    <p className="text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest mb-1">Terlambat</p>
                    <p className="text-3xl font-black text-amber-700 dark:text-amber-300">{stats.late}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-3xl border border-red-100 dark:border-red-900/50">
                    <p className="text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest mb-1">Absen</p>
                    <p className="text-3xl font-black text-red-700 dark:text-red-300">{stats.absent}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/50">
                    <p className="text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-1">Total</p>
                    <p className="text-3xl font-black text-blue-700 dark:text-blue-300">{stats.total}</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-50 dark:border-slate-800/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Waktu</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Siswa</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Kelas</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Loading data...</td></tr>
                            ) : attendance.length > 0 ? (
                                attendance.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400 text-sm">
                                                <Clock className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                                                {record.time}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{record.students?.full_name}</p>
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">{record.students?.nis}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="inline-flex px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                {record.students?.class || '-'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${record.status === 'present' ? 'bg-emerald-50 text-emerald-600' :
                                                    record.status === 'late' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-red-50 text-red-600'
                                                }`}>
                                                {record.status === 'present' ? <CheckCircle2 className="h-3 w-3" /> :
                                                    record.status === 'late' ? <Clock className="h-3 w-3" /> :
                                                        <XCircle className="h-3 w-3" />}
                                                {record.status === 'present' ? 'Hadir' :
                                                    record.status === 'late' ? 'Terlambat' : 'Absen'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <FileText className="h-12 w-12 text-slate-300" />
                                            <p className="text-slate-500 font-bold">Belum ada data presensi pada tanggal ini.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
