'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import {
    Calendar,
    Clock,
    BookOpen,
    Users,
    ChevronLeft,
    LayoutDashboard,
    LogOut
} from 'lucide-react';
import Link from 'next/link';

interface Schedule {
    id: string;
    class_name: string;
    subject: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
}

const DAYS = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const DAY_COLORS = [
    '',
    'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    'bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800',
    'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
    'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
];

export default function SchedulePage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1);
    const [user, setUser] = useState<any>(null);

    const supabase = createClient();

    useEffect(() => {
        const fetchSchedule = async () => {
            // Get current user
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const userSession = document.cookie.split('; ').find(row => row.startsWith('user_session='))?.split('=')[1];
            const userId = authUser?.id || userSession;

            if (!userId) {
                window.location.href = '/login';
                return;
            }

            // Get teacher profile from teachers table
            const { data: teacher } = await supabase
                .from('teachers')
                .select('*')
                .eq('id', userId)
                .single();

            setUser(teacher);

            // Get schedules
            const { data, error } = await supabase
                .from('schedules')
                .select('*')
                .eq('teacher_id', userId)
                .order('day_of_week')
                .order('start_time');

            if (error) {
                console.error('Error fetching schedules:', error);
            } else {
                setSchedules(data || []);
            }
            setLoading(false);
        };

        fetchSchedule();
    }, []);

    const filteredSchedules = selectedDay === 0
        ? schedules
        : schedules.filter(s => s.day_of_week === selectedDay);

    const groupedByDay = schedules.reduce((acc, s) => {
        if (!acc[s.day_of_week]) acc[s.day_of_week] = [];
        acc[s.day_of_week].push(s);
        return acc;
    }, {} as Record<number, Schedule[]>);

    const formatTime = (time: string) => {
        return time.slice(0, 5);
    };

    const getTodaySchedule = () => {
        const today = new Date().getDay();
        return schedules.filter(s => s.day_of_week === (today === 0 ? 7 : today));
    };

    const todaySchedule = getTodaySchedule();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-r border-slate-200 dark:border-slate-800 p-6 transition-colors">
                <div className="flex items-center gap-2 mb-8">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <LayoutDashboard className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">HadirMu</h1>
                </div>

                <nav className="space-y-1">
                    <Link
                        href="/dashboard/teacher"
                        className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Users className="h-4 w-4" />
                        Attendance
                    </Link>
                    <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium">
                        <Calendar className="h-4 w-4" />
                        Class Schedule
                    </div>
                </nav>

                <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800 hidden md:block">
                    <button
                        onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
                        className="flex items-center gap-3 px-3 py-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors w-full"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 group">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Jadwal Mengajar</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            {user?.full_name || 'Guru'} • <span className="text-blue-600 dark:text-blue-400">Total {schedules.length} sesi</span> per minggu
                        </p>
                    </div>

                    {/* Today's Schedule Card */}
                    {todaySchedule.length > 0 && (
                        <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 mb-8 text-white">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="h-5 w-5" />
                                <span className="font-bold">Jadwal Hari Ini ({DAYS[new Date().getDay() || 7]})</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {todaySchedule.map(s => (
                                    <div key={s.id} className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                                        <p className="font-bold">{s.subject}</p>
                                        <p className="text-blue-100 text-sm">{s.class_name}</p>
                                        <p className="text-blue-200 text-xs mt-2">
                                            {formatTime(s.start_time)} - {formatTime(s.end_time)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Day Filter */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button
                            onClick={() => setSelectedDay(0)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${selectedDay === 0
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            Semua
                        </button>
                        {[1, 2, 3, 4, 5].map(day => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${selectedDay === day
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {DAYS[day]}
                            </button>
                        ))}
                    </div>

                    {/* Schedule Grid */}
                    {loading ? (
                        <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                            Loading jadwal...
                        </div>
                    ) : schedules.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors shadow-sm">
                            <Calendar className="h-16 w-16 mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                            <p className="text-slate-400 dark:text-slate-300 mb-2 font-bold">Belum ada jadwal</p>
                            <p className="text-slate-300 dark:text-slate-500 text-sm">
                                Buka /seed dan klik "Teacher + Schedule" untuk generate data
                            </p>
                        </div>
                    ) : selectedDay === 0 ? (
                        // Show all days grouped
                        <div className="space-y-6">
                            {[1, 2, 3, 4, 5].map(day => {
                                const daySchedules = groupedByDay[day] || [];
                                if (daySchedules.length === 0) return null;

                                return (
                                    <div key={day}>
                                        <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3">{DAYS[day]}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {daySchedules.map(s => (
                                                <div
                                                    key={s.id}
                                                    className={`rounded-2xl p-5 border ${DAY_COLORS[day]}`}
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h4 className="font-bold text-lg">{s.subject}</h4>
                                                            <p className="text-sm opacity-80">{s.class_name}</p>
                                                        </div>
                                                        <BookOpen className="h-5 w-5 opacity-50" />
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm opacity-80">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{formatTime(s.start_time)} - {formatTime(s.end_time)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // Show filtered day
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSchedules.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-slate-400">
                                    Tidak ada jadwal untuk hari {DAYS[selectedDay]}
                                </div>
                            ) : (
                                filteredSchedules.map(s => (
                                    <div
                                        key={s.id}
                                        className={`rounded-2xl p-5 border ${DAY_COLORS[s.day_of_week]}`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-bold text-lg">{s.subject}</h4>
                                                <p className="text-sm opacity-80">{s.class_name}</p>
                                            </div>
                                            <BookOpen className="h-5 w-5 opacity-50" />
                                        </div>
                                        <div className="flex items-center gap-2 text-sm opacity-80">
                                            <Clock className="h-4 w-4" />
                                            <span>{formatTime(s.start_time)} - {formatTime(s.end_time)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
