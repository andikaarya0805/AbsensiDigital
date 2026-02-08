'use client';

import { useState, useEffect } from 'react';
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
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Overview</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Monitoring and managing HadirMu academic data.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card) => (
                    <div key={card.name} className="bg-white dark:bg-slate-900 p-7 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-6">
                            <div className={`${card.bg} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                            <button className="text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400">
                                <MoreHorizontal className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{card.name}</p>
                            <div className="flex items-end gap-3">
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{card.value}</h3>
                                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full mb-1 ${card.trend.includes('+') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                    {card.trend.includes('+') ? <ArrowUpRight className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                                    {card.trend}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Quick Actions */}
                <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl shadow-slate-200/60 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                        <Settings className="h-24 w-24" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-black tracking-tight mb-2">Quick Actions</h3>
                        <p className="text-slate-400 text-xs font-medium mb-6">Kelola data akademik dengan cepat.</p>

                        <div className="space-y-3">
                            <button className="w-full bg-white/10 hover:bg-white/20 text-white rounded-2xl py-3 px-4 text-sm font-bold transition-all text-left flex items-center gap-3 border border-white/5">
                                <Users className="h-4 w-4" /> Tambah Guru Baru
                            </button>
                            <button className="w-full bg-white/10 hover:bg-white/20 text-white rounded-2xl py-3 px-4 text-sm font-bold transition-all text-left flex items-center gap-3 border border-white/5">
                                <GraduationCap className="h-4 w-4" /> Impor Data Siswa
                            </button>
                            <button className="w-full bg-white/10 hover:bg-white/20 text-white rounded-2xl py-3 px-4 text-sm font-bold transition-all text-left flex items-center gap-3 border border-white/5">
                                <CalendarCheck className="h-4 w-4" /> Susun Jadwal
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-8">System Status</h3>
                    <div className="space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/50 shadow-sm">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Database Layer</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">Connected & Optimized</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-5">
                            <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/50 shadow-sm">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Last Data Sync</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">Live Updates Enabled</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
