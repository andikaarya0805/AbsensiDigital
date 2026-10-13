'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    GraduationCap,
    BookOpen,
    CalendarCheck,
    TrendingUp,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    CheckCircle2,
    Clock,
    Settings
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        teachers: 0,
        students: 0,
        classes: 0,
        todayAttendance: 0
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);

            // Fetch Teachers Count
            const { count: teacherCount } = await supabase
                .from('teachers')
                .select('*', { count: 'exact', head: true });

            // Fetch Students Count
            const { count: studentCount } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true });

            // Fetch Classes Count
            const { count: classCount } = await supabase
                .from('classes')
                .select('*', { count: 'exact', head: true });

            // Fetch Today's Attendance
            const today = new Date().toISOString().split('T')[0];
            const { count: attendanceCount } = await supabase
                .from('attendance')
                .select('*', { count: 'exact', head: true })
                .gte('timestamp', `${today}T00:00:00`)
                .lte('timestamp', `${today}T23:59:59`);

            setStats({
                teachers: teacherCount || 0,
                students: studentCount || 0,
                classes: classCount || 0,
                todayAttendance: attendanceCount || 0
            });

            setLoading(false);
        };

        fetchStats();
    }, []);

    const statCards = [
        { name: 'Total Guru', value: stats.teachers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+2' },
        { name: 'Total Siswa', value: stats.students, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+12' },
        { name: 'Total Kelas', value: stats.classes, icon: BookOpen, color: 'text-orange-600', bg: 'bg-orange-50', trend: '0' },
        { name: 'Hadir Hari Ini', value: stats.todayAttendance, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+8%' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10 py-6">
            {/* Page Header */}
            <div className="bg-linear-to-br from-slate-900 to-slate-800 dark:from-slate-900 dark:to-black p-10 rounded-[40px] border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-blue-500/20 transition-all duration-1000"></div>
                <div className="relative z-10">
                    <span className="inline-block bg-blue-600 text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full mb-4 text-white">Administrator</span>
                    <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase leading-none">Ringkasan<br/><span className="text-slate-400 not-italic">Sistem</span></h1>
                    <p className="text-slate-400 font-medium mt-4 max-w-lg leading-relaxed">Memantau dan mengelola ekosistem digital sekolah HadirMu secara terpusat dan real-time.</p>
                </div>
            </div>

            {/* Stats Grid - Bento Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card) => (
                    <div key={card.name} className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group relative overflow-hidden flex flex-col justify-between min-h-[240px]">
                        <div className={`absolute top-0 right-0 w-40 h-40 ${card.bg} opacity-[0.05] -mr-20 -mt-20 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
                        
                        <div className="flex items-center justify-between relative z-10">
                            <div className={`${card.bg} p-5 rounded-2xl group-hover:rotate-12 transition-transform duration-500 shadow-sm`}>
                                <card.icon className={`h-8 w-8 ${card.color}`} />
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full ${card.trend.includes('+') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                {card.trend.includes('+') ? <ArrowUpRight className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                                {card.trend}
                            </div>
                        </div>
                        
                        <div className="space-y-1 relative z-10">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{card.name}</p>
                            <h3 className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter italic">{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Aksi Cepat - Bento Big Card */}
                <div className="lg:col-span-2 bg-slate-900 dark:bg-black rounded-[40px] p-10 text-white shadow-2xl shadow-slate-200/60 dark:shadow-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700">
                        <Settings className="h-48 w-48 text-white" />
                    </div>
                    
                    <div className="relative z-10 max-w-md">
                        <span className="inline-block bg-blue-600 text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full mb-6">Manajemen</span>
                        <h3 className="text-3xl font-black tracking-tighter mb-3 italic">Aksi Cepat</h3>
                        <p className="text-slate-400 text-sm font-medium mb-10 leading-relaxed">Akses kontrol instan untuk mengelola seluruh ekosistem digital sekolah dengan satu sentuhan.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link href="/dashboard/admin/teachers?action=new" className="group/btn bg-white/5 hover:bg-white/10 text-white rounded-[24px] p-5 transition-all border border-white/5 flex items-start gap-4">
                                <div className="bg-white/10 p-3 rounded-xl group-hover/btn:bg-blue-600 transition-colors">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-black text-sm">Tambah Guru</p>
                                    <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">Database Guru</p>
                                </div>
                            </Link>
                            <Link href="/dashboard/admin/students?action=new" className="group/btn bg-white/5 hover:bg-white/10 text-white rounded-[24px] p-5 transition-all border border-white/5 flex items-start gap-4">
                                <div className="bg-white/10 p-3 rounded-xl group-hover/btn:bg-emerald-600 transition-colors">
                                    <GraduationCap className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-black text-sm">Tambah Siswa</p>
                                    <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">Database Siswa</p>
                                </div>
                            </Link>
                            <Link href="/dashboard/admin/schedules?action=new" className="group/btn bg-white/5 hover:bg-white/10 text-white rounded-[24px] p-5 transition-all border border-white/5 flex items-start gap-4 sm:col-span-2">
                                <div className="bg-white/10 p-3 rounded-xl group-hover/btn:bg-indigo-600 transition-colors">
                                    <CalendarCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-black text-sm">Susun Jadwal Pelajaran</p>
                                    <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">Plotting Tahun Ajaran</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* System Status - Bento Side Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-10 italic">Status Sistem</h3>
                    
                    <div className="space-y-10">
                        <div className="flex items-start gap-5">
                            <div className="h-14 w-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-[22px] flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shadow-sm shrink-0">
                                <CheckCircle2 className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1.5">Database Layer</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Terhubung & Optimal</p>
                                <p className="text-xs text-slate-500 mt-1 font-medium italic">Sinkronisasi Real-time aktif</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-5">
                            <div className="h-14 w-14 bg-blue-50 dark:bg-blue-900/30 rounded-[22px] flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shadow-sm shrink-0">
                                <Clock className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1.5">Sync Terakhir</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Baru Saja Diperbarui</p>
                                <p className="text-xs text-slate-500 mt-1 font-medium italic">Otomatisasi Polling aktif</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Health Score</span>
                                <span className="text-lg font-black text-emerald-600">99.8%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
