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
    Sun,
    FileText,
    Loader2,
    ArrowUpRight,
    CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

    /**
     * Security Configuration for Dynamic QR Codes.
     * QR codes refresh every 30 seconds and include a secret for integrity.
     */
    const QR_REFRESH_SECONDS = 30;
    const QR_SECRET = process.env.NEXT_PUBLIC_QR_SECRET || 'FALLBACK_SECRET';

    /**
     * Generates a new dynamic QR value based on current timestamp and session.
     * The format matches the validation logic in the student scanner.
     */
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

        // Fetch recent attendance logs (initial load)
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

        /**
         * Real-time Subscription: 
         * Automatically updates the list when a new student scans the QR code.
         */
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

    /**
     * Exports current daily attendance to a professional PDF.
     */
    const exportToPDF = () => {
        if (!selectedClass || classStudents.length === 0) {
            showToast('Pilih kelas terlebih dahulu!', 'warning');
            return;
        }

        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.text('LAPORAN PRESENSI HARIAN', 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Mata Pelajaran: ${sessionName || 'Umum'}`, 14, 32);
        doc.text(`Kelas: ${selectedClass}`, 14, 38);
        doc.text(`Tanggal: ${selectedDate}`, 14, 44);
        
        // Table
        const tableData = classStudents.map((s, i) => {
            const status = studentStatuses[s.id] || 'alpha';
            const opt = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[3];
            return [
                i + 1,
                s.full_name,
                s.nis,
                opt.label
            ];
        });

        autoTable(doc, {
            startY: 50,
            head: [['No', 'Nama Siswa', 'NIS', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
            styles: { fontSize: 9 }
        });

        doc.save(`Presensi_${selectedClass}_${selectedDate}.pdf`);
        showToast("PDF berhasil diunduh!", "success");
    };

    /**
     * Generates a monthly recap by fetching data for the entire month for the selected class/subject.
     */
    const [exportingMonthly, setExportingMonthly] = useState(false);
    
    const exportMonthlyRecap = async () => {
        if (!selectedClass || !sessionName) {
            showToast('Pilih kelas dan mata pelajaran terlebih dahulu!', 'warning');
            return;
        }

        setExportingMonthly(true);
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const { data: logs, error } = await supabase
                .from('attendance')
                .select('student_id, status_type, timestamp')
                .eq('session_name', sessionName)
                .gte('timestamp', startOfMonth.toISOString())
                .lte('timestamp', endOfMonth.toISOString());

            if (error) throw error;

            // Process data: count per student
            const recapData = classStudents.map((student, index) => {
                const sLogs = logs?.filter(l => l.student_id === student.id) || [];
                const hadir = sLogs.filter(l => l.status_type === 'hadir').length;
                const izin = sLogs.filter(l => l.status_type === 'izin').length;
                const sakit = sLogs.filter(l => l.status_type === 'sakit').length;
                const alpha = sLogs.filter(l => l.status_type === 'alpha').length;

                return {
                    'No': index + 1,
                    'Nama Siswa': student.full_name,
                    'NIS': student.nis,
                    'Hadir': hadir,
                    'Izin': izin,
                    'Sakit': sakit,
                    'Alpha': alpha,
                    'Total Sesi': sLogs.length
                };
            });

            // Export to Excel
            const ws = XLSX.utils.json_to_sheet(recapData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Rekap Bulanan');
            
            const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(now);
            const fileName = `Rekap_Bulanan_${selectedClass}_${monthName}.xlsx`;
            
            XLSX.writeFile(wb, fileName);
            showToast(`Rekap Bulanan ${monthName} berhasil diunduh!`, 'success');

        } catch (e: any) {
            showToast('Gagal menarik data rekap: ' + e.message, 'error');
        } finally {
            setExportingMonthly(false);
        }
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
                    <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-black text-xs uppercase tracking-widest border border-blue-100 dark:border-blue-800/50">
                        <Users className="h-4 w-4" />
                        Presensi
                    </div>
                    <Link
                        href="/dashboard/teacher/schedule"
                        className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group font-bold text-xs uppercase tracking-widest"
                    >
                        <Calendar className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        Jadwal Mengajar
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
            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Welcome & Info Bento */}
                    <div className="lg:col-span-3 bg-linear-to-br from-blue-700 via-indigo-700 to-violet-800 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20 dark:shadow-none transition-all duration-700 group">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-white/20 transition-all duration-1000"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                            <div className="space-y-5">
                                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                    <Clock className="h-3 w-3" />
                                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                                <h1 className="text-4xl font-black tracking-tighter leading-[0.9] italic uppercase">
                                    Kelola Presensi<br/>
                                    <span className="text-blue-200/90 text-2xl not-italic">Kelas Hari Ini</span>
                                </h1>
                                <p className="text-blue-100/70 text-sm font-medium max-w-md leading-relaxed">Aktifkan sesi presensi dengan menampilkan kode QR agar siswa dapat mencatat kehadiran secara mandiri.</p>
                            </div>
                            
                            <div className="flex flex-wrap gap-4">
                                <div className="p-8 bg-white/10 backdrop-blur-xl rounded-[32px] border border-white/10 min-w-[160px] transition-all hover:bg-white/15 hover:scale-105 group/card">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200/80 mb-2">Status Sesi</p>
                                    <div className="flex items-center gap-3">
                                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]"></div>
                                        <p className="text-2xl font-black uppercase tracking-tight italic">Aktif</p>
                                    </div>
                                </div>
                                <div className="p-8 bg-white/10 backdrop-blur-xl rounded-[32px] border border-white/10 min-w-[160px] transition-all hover:bg-white/15 hover:scale-105 group/card">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200/80 mb-2 text-center">Total Scan</p>
                                    <p className="text-4xl font-black text-center tabular-nums italic">{attendance.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QR Section - Bento Medium */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-2xl hover:shadow-slate-200/50 group">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-5">
                                    <div className="p-5 bg-blue-50 dark:bg-blue-900/30 rounded-[24px] group-hover:scale-110 transition-transform duration-500">
                                        <RefreshCw className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-2xl text-slate-900 dark:text-white leading-tight uppercase tracking-tighter italic">Kode QR Presensi</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Siswa memindai kode ini untuk presensi</p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleFullscreen}
                                    className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-white text-slate-400 hover:text-white dark:hover:text-slate-900 rounded-[20px] transition-all duration-300 shadow-sm"
                                >
                                    <Maximize2 className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="flex flex-col lg:flex-row items-center gap-12">
                                <div ref={qrRef} className="relative group/qr">
                                    <div className="absolute -inset-4 bg-linear-to-r from-blue-600 to-indigo-600 rounded-[48px] blur-2xl opacity-0 group-hover/qr:opacity-10 transition duration-1000"></div>
                                    <div className="relative bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl overflow-hidden group-hover/qr:scale-[1.02] transition-transform duration-500">
                                        <QRCodeSVG value={qrValue} size={260} level="H" includeMargin={true} />
                                    </div>
                                </div>

                                <div className="flex-1 space-y-8 w-full">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-4 relative z-10">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Refresh Otomatis</span>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3 w-3 text-blue-600" />
                                                <span className="text-blue-600 font-black tabular-nums text-lg">{timeLeft}s</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden relative z-10">
                                            <div
                                                className="bg-linear-to-r from-blue-600 to-indigo-600 h-full transition-all duration-1000 ease-linear rounded-full"
                                                style={{ width: `${(timeLeft / 30) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => generateQR()}
                                        className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-200 dark:shadow-none italic flex items-center justify-center gap-3"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Segarkan Kode QR
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls Section - Bento Small */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-2xl hover:shadow-slate-200/50 group">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl group-hover:rotate-12 transition-transform">
                                    <BookOpen className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h3 className="font-black text-sm uppercase tracking-[0.2em] text-slate-900 dark:text-white italic">Sesi Pelajaran</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Mata Pelajaran & Kelas</label>
                                    <select
                                        value={sessionName}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setSessionName(value);
                                            if (value) {
                                                const className = value.split(' - ')[0];
                                                setSelectedClass(className);
                                                setSelectedSession(value);
                                            }
                                        }}
                                        className="w-full px-6 py-4 rounded-[24px] border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-sm font-bold transition-all shadow-sm"
                                    >
                                        <option value="">-- Pilih dari jadwal --</option>
                                        {scheduleSubjects.map((s, i) => (
                                            <option key={i} value={`${s.class_name} - ${s.subject}`}>
                                                {s.class_name} - {s.subject}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-linear-to-br from-indigo-600 to-blue-700 rounded-[40px] p-10 text-white shadow-xl shadow-blue-200/40 relative overflow-hidden group">
                            <Users className="absolute -bottom-6 -right-6 h-32 w-32 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-70">Real-time Info</h4>
                            <p className="text-xl font-black leading-tight italic">Seluruh data presensi disinkronkan secara instan.</p>
                        </div>
                    </div>


                    <div className="lg:col-span-3 space-y-10 pt-16 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                            <div className="space-y-2">
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Rekap Kehadiran</h2>
                                {sessionName ? (
                                    <div className="flex flex-wrap items-center gap-3 mt-4">
                                        <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20">
                                            {sessionName}
                                        </span>
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                                        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.15em]">
                                            {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                        Silakan pilih sesi pelajaran untuk memantau kehadiran siswa.
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-[20px] shadow-sm flex items-center gap-2">
                                    <input
                                        type="date"
                                        className="bg-transparent border-none text-slate-900 dark:text-white py-2 px-4 outline-none text-xs font-black uppercase tracking-widest cursor-pointer"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                </div>

                                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block"></div>

                                <button
                                    onClick={exportToExcel}
                                    className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
                                >
                                    <Download className="h-4 w-4" />
                                    Excel
                                </button>
                                
                                <button
                                    onClick={exportToPDF}
                                    className="flex items-center gap-2.5 bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/20"
                                >
                                    <FileText className="h-4 w-4" />
                                    PDF
                                </button>

                                <button
                                    onClick={exportMonthlyRecap}
                                    disabled={exportingMonthly}
                                    className="flex items-center gap-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-900/10 disabled:opacity-50"
                                >
                                    {exportingMonthly ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                                    Rekap Bulanan
                                </button>
                            </div>
                        </div>

                        {selectedClass && (
                            <div className="bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-all">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                            <tr>
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Data Siswa</th>
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Nomor Induk (NIS)</th>
                                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">Status Kehadiran</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                            {classStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-10 py-20 text-center">
                                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                                            <Users className="h-12 w-12" />
                                                            <p className="text-sm font-black uppercase tracking-widest">Database Kosong</p>
                                                        </div>
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
                                                        <tr key={student.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-300">
                                                            <td className="px-10 py-6">
                                                                <div className="flex items-center gap-5">
                                                                    <div className="h-12 w-12 bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-110 transition-transform">
                                                                        {student.full_name?.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-black text-slate-900 dark:text-white block text-base tracking-tight">{student.full_name}</span>
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Siswa Aktif</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-10 py-6">
                                                                <span className="font-black text-slate-500 dark:text-slate-400 font-mono text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                                                                    {student.nis}
                                                                </span>
                                                            </td>
                                                            <td className="px-10 py-6 text-right">
                                                                {isToday ? (
                                                                    <div className="relative inline-block">
                                                                        <select
                                                                            value={currentStatus || 'alpha'}
                                                                            onChange={(e) => updateStatus(student.id, e.target.value)}
                                                                            className={`appearance-none pl-6 pr-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${statusInfo.color} dark:bg-opacity-20 border-2 border-transparent hover:border-blue-500/30 transition-all shadow-sm`}
                                                                        >
                                                                            {STATUS_OPTIONS.map(opt => (
                                                                                <option key={opt.value} value={opt.value} className="dark:bg-slate-900 text-black dark:text-white font-bold">{opt.label}</option>
                                                                            ))}
                                                                        </select>
                                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                                            <ArrowUpRight className="h-3 w-3 rotate-90" />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] ${statusInfo.color} dark:bg-opacity-20 shadow-sm`}>
                                                                        {currentStatus ? (
                                                                            <>
                                                                                <CheckCircle2 className="h-3.5 w-3.5" />
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
