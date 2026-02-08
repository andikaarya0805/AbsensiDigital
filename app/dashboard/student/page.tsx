'use client';

// Imports updated
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Scanner from '@/components/Scanner';
import {
    CheckCircle2,
    XCircle,
    User,
    LogOut,
    ShieldCheck,
    ShieldAlert,
    Settings,
    BellRing,
    Loader2,
    Moon,
    Sun
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
    const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const supabase = createClient();
    const { theme, toggleTheme } = useTheme();

    // State for Verification & Profile
    const [isVerified, setIsVerified] = useState(true); // Default true to avoid flash, check on load
    const [verificationLink, setVerificationLink] = useState('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
    }, []);

    const checkVerification = async (nis: string) => {
        try {
            const res = await fetch(`/api/student/verify-token?nis=${nis}`);
            const data = await res.json();
            setIsVerified(data.verified);

            if (!data.verified) {
                // Generate Link if not verified
                const linkRes = await fetch('/api/student/verify-token', {
                    method: 'POST',
                    body: JSON.stringify({ nis }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const linkData = await linkRes.json();
                setVerificationLink(linkData.link);

                // Start Polling
                const interval = setInterval(async () => {
                    const pollRes = await fetch(`/api/student/verify-token?nis=${nis}`);
                    const pollData = await pollRes.json();
                    if (pollData.verified) {
                        setIsVerified(true);
                        clearInterval(interval);
                        showToast("Akun Anda Berhasil Diverifikasi!", "success");
                    }
                }, 3000); // Check every 3 seconds

                // Cleanup interval on unmount (not handled here cleanly but OK for simple page)
            }
        } catch (e) {
            console.error("Verification Check Error:", e);
        }
    };

    const handleScan = useCallback(async (decodedText: string) => {
        if (!isVerified) {
            showToast("Harap verifikasi akun Telegram Anda terlebih dahulu!", "error");
            return;
        }

        if (status === 'success') return;
        if (!user) {
            setStatus('error');
            setMessage('Session tidak ditemukan. Silakan login ulang.');
            return;
        }

        setStatus('scanning');

        try {
            // Security Config - must match teacher settings
            const QR_REFRESH_SECONDS = 30;
            const QR_SECRET = process.env.NEXT_PUBLIC_QR_SECRET || 'FALLBACK_SECRET';

            // Expected format: HADIR_SESSION_{timestamp}_{secret}_{sessionName}
            const parts = decodedText.split('_');
            console.log('Scanned QR:', decodedText);

            if (parts.length < 4 || parts[0] !== 'HADIR' || parts[1] !== 'SESSION') {
                throw new Error('QR Code tidak valid! (format salah)');
            }

            const scannedTimestamp = parseInt(parts[2]);
            const scannedSecret = parts[3];
            const sessionName = parts.length >= 5 ? parts.slice(4).join('_') : 'DEFAULT';

            // Validate secret
            if (scannedSecret !== QR_SECRET) {
                throw new Error('QR Code tidak valid!');
            }

            // Validate timestamp (check if within valid window - allow 1 window tolerance)
            const currentTimestamp = Math.floor(Date.now() / (QR_REFRESH_SECONDS * 1000));
            if (Math.abs(scannedTimestamp - currentTimestamp) > 1) {
                throw new Error('QR Code sudah kadaluarsa! Minta guru untuk refresh QR.');
            }

            // RATE LIMITING: Check if already scanned this session today
            const today = new Date().toISOString().split('T')[0];
            const { data: existingAttendance } = await supabase
                .from('attendance')
                .select('id')
                .eq('student_id', user.id)
                .eq('session_name', sessionName)
                .gte('timestamp', `${today}T00:00:00`)
                .lte('timestamp', `${today}T23:59:59`)
                .single();

            if (existingAttendance) {
                throw new Error('Kamu sudah absen untuk sesi ini hari ini!');
            }

            // Submit Attendance
            console.log("Submitting attendance for:", user.id);
            const { data, error: attError } = await supabase
                .from('attendance')
                .insert({
                    student_id: user.id,
                    status_type: 'hadir',
                    session_name: sessionName
                })
                .select();

            if (attError) {
                console.error("Attendance Insert Error:", attError);
                throw attError;
            }

            console.log("Attendance recorded:", data);
            setStatus('success');
            setMessage('Presensi berhasil dicatat!');
        } catch (err: any) {
            console.error("HandleScan Error:", err.message);
            setStatus('error');
            setMessage(err.message);

            // Auto-reset after 3 seconds to allow scanning again
            setTimeout(() => {
                setStatus('idle');
                window.location.reload(); // Reload to reset scanner
            }, 3000);
        }
    }, [user, status, supabase, isVerified]);

    if (!profile) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 relative overflow-hidden transition-colors duration-300">

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
            {!isVerified && (
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
                                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
                            >
                                Buka Telegram
                            </a>
                        ) : (
                            <div className="animate-pulse bg-slate-200 h-12 w-full rounded-xl"></div>
                        )}

                        <p className="text-xs text-slate-400">Menunggu konfirmasi Telegram...</p>
                    </div>
                </div>
            )}


            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-10 transition-colors duration-300">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Profile Avatar Trigger */}
                        <div onClick={() => setShowProfileMenu(true)} className="relative cursor-pointer hover:opacity-80 transition-opacity">
                            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-green-500 h-4 w-4 rounded-full border-2 border-white dark:border-slate-800"></div>
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 dark:text-white leading-tight">{profile.full_name}</h2>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">NIS: {profile.nis}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-yellow-400 rounded-xl transition-all border-none"
                            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        >
                            {theme === 'light' ? (
                                <Moon className="h-6 w-6" />
                            ) : (
                                <Sun className="h-6 w-6" />
                            )}
                        </button>
                        <button
                            onClick={() => setShowProfileMenu(true)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-blue-600"
                        >
                            <Settings className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile Menu Sheet/Modal */}
            {
                showProfileMenu && (
                    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowProfileMenu(false)}>
                        <div
                            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900">Menu Akun</h3>

                            <div className="space-y-2">
                                <button
                                    onClick={() => router.push('/dashboard/student/edit')}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                                >
                                    <span className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg"><User className="h-5 w-5 text-blue-600 dark:text-blue-400" /></span>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Edit Profil</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Ganti foto & data diri</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        localStorage.removeItem('student_session');
                                        window.location.href = '/login';
                                    }}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-left group"
                                >
                                    <span className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200"><LogOut className="h-5 w-5 text-red-600" /></span>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-red-700">Keluar</h4>
                                        <p className="text-xs text-red-500">Log out dari perangkat ini</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <main className="max-w-md mx-auto px-6 mt-6 space-y-6">

                {/* Status Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${isVerified ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-amber-50 dark:bg-amber-900/30'}`}>
                            {isVerified ? <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" /> : <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{isVerified ? 'Akun Terverifikasi' : 'Belum Verifikasi'}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{isVerified ? 'Fitur presensi aktif' : 'Hubungkan Telegram'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard/student/edit')}
                        className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors group"
                        title="Edit Profil"
                    >
                        <User className="h-5 w-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </button>
                </div>

                {/* Action Area */}
                {status === 'success' ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-10 text-center animate-in zoom-in-95 duration-300">
                        <div className="bg-emerald-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Success!</h2>
                        <p className="text-slate-600 mt-2">{message}</p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="mt-6 text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                            Scan Another?
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Only show scanner if Verified */}
                        {isVerified ? (
                            <>
                                <Scanner onScanSuccess={handleScan} />
                                {status === 'error' && (
                                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-3">
                                            <XCircle className="h-5 w-5 text-red-600" />
                                            <p className="text-sm text-red-600 font-medium">{message}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setStatus('idle');
                                                window.location.reload();
                                            }}
                                            className="text-xs font-bold text-red-700 underline underline-offset-2 w-fit"
                                        >
                                            Coba Lagi
                                        </button>
                                    </div>
                                )}
                                <p className="text-center text-xs text-slate-600 dark:text-slate-400 font-bold">
                                    Arahkan kamera ke kode QR guru
                                </p>
                            </>
                        ) : (
                            <div className="h-64 bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                                <ShieldAlert className="h-10 w-10 mb-2" />
                                <p className="text-sm font-medium">Scanner Terkunci</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div >
    );
}
