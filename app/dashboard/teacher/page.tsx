'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import {
    Users,
    RefreshCw,
    Clock,
    CheckCircle,
    LogOut,
    Calendar,
    LayoutDashboard,
    Maximize2,
    X,
    Download,
    BookOpen,
    AlertCircle,
    User,
    Moon,
    Sun
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';

// Status types for attendance
const STATUS_OPTIONS = [
    { value: 'hadir', label: 'HADIR', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'izin', label: 'IZIN', color: 'bg-blue-100 text-blue-700' },
    { value: 'sakit', label: 'SAKIT', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'alpha', label: 'ALPHA', color: 'bg-red-100 text-red-700' },
];

export default function TeacherDashboard() {
    const [qrValue, setQrValue] = useState('');
    const [timeLeft, setTimeLeft] = useState(120);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Class Attendance State
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [classStudents, setClassStudents] = useState<any[]>([]);
    const [studentStatuses, setStudentStatuses] = useState<Record<string, string>>({});

    // New Features State
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const [sessions, setSessions] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [scheduleSubjects, setScheduleSubjects] = useState<{ class_name: string, subject: string }[]>([]);

    const supabase = createClient();
    const qrRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();
    const { theme, toggleTheme } = useTheme();

    // QR Security Config
    const QR_REFRESH_SECONDS = 30; // Refresh setiap 30 detik
    const QR_SECRET = process.env.NEXT_PUBLIC_QR_SECRET || 'FALLBACK_SECRET';

    // Generate Dynamic QR Value with session
    const generateQR = () => {
        const timestamp = Math.floor(Date.now() / (QR_REFRESH_SECONDS * 1000));
        const session = sessionName || 'DEFAULT';
        setQrValue(`HADIR_SESSION_${timestamp}_${QR_SECRET}_${session}`);
        setTimeLeft(QR_REFRESH_SECONDS);
    };

    useEffect(() => {
        generateQR();
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    generateQR();
                    return QR_REFRESH_SECONDS;
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
    }, [sessionName]);

    // Fetch Classes on Mount
    useEffect(() => {
        const fetchClasses = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('class')
                .not('class', 'is', null)
                .neq('class', '')
                .order('class', { ascending: true });

            if (error) {
                console.error("Error fetching classes:", error);
                return;
            }

            const uniqueClasses = [...new Set(data?.map((d) => d.class).filter(Boolean))] as string[];
            setClasses(uniqueClasses);
        };

        // Fetch unique sessions for today
        const fetchSessions = async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('attendance')
                .select('session_name')
                .gte('timestamp', `${today}T00:00:00`)
                .lte('timestamp', `${today}T23:59:59`)
                .not('session_name', 'is', null);

            if (data) {
                const uniqueSessions = [...new Set(data.map(d => d.session_name).filter(Boolean))] as string[];
                setSessions(uniqueSessions);
            }
        };

        // Fetch teacher's schedule subjects
        const fetchTeacherSchedule = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const userSession = document.cookie.split('; ').find(row => row.startsWith('user_session='))?.split('=')[1];

            const teacherId = user?.id || userSession;
            if (!teacherId) return;

            const { data } = await supabase
                .from('schedules')
                .select('class_name, subject')
                .eq('teacher_id', teacherId);

            if (data) {
                // Get unique class + subject combinations
                const unique = data.filter((v, i, a) =>
                    a.findIndex(t => t.class_name === v.class_name && t.subject === v.subject) === i
                );
                setScheduleSubjects(unique);
            }
        };

        fetchClasses();
        fetchSessions();
        fetchTeacherSchedule();
    }, []);

    // Sign Out Helper
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        // Clear custom cookies
        document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        document.cookie = "user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        localStorage.removeItem('student_session');
        window.location.href = '/login';
    };

    // Fetch Class Students & Attendance by Date and Session
    useEffect(() => {
        if (!selectedClass) return;

        const fetchClassData = async () => {
            // Fetch students in class
            const { data: students } = await supabase
                .from('students')
                .select('*')
                .eq('class', selectedClass)
                .eq('role', 'student')
                .order('full_name');

            if (students) setClassStudents(students);

            // Fetch attendance for SELECTED DATE
            const [y, m, d] = selectedDate.split('-').map(Number);
            const startOfDay = new Date(y, m - 1, d, 0, 0, 0);
            const endOfDay = new Date(y, m - 1, d, 23, 59, 59);

            let query = supabase
                .from('attendance')
                .select('student_id, status_type, session_name')
                .gte('timestamp', startOfDay.toISOString())
                .lte('timestamp', endOfDay.toISOString());

            // Filter by current session name (from dropdown)
            if (sessionName) {
                query = query.eq('session_name', sessionName);
            }

            const { data: attendanceData } = await query;

            if (attendanceData) {
                const statusMap: Record<string, string> = {};
                attendanceData.forEach(a => {
                    statusMap[a.student_id] = a.status_type || 'hadir';
                });
                setStudentStatuses(statusMap);
            } else {
                setStudentStatuses({});
            }
        };

        fetchClassData();

        // Real-time subscription only for today
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const isToday = selectedDate === todayStr;

        let channel: any = null;
        if (isToday) {
            channel = supabase
                .channel(`class_attendance_${selectedClass}`)
                .on(
                    'postgres_changes' as any,
                    { event: '*', schema: 'public', table: 'attendance' },
                    () => fetchClassData()
                )
                .subscribe();
        }

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [selectedClass, selectedDate, sessionName]);

    // Update student status
    const updateStatus = async (studentId: string, newStatus: string) => {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        if (selectedDate !== todayStr) {
            showToast('Hanya bisa mengubah status untuk hari ini!', 'warning');
            return;
        }

        const [y, m, d] = selectedDate.split('-').map(Number);
        const startOfDay = new Date(y, m - 1, d, 0, 0, 0);
        const endOfDay = new Date(y, m - 1, d, 23, 59, 59);

        // Check if attendance exists
        const { data: existing } = await supabase
            .from('attendance')
            .select('id')
            .eq('student_id', studentId)
            .gte('timestamp', startOfDay.toISOString())
            .lte('timestamp', endOfDay.toISOString())
            .eq('session_name', sessionName || 'DEFAULT')
            .single();

        if (existing) {
            // Update existing
            await supabase
                .from('attendance')
                .update({ status_type: newStatus })
                .eq('id', existing.id);
        } else {
            // Insert new
            await supabase
                .from('attendance')
                .insert({
                    student_id: studentId,
                    timestamp: new Date().toISOString(),
                    status_type: newStatus,
                    session_name: sessionName || 'DEFAULT'
                });
        }

        // Update local state
        setStudentStatuses(prev => ({ ...prev, [studentId]: newStatus }));
    };

    // Export to Excel
    const exportToExcel = () => {
        if (!selectedClass || classStudents.length === 0) {
            showToast('Pilih kelas terlebih dahulu!', 'warning');
            return;
        }

        const data = classStudents.map((student, index) => {
            const status = studentStatuses[student.id] || 'alpha';
            const statusLabel = STATUS_OPTIONS.find(s => s.value === status)?.label || 'ALPHA';
            return {
                'No': index + 1,
                'Nama Siswa': student.full_name,
                'NIS': student.nis,
                'Kelas': student.class,
                'Status': statusLabel,
                'Sesi': selectedSession || 'Semua Sesi',
                'Tanggal': selectedDate
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi');

        const fileName = `Absensi_${selectedClass}_${selectedDate}.xlsx`;
        XLSX.writeFile(wb, fileName);
        showToast(`File ${fileName} berhasil diunduh!`, 'success');
    };

    // Toggle Fullscreen
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // Get status badge color
    const getStatusBadge = (status: string) => {
        const opt = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[3];
        return opt;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">
            {/* Fullscreen QR Modal */}
            {isFullscreen && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
                    <button
                        onClick={toggleFullscreen}
                        className="absolute top-6 right-6 text-white hover:text-red-400 transition-colors"
                    >
                        <X className="h-8 w-8" />
                    </button>

                    <div className="text-center">
                        {sessionName && (
                            <div className="mb-6">
                                <span className="bg-blue-600 text-white px-6 py-2 rounded-full text-xl font-bold">
                                    {sessionName}
                                </span>
                            </div>
                        )}

                        <div className="bg-white p-8 rounded-3xl">
                            <QRCodeSVG value={qrValue} size={400} level="H" includeMargin={true} />
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-4 text-white">
                            <Clock className="h-6 w-6" />
                            <span className="text-4xl font-bold tabular-nums">{timeLeft}s</span>
                        </div>

                        <div className="mt-4 w-80 mx-auto bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-blue-500 h-full transition-all duration-1000 ease-linear"
                                style={{ width: `${(timeLeft / 120) * 100}%` }}
                            />
                        </div>

                        <p className="mt-6 text-gray-400 text-sm">Tekan ESC atau klik X untuk keluar</p>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-r border-slate-200 dark:border-slate-800 p-6 transition-colors duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <LayoutDashboard className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">HadirMu</h1>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-yellow-400 rounded-xl transition-all"
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === 'light' ? (
                            <Moon className="h-5 w-5" />
                        ) : (
                            <Sun className="h-5 w-5" />
                        )}
                    </button>
                </div>

                <nav className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium border border-blue-100 dark:border-blue-800/50">
                        <Users className="h-4 w-4" />
                        Attendance
                    </div>
                    <Link
                        href="/dashboard/teacher/schedule"
                        className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
                    >
                        <Calendar className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        Class Schedule
                    </Link>
                    <Link
                        href="/dashboard/teacher/profile"
                        className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
                    >
                        <User className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        Profil Saya
                    </Link>
                </nav>

                <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800 hidden md:block">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-3 py-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors w-full group"
                    >
                        <LogOut className="h-4 w-4 text-slate-400 group-hover:text-red-500 transition-colors" />
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
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance QR</h2>
                            <p className="text-slate-500 dark:text-slate-400">Show this QR to students for scanning</p>
                        </div>

                        {/* Session Selection from Schedule */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                <BookOpen className="h-4 w-4 inline mr-2 text-blue-600 dark:text-blue-400" />
                                Pilih Kelas & Mata Pelajaran
                            </label>
                            {scheduleSubjects.length > 0 ? (
                                <select
                                    value={sessionName}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSessionName(value);
                                        // Auto-select class from the dropdown value
                                        if (value) {
                                            const className = value.split(' - ')[0];
                                            setSelectedClass(className);
                                            setSelectedSession(value);
                                        }
                                    }}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none text-black dark:text-white font-medium transition-colors"
                                >
                                    <option value="" className="dark:bg-slate-800">-- Pilih dari jadwal --</option>
                                    {scheduleSubjects.map((s, i) => (
                                        <option key={i} value={`${s.class_name} - ${s.subject}`} className="dark:bg-slate-800">
                                            {s.class_name} - {s.subject}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Contoh: XII RPL 1 - Matematika"
                                    value={sessionName}
                                    onChange={(e) => setSessionName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none text-black dark:text-white transition-colors"
                                />
                            )}
                        </div>

                        <div ref={qrRef} className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col items-center transition-colors">
                            <div className="relative p-4 bg-slate-50 dark:bg-white rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-300">
                                <QRCodeSVG value={qrValue} size={256} level="H" includeMargin={true} />
                            </div>

                            {sessionName && (
                                <div className="mt-4">
                                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-bold">
                                        {sessionName}
                                    </span>
                                </div>
                            )}

                            <div className="mt-6 w-full space-y-4">
                                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                        <Clock className="h-4 w-4" />
                                        <span className="text-sm font-medium">Refreshes in</span>
                                    </div>
                                    <span className="text-blue-600 dark:text-blue-400 font-bold tabular-nums">{timeLeft}s</span>
                                </div>

                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-1000 ease-linear"
                                        style={{ width: `${(timeLeft / 120) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); generateQR(); }}
                                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Regenerate
                                </button>
                                <button
                                    type="button"
                                    onClick={toggleFullscreen}
                                    className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Maximize2 className="h-4 w-4" />
                                    Fullscreen
                                </button>
                            </div>
                        </div>
                    </div>


                    <div className="lg:col-span-2 space-y-6 pt-10 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Rekap Absensi</h2>
                                {sessionName ? (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                                            {sessionName}
                                        </span>
                                        <span className="text-slate-400 dark:text-slate-600">•</span>
                                        <span className="text-slate-500 dark:text-slate-400 text-sm">
                                            {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                        Pilih kelas & mata pelajaran di atas untuk melihat daftar siswa
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <input
                                    type="date"
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white py-2 px-3 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />

                                <button
                                    onClick={exportToExcel}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-200/50 dark:shadow-none"
                                >
                                    <Download className="h-4 w-4" />
                                    Export Excel
                                </button>
                            </div>
                        </div>

                        {selectedClass && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Siswa</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">NIS</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {classStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                                                        Tidak ada siswa di kelas ini.
                                                    </td>
                                                </tr>
                                            ) : (
                                                classStudents.map((student) => {
                                                    const currentStatus = studentStatuses[student.id] || '';
                                                    const statusInfo = getStatusBadge(currentStatus || 'alpha');
                                                    const now = new Date();
                                                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                                                    const isToday = selectedDate === todayStr;

                                                    return (
                                                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xs">
                                                                        {student.full_name?.charAt(0)}
                                                                    </div>
                                                                    <span className="font-bold text-slate-900 dark:text-white">{student.full_name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400 font-mono text-sm">
                                                                {student.nis}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {isToday ? (
                                                                    <div className="relative inline-block">
                                                                        <select
                                                                            value={currentStatus || 'alpha'}
                                                                            onChange={(e) => updateStatus(student.id, e.target.value)}
                                                                            className={`appearance-none px-4 py-2 rounded-full text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-800 ${statusInfo.color} dark:bg-opacity-20 border border-transparent dark:border-white/10`}
                                                                        >
                                                                            {STATUS_OPTIONS.map(opt => (
                                                                                <option key={opt.value} value={opt.value} className="dark:bg-slate-900 text-black dark:text-white">{opt.label}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                ) : (
                                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color} dark:bg-opacity-20`}>
                                                                        {currentStatus ? (
                                                                            <>
                                                                                <CheckCircle className="h-3.5 w-3.5" />
                                                                                {statusInfo.label}
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <AlertCircle className="h-3.5 w-3.5" />
                                                                                ALPHA
                                                                            </>
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
