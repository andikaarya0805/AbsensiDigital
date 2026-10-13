'use client';

// Imports updated
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getDeviceId } from '@/lib/utils';
import Link from 'next/link';
import {
    CheckCircle2,
    ShieldCheck,
    ShieldAlert,
    Send,
    GraduationCap,
    BookOpen,
    Clock,
    ArrowUpRight,
    ScanLine,
    BellRing
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface StudentSession {
    id: string;
    nis: string;
    full_name: string;
    class: string;
    role: string;
    loginAt: string;
}

export default function StudentDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<StudentSession | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const supabase = createClient();
    const { theme, toggleTheme } = useTheme();

    // State for Verification & Profile
    const [isVerified, setIsVerified] = useState(false); // Changed to false by default to trigger verification check
    const [verificationLink, setVerificationLink] = useState<string | null>(null);
    const verificationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        // Check localStorage session instead of Supabase Auth
        const sessionData = localStorage.getItem('student_session');

        if (!sessionData) {
            window.location.href = '/login';
            return;
        }

        try {
            const session: StudentSession = JSON.parse(sessionData);
            setUser(session);

            // Fetch Latest Profile (including Avatar)
            const fetchFullProfile = async () => {
                const { data, error } = await supabase
                    .from('students')
                    .select('*')
                    .eq('id', session.id)
                    .single();

                if (!error && data) {
                    setProfile(data);
                } else {
                    setProfile(session); // Fallback to session
                }
            };

            fetchFullProfile();

            // Initial Verification Check
            checkVerification(session.nis);
        } catch (e) {
            localStorage.removeItem('student_session');
            window.location.href = '/login';
        }
        // Cleanup on unmount
        return () => {
            if (verificationIntervalRef.current) {
                clearInterval(verificationIntervalRef.current);
            }
        };
    }, []);

    /**
     * Periodically checks if the student's account is verified via Telegram/WA.
     * Generates a verification link if the account is currently unverified.
     */
    const checkVerification = async (nis: string) => {
        try {
            const res = await fetch(`/api/student/verify-token?nis=${nis}`);
            const data = await res.json();
            setIsVerified(data.verified);

            if (!data.verified) {
                // Generate a one-time verification link
                const linkRes = await fetch('/api/student/verify-token', {
                    method: 'POST',
                    body: JSON.stringify({ nis }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const linkData = await linkRes.json();
                
                if (linkData.link) {
                    setVerificationLink(linkData.link);
                } else {
                    console.error("Link Generation Failed:", linkData.error);
                    showToast("Gagal menyiapkan tautan verifikasi. Silakan hubungi admin.", "error");
                }

                // Start polling until the user completes verification on Telegram
                if (verificationIntervalRef.current) clearInterval(verificationIntervalRef.current);
                
                verificationIntervalRef.current = setInterval(async () => {
                    const pollRes = await fetch(`/api/student/verify-token?nis=${nis}`);
                    const pollData = await pollRes.json();
                    if (pollData.verified) {
                        setIsVerified(true);
                        if (verificationIntervalRef.current) {
                            clearInterval(verificationIntervalRef.current);
                            verificationIntervalRef.current = null;
                        }
                        showToast("Akun Anda Berhasil Diverifikasi!", "success");
                    }
                }, 3000); // Check status every 3 seconds
            }
        } catch (e) {
            console.error("Verification Check Error:", e);
        }
    };

    if (!profile) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    return (
        <>
            {/* Premium Toast Notification */}
            {toast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-100 w-full max-w-xs animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className={`mx-4 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${toast.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-red-500/90 text-white border-red-400'
                        }`}>
                        {toast.type === 'success' ? (
                            <CheckCircle2 className="h-6 w-6 shrink-0 animate-bounce" />
                        ) : (
                            <ShieldAlert className="h-6 w-6 shrink-0" />
                        )}
                        <p className="text-sm font-bold tracking-tight leading-snug">{toast.message}</p>
                    </div>
                </div>
            )}

            {/* VERIFICATION OVERLAY */}
            {!isVerified && profile && (
                <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95">
                        <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                            <ShieldCheck className="h-10 w-10 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Verifikasi Akun</h2>
                            <p className="text-slate-500 mt-2">Demi keamanan, silakan hubungkan akun dengan Telegram Anda.</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <p className="text-xs text-slate-400 mb-2">Langkah:</p>
                            <ol className="text-sm text-slate-600 text-left list-decimal list-inside space-y-2">
                                <li>Klik tombol di bawah ini.</li>
                                <li>Aplikasi Telegram akan terbuka.</li>
                                <li>Klik <strong>Start</strong> di bot.</li>
                                <li>Tunggu sebentar, akun otomatis aktif.</li>
                            </ol>
                        </div>

                        {verificationLink ? (
                            <a
                                href={verificationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-blue-200 dark:shadow-none active:scale-95"
                            >
                                <Send className="h-5 w-5" />
                                Buka Telegram
                            </a>
                        ) : (
                            <div className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-400 font-bold py-4 px-6 rounded-2xl animate-pulse">
                                <div className="h-5 w-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>
                                Menyiapkan Tautan...
                            </div>
                        )}

                        <p className="text-xs text-slate-400">Menunggu konfirmasi Telegram...</p>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto mt-2 space-y-6 pb-12">
                {/* School Welcome Section - Premium Bento Header */}
                <div className="relative overflow-hidden bg-linear-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-[40px] p-10 text-white shadow-2xl shadow-blue-500/20 dark:shadow-none transition-all duration-700 group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-32 -mb-32 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 shadow-inner">
                                <GraduationCap className="h-3.5 w-3.5 text-blue-200" />
                                Tahun Pelajaran 2025/2026
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-4xl font-black tracking-tighter leading-none italic">
                                    Selamat Belajar, <br/>
                                    <span className="text-transparent bg-clip-text bg-linear-to-r from-white to-blue-200">{profile.full_name.split(' ')[0]}!</span>
                                </h1>
                                <p className="text-blue-100/70 text-sm font-medium tracking-wide">Teruslah melangkah, masa depan cerah menantimu.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="relative group/stat">
                                <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl opacity-0 group-hover/stat:opacity-100 transition-opacity"></div>
                                <div className="relative text-center p-5 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/10 min-w-[100px] shadow-xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Kehadiran</p>
                                    <p className="text-3xl font-black tracking-tighter">98<span className="text-sm opacity-60 ml-0.5">%</span></p>
                                </div>
                            </div>
                            <div className="relative group/stat">
                                <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl opacity-0 group-hover/stat:opacity-100 transition-opacity"></div>
                                <div className="relative text-center p-5 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/10 min-w-[100px] shadow-xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Poin</p>
                                    <p className="text-3xl font-black tracking-tighter">120</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Main Action Card - Bento Large (8 Cols) */}
                    <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 h-full flex flex-col justify-center items-center text-center group">
                        <div className="p-6 bg-blue-50 dark:bg-blue-900/30 rounded-[32px] mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                            <ScanLine className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic mb-4">Mulai Presensi</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-sm text-sm font-medium">Buka pemindai dan arahkan kamera perangkat Anda ke QR Code yang ditampilkan oleh guru untuk mencatat kehadiran dengan cepat.</p>
                        <Link href="/dashboard/student/scan" className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20 inline-flex items-center gap-3">
                            <ScanLine className="h-5 w-5" />
                            Buka Scanner
                        </Link>
                    </div>

                    {/* Info Column - Bento Small Stack (4 Cols) */}
                    <div className="lg:col-span-4 space-y-6 flex flex-col h-full">
                        {/* Class Info */}
                        <div className="bg-linear-to-br from-indigo-600 to-blue-700 rounded-[40px] p-8 text-white shadow-xl shadow-indigo-500/20 transition-all duration-500 hover:scale-[1.03] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                                <BookOpen className="h-24 w-24" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl shadow-inner border border-white/10">
                                        <BookOpen className="h-6 w-6" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Info Kelas</span>
                                </div>
                                <h4 className="text-3xl font-black leading-none tracking-tighter uppercase italic">{profile.class}</h4>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                                    <p className="text-xs font-black uppercase tracking-widest text-indigo-100/80">Siswa Aktif</p>
                                </div>
                            </div>
                        </div>

                        {/* Schedule Info */}
                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <Clock className="h-6 w-6 text-slate-400" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Jadwal</span>
                            </div>
                            
                            <div className="space-y-8 flex-1 flex flex-col justify-center">
                                <div className="relative pl-6 border-l-2 border-blue-600">
                                    <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Sedang Berlangsung</p>
                                    <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">07:15 - 08:45</h5>
                                    <p className="text-xs font-bold text-slate-500 mt-0.5">Matematika Wajib</p>
                                </div>
                                
                                <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 opacity-60">
                                    <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Mendatang</p>
                                    <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">09:00 - 10:30</h5>
                                    <p className="text-xs font-bold text-slate-500 mt-0.5">Bahasa Indonesia</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Tip - Bento Banner */}
                <div className="group relative overflow-hidden flex items-center gap-4 px-8 py-6 bg-slate-900/5 dark:bg-white/5 rounded-[32px] border border-slate-100 dark:border-white/5 transition-all duration-500 hover:bg-slate-900/10">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm group-hover:rotate-12 transition-transform duration-500">
                        <BellRing className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-0.5 italic">Tips Presensi</p>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                            Pastikan kamera fokus pada <span className="text-blue-600 font-black">QR Code Guru</span> untuk presensi yang cepat dan akurat.
                        </p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0" />
                </div>
            </div>
        </>
    );
}
