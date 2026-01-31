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
    const [timeLeft, setTimeLeft] = useState(120);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Class Attendance State
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [classStudents, setClassStudents] = useState<any[]>([]);
    const [presentStudentIds, setPresentStudentIds] = useState<Set<string>>(new Set());

    const supabase = createClient();

    // Generate Dynamic QR Value
    const generateQR = () => {
        const timestamp = Math.floor(Date.now() / 120000); // Changes every 2 minutes
        const secret = "HADIRMU_SECRET_123"; // In production, use class session ID
        setQrValue(`HADIR_SESSION_${timestamp}_${secret}`);
        setTimeLeft(120);
    };

    useEffect(() => {
        generateQR();
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    generateQR();
                    return 120;
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

    // Fetch Classes on Mount
    useEffect(() => {
        const fetchClasses = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('class')
                .not('class', 'is', null)
                .neq('class', '') // Ensure empty strings are ignored
                .order('class', { ascending: true });

            if (error) {
                console.error("Error fetching classes:", error);
                return;
            }

            if (data) {
                // Get unique classes
                // @ts-ignore
                const uniqueClasses = Array.from(new Set(data.map(item => item.class)));
                setClasses(uniqueClasses as string[]);
            }
        };
        fetchClasses();
    }, []);

    // Fetch Class Students & Today's Attendance
    useEffect(() => {
        if (!selectedClass) return;

        const fetchClassData = async () => {
            // Fetch students in class
            const { data: students, error: studentError } = await supabase
                .from('profiles')
                .select('*')
                .eq('class', selectedClass)
                .eq('role', 'student') // Ensure we only get students
                .order('full_name');

            if (students) setClassStudents(students);

            // Fetch attendance for SELECTED DATE
            const [y, m, d] = selectedDate.split('-').map(Number);
            const startOfDay = new Date(y, m - 1, d, 0, 0, 0);
            const endOfDay = new Date(y, m - 1, d, 23, 59, 59);

            const { data: attendanceData, error: attError } = await supabase
                .from('attendance')
                .select('student_id')
                .gte('timestamp', startOfDay.toISOString())
                .lte('timestamp', endOfDay.toISOString());

            if (attendanceData) {
                const presentIds = new Set(attendanceData.map(a => a.student_id));
                setPresentStudentIds(presentIds);
            }
        };

        fetchClassData();

        // Optional: Realtime subscription for this class could be added here
        const channel = supabase
            .channel(`class_attendance_${selectedClass}`)
            .on(
                'postgres_changes' as any,
                { event: 'INSERT', schema: 'public', table: 'attendance' },
                (payload: any) => {
                    // Update if the new attendance belongs to a student we are watching
                    // But we only have student_id in payload, so we can just add to set
                    setPresentStudentIds(prev => {
                        const newSet = new Set(prev);
                        newSet.add(payload.new.student_id);
                        return newSet;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedClass, selectedDate]);

    // Manual Attendance Toggle
    const toggleAttendance = async (studentId: string, isCurrentlyPresent: boolean) => {
        // Use LOCAL date (not UTC) for proper timezone handling
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Only allow manual toggle for TODAY
        if (selectedDate !== todayStr) {
            alert('Hanya bisa mengubah presensi untuk hari ini!');
            return;
        }

        if (isCurrentlyPresent) {
            // Remove attendance
            const [y, m, d] = selectedDate.split('-').map(Number);
            const startOfDay = new Date(y, m - 1, d, 0, 0, 0);
            const endOfDay = new Date(y, m - 1, d, 23, 59, 59);

            await supabase
                .from('attendance')
                .delete()
                .eq('student_id', studentId)
                .gte('timestamp', startOfDay.toISOString())
                .lte('timestamp', endOfDay.toISOString());

            setPresentStudentIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(studentId);
                return newSet;
            });
        } else {
            // Add manual attendance
            await supabase
                .from('attendance')
                .insert({
                    student_id: studentId,
                    timestamp: new Date().toISOString(),
                    qr_token: 'MANUAL_ENTRY'
                });

            setPresentStudentIds(prev => {
                const newSet = new Set(prev);
                newSet.add(studentId);
                return newSet;
            });
        }
    };

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
                                        style={{ width: `${(timeLeft / 120) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    generateQR();
                                }}
                                className="mt-6 flex items-center gap-2 text-sm text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Regenerate Manually
                            </button>
                        </div>
                    </div>


                    {/* Class Attendance Section */}
                    <div className="lg:col-span-2 space-y-6 pt-10 border-t border-slate-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Rekap Absensi Per Kelas</h2>
                                <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="date"
                                    className="bg-white border border-slate-200 text-slate-900 py-3 px-4 rounded-xl font-medium focus:outline-none focus:border-blue-500"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                                <div className="relative">
                                    <select
                                        className="appearance-none bg-white border border-slate-200 text-slate-900 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-blue-500 font-bold min-w-[200px]"
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                    >
                                        <option value="">Pilih Kelas...</option>
                                        {classes.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedClass && (
                            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">NIS</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {classStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                                                        Tidak ada siswa di kelas ini.
                                                    </td>
                                                </tr>
                                            ) : (
                                                classStudents.map((student) => {
                                                    const isPresent = presentStudentIds.has(student.id);
                                                    return (
                                                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                                                                        {student.full_name?.charAt(0)}
                                                                    </div>
                                                                    <span className="font-bold text-slate-900">{student.full_name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 font-medium text-slate-500 font-mono text-sm">
                                                                {student.nis}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleAttendance(student.id, isPresent)}
                                                                    className="cursor-pointer hover:scale-105 transition-transform"
                                                                    title={isPresent ? 'Klik untuk tandai ABSEN' : 'Klik untuk tandai HADIR'}
                                                                >
                                                                    {isPresent ? (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                                            <CheckCircle className="h-3.5 w-3.5" />
                                                                            HADIR
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700">
                                                                            <LogOut className="h-3.5 w-3.5 rotate-180" />
                                                                            ABSEN
                                                                        </span>
                                                                    )}
                                                                </button>
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
