'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { ShieldCheck, MessageCircle, Lock, ArrowRight, AlertCircle, CheckCircle2, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SetupAccountPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [waOTP, setWaOTP] = useState('');
    const [waStep, setWaStep] = useState<'input' | 'otp'>('input');
    const [isWaVerified, setIsWaVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verifyingWA, setVerifyingWA] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [studentId, setStudentId] = useState('');
    const [studentName, setStudentName] = useState('');

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        // Load session
        const sessionData = localStorage.getItem('student_session');
        if (!sessionData) {
            window.location.href = '/login';
            return;
        }

        try {
            const session = JSON.parse(sessionData);
            setStudentId(session.id);
            setStudentName(session.full_name || 'Siswa');
        } catch (e) {
            window.location.href = '/login';
        }
    }, []);

    const validatePassword = (pwd: string) => {
        if (pwd.length < 6) return 'Password minimal 6 karakter.';
        if (!/^[A-Z]/.test(pwd)) return 'Password harus diawali huruf besar.';
        if (!/\d/.test(pwd)) return 'Password harus mengandung angka.';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password harus mengandung minimal satu karakter spesial.';
        return null;
    };

    const handleSendWAOTP = async () => {
        if (!whatsappNumber) {
            setError('Masukkan nomor WhatsApp terlebih dahulu.');
            return;
        }
        setVerifyingWA(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/verify-wa-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    whatsapp_number: whatsappNumber,
                    userId: studentId,
                    role: 'student'
                })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            setWaStep('otp');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setVerifyingWA(false);
        }
    };

    const handleConfirmWAOTP = async () => {
        if (!waOTP) return;
        setVerifyingWA(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/verify-wa-confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    whatsapp_number: whatsappNumber,
                    otp: waOTP,
                    userId: studentId,
                    role: 'student'
                })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            setIsWaVerified(true);
            setWaStep('input');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setVerifyingWA(false);
        }
    };

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();

        // Complex Validation
        const pwdError = validatePassword(password);
        if (pwdError) {
            setError(pwdError);
            return;
        }

        if (password === '123456') {
            setError('Jangan gunakan password default 123456!');
            return;
        }
        if (password !== confirmPassword) {
            setError('Konfirmasi password tidak cocok.');
            return;
        }
        if (!isWaVerified) {
            setError('Harap verifikasi nomor WhatsApp Anda terlebih dahulu.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const sessionData = localStorage.getItem('student_session');
            if (!sessionData) throw new Error("Sesi habis");
            const session = JSON.parse(sessionData);

            // Update Database via API Route
            const response = await fetch('/api/student/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: session.id,
                    password: password,
                    whatsapp_number: whatsappNumber
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Gagal menyimpan data.');
            }

            // Update local session
            session.whatsapp_number = whatsappNumber;
            localStorage.setItem('student_session', JSON.stringify(session));

            setSuccess(true);
            setTimeout(() => {
                window.location.href = '/dashboard/student';
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan data.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans text-black dark:text-white transition-colors">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md p-8 border border-slate-100 dark:border-slate-800 transition-colors">

                {success ? (
                    <div className="text-center py-8 animate-in zoom-in">
                        <div className="bg-green-100 dark:bg-green-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Akun Diamankan!</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Password baru dan nomor WhatsApp berhasil disimpan.</p>
                        <p className="text-green-600 dark:text-green-400 font-medium mt-4 text-sm">Mengalihkan ke dashboard...</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <div className="bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Amankan Akunmu</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                                Hai <strong>{studentName}</strong>, demi keamanan, kamu wajib mengganti PIN default menjadi <strong>Password</strong> yang kuat.
                            </p>
                        </div>

                        <form onSubmit={handleSetup} className="space-y-6">
                            {/* Password Rules Info */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-4 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                                <p className="font-bold flex items-center gap-1">
                                    <Lock className="h-3 w-3" /> Aturan Password:
                                </p>
                                <ul className="list-disc ml-4">
                                    <li>Minimal 6 karakter</li>
                                    <li>Diawali Huruf Besar (A-Z)</li>
                                    <li>Mengandung Angka (0-9)</li>
                                    <li>Mengandung Karakter Spesial (!@#$)</li>
                                </ul>
                            </div>

                            {/* Password Section */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Password Baru</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min. 6 karakter"
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none text-black dark:text-white font-medium transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Konfirmasi Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Ulangi password baru"
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none text-black dark:text-white font-medium transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-800" />

                            {/* WhatsApp Section */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nomor WhatsApp (Aktif)</label>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Digunakan untuk reset password jika lupa.</p>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type="tel"
                                            value={whatsappNumber}
                                            onChange={(e) => {
                                                setWhatsappNumber(e.target.value);
                                                setIsWaVerified(false);
                                            }}
                                            placeholder="Contoh: 08123456789"
                                            disabled={isWaVerified || loading}
                                            className={`w-full pl-12 pr-4 py-3.5 rounded-xl border focus:outline-none font-medium transition-all ${isWaVerified ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 text-black dark:text-white'}`}
                                            required
                                        />
                                        {isWaVerified && (
                                            <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600 dark:text-emerald-400 transition-colors" />
                                        )}
                                    </div>

                                    {!isWaVerified && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            {waStep === 'input' ? (
                                                <button
                                                    type="button"
                                                    onClick={handleSendWAOTP}
                                                    disabled={verifyingWA || !whatsappNumber}
                                                    className="w-full py-3.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors flex items-center justify-center gap-2 border border-indigo-100 dark:border-indigo-800/50"
                                                >
                                                    {verifyingWA ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
                                                    Verifikasi via WhatsApp
                                                </button>
                                            ) : (
                                                <div className="space-y-4 p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                                                    <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Masukkan OTP WhatsApp</p>
                                                    <div className="flex gap-3">
                                                        <input
                                                            type="text"
                                                            maxLength={6}
                                                            value={waOTP}
                                                            onChange={(e) => setWaOTP(e.target.value)}
                                                            placeholder="6 Digit"
                                                            className="flex-1 px-4 py-3 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-500 text-center font-mono font-bold tracking-[0.5em] text-black dark:text-white text-lg"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleConfirmWAOTP}
                                                            disabled={verifyingWA || waOTP.length < 6}
                                                            className="px-8 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-200 dark:shadow-indigo-900/20"
                                                        >
                                                            {verifyingWA ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Selesai'}
                                                        </button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setWaStep('input')}
                                                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                                                    >
                                                        Ganti Nomor?
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-100 dark:border-red-800/50 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 active:scale-95"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Menyimpan...</span>
                                    </div>
                                ) : (
                                    <>
                                        Simpan & Lanjutkan
                                        <ArrowRight className="h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
