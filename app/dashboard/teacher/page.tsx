'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import {
    Users,
    RefreshCw,
    Clock,
    CheckCircle,
    LogOut,
    Calendar,
    LayoutDashboard
} from 'lucide-react';

export default function TeacherDashboard() {
    const [qrValue, setQrValue] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // Generate Dynamic QR Value
    const generateQR = () => {
        const timestamp = Math.floor(Date.now() / 30000); // Changes every 30s
        const secret = "HADIRMU_SECRET_123"; // In production, use class session ID
        setQrValue(`HADIR_SESSION_${timestamp}_${secret}`);
        setTimeLeft(30);
    };

    useEffect(() => {
        generateQR();
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    generateQR();
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        // Fetch Attendance Realtime
        const fetchAttendance = async () => {
            const { data, error } = await supabase
                .from('attendance')
                .select('*, profiles(full_name, nis)')
                .order('timestamp', { ascending: false })
                .limit(10);

            if (error) {
                console.error("Fetch Attendance Error:", error);
            } else {
                console.log("Fetched Attendance Data:", data);
            }
            setAttendance(data || []);
            setLoading(false);
        };

        fetchAttendance();

        // Subscribe to new attendance
        const channel = supabase
            .channel('attendance_updates')
            .on(
                'postgres_changes' as any,
                { event: 'INSERT', schema: 'public', table: 'attendance' },
                () => {
                    fetchAttendance();
                }
            )
            .subscribe();

        return () => {
            clearInterval(timer);
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar - Desktop */}
            <aside className="w-full md:w-64 bg-white border-b md:border-r border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <LayoutDashboard className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">HadirMu</h1>
                </div>

                <nav className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">
                        <Users className="h-4 w-4" />
                        Attendance
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                        <Calendar className="h-4 w-4" />
                        Class Schedule
                    </div>
                </nav>

                <div className="mt-auto pt-8 border-t border-slate-100 hidden md:block">
                    <button
                        onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
                        className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-500 transition-colors w-full"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">

                    {/* QR Code Section */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Attendance QR</h2>
                            <p className="text-slate-500">Show this QR to students for scanning</p>
                        </div>

                        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center">
                            <div className="relative p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <QRCodeSVG value={qrValue} size={256} level="H" includeMargin={true} />
                            </div>

                            <div className="mt-8 w-full space-y-4">
                                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <Clock className="h-4 w-4" />
                                        <span className="text-sm font-medium text-slate-600">Refreshes in</span>
                                    </div>
                                    <span className="text-blue-600 font-bold tabular-nums">{timeLeft}s</span>
                                </div>

                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full transition-all duration-1000 ease-linear"
                                        style={{ width: `${(timeLeft / 30) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={generateQR}
                                className="mt-6 flex items-center gap-2 text-sm text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Regenerate Manually
                            </button>
                        </div>
                    </div>

                    {/* Realtime Attendance Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Recent Presence</h2>
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                LIVE
                            </span>
                        </div>

                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                            <div className="divide-y divide-slate-100">
                                {loading ? (
                                    <div className="p-8 text-center text-slate-400">Loading attendance...</div>
                                ) : attendance.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400">
                                        <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        No one has scanned yet.
                                    </div>
                                ) : (
                                    attendance.map((att) => (
                                        <div key={att.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors animate-in slide-in-from-right-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {att.profiles?.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">
                                                        {att.profiles?.full_name || 'Nama Tidak Muncul'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        NIS: {att.profiles?.nis || (att.student_id ? att.student_id.substring(0, 8) : 'N/A')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs mb-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    PRESENT
                                                </div>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                                                    {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
