'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { getDeviceId } from '@/lib/utils';
import {
    LogIn,
    School,
    ShieldAlert,
    Eye,
    EyeOff,
    Fingerprint,
    Loader2,
    Moon,
    Sun
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import Link from 'next/link';

export default function LoginPage() {
    const { theme, toggleTheme } = useTheme();
    const [identifier, setIdentifier] = useState(''); // Bisa NIS atau Email
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        // Load remembered NIS/Email
        const savedId = localStorage.getItem('remembered_id');
        if (savedId) {
            setIdentifier(savedId);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const input = identifier.trim();

            // 1. Unified Search: Check BOTH tables for identifier (Email, NIP, or NIS)
            // Handle as Teacher search first
            const { data: teacher } = await supabase
                .from('teachers')
                .select('*')
                .or(`email.eq.${input},nip.eq.${input}`)
                .maybeSingle();

            // Handle as Student search
            const { data: student } = await supabase
                .from('students')
                .select('*')
                .or(`recovery_email.eq.${input},nis.eq.${input}`)
                .maybeSingle();

            if (teacher) {
                // ==========================================
                // LOGIN GURU / ADMIN (Database-driven)
                // ==========================================
                const teacherPassword = teacher.password || '123456';
                if (teacherPassword !== password) {
                    throw new Error(password === '' ? 'Password wajib diisi!' : 'Password salah!');
                }

                // Set Cookie for Middleware (valid for 7 days)
                const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
                document.cookie = `user_role=${teacher.role || 'teacher'}; path=/; expires=${expires}`;
                document.cookie = `user_session=${teacher.id}; path=/; expires=${expires}`;

                // Silent Auth (Optional)
                if (teacher.email) {
                    await supabase.auth.signInWithPassword({ email: teacher.email, password }).catch(() => { });
                }

                // Redirect
                let redirectUrl = '/dashboard/teacher';
                if (teacher.role === 'admin') redirectUrl = '/dashboard/admin';

                if (rememberMe) localStorage.setItem('remembered_id', input);
                else localStorage.removeItem('remembered_id');

                window.location.href = redirectUrl;

            } else if (student) {
                // ==========================================
                // LOGIN SISWA (Database-driven)
                // ==========================================
                // Siswa menggunakan password, fallback ke 123456 jika belum diset
                const studentPassword = student.password || '123456';
                if (studentPassword !== password) {
                    throw new Error(password === '' ? 'PIN wajib diisi!' : 'PIN salah!');
                }

                // Set Cookie for Middleware
                const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
                document.cookie = `user_role=student; path=/; expires=${expires}`;
                document.cookie = `user_session=${student.id}; path=/; expires=${expires}`;

                // Save Local Session
                const session = {
                    id: student.id,
                    nis: student.nis,
                    full_name: student.full_name,
                    class: student.class,
                    role: 'student',
                    loginAt: new Date().toISOString()
                };
                localStorage.setItem('student_session', JSON.stringify(session));

                if (rememberMe) localStorage.setItem('remembered_id', input);
                else localStorage.removeItem('remembered_id');

                // Redirect
                window.location.href = studentPassword === '123456' ? '/dashboard/student/setup' : '/dashboard/student';

            } else {
                throw new Error('Identitas (NIS/NIP/Email) tidak ditemukan dalam sistem.');
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Login gagal. Periksa kembali kredensial Anda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row transition-colors duration-300">

            {/* Left Side - Illustration (Original UI) */}
            <div className="lg:w-1/2 bg-blue-600 dark:bg-blue-900 p-8 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-8 right-8 z-20">
                    <button
                        onClick={toggleTheme}
                        type="button"
                        className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md border border-white/10 transition-all"
                    >
                        {theme === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl -ml-20 -mb-20"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            <School className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">HadirMu</h1>
                    </div>
                    <div className="bg-blue-500/30 inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 mb-8">
                        <ShieldAlert className="h-4 w-4 text-blue-200" />
                        <span className="text-sm font-medium text-blue-50">Sistem Keamanan Terintegrasi</span>
                    </div>
                </div>

                <div className="relative z-10 my-auto">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                        Absensi Sekolah <br />
                        <span className="text-blue-200">Jadi Lebih Mudah</span>
                    </h2>
                    <p className="text-blue-100 text-lg max-w-md leading-relaxed">
                        Platform presensi digital berbasis QR Code dengan validasi lokasi real-time dan anti-fake GPS.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form (Dual Logic) */}
            <div className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-300 relative">
                <div className="absolute top-8 right-8 lg:hidden">
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-yellow-400 rounded-xl transition-all"
                    >
                        {theme === 'light' ? (
                            <Moon className="h-6 w-6" />
                        ) : (
                            <Sun className="h-6 w-6" />
                        )}
                    </button>
                </div>

                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Selamat Datang</h2>
                        <p className="text-slate-500 dark:text-slate-400">Masuk menggunakan NIS (Siswa) atau Email (Guru)</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                NIS / Email
                            </label>
                            <div className="relative">
                                <School className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Contoh: 12345 atau guru@sekolah.id"
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-blue-500 focus:outline-none text-lg font-medium text-black dark:text-white transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Password / PIN Siswa
                            </label>
                            <div className="relative">
                                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-blue-500 focus:outline-none text-lg font-medium text-black dark:text-white transition-all outline-none"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 dark:bg-slate-900"
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Ingat Saya</span>
                            </label>
                            <Link href="/forgot-password" className="text-sm font-bold text-blue-600 hover:text-blue-700">
                                Lupa Password?
                            </Link>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2">
                                <ShieldAlert className="h-5 w-5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <LogIn className="h-5 w-5" />
                                    Masuk Sekarang
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
