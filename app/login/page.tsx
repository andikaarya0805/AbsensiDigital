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
    Smartphone,
    CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
    const [nis, setNis] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [biometricStatus, setBiometricStatus] = useState<'idle' | 'scanning' | 'success'>('idle');

    const supabase = createClient();

    useEffect(() => {
        // Load remembered NIS
        const savedNis = localStorage.getItem('remembered_nis');
        if (savedNis) {
            setNis(savedNis);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const deviceId = getDeviceId();
            // Allow both raw NIS or full email
            const identifier = nis.includes('@') ? nis.split('@')[0] : nis;
            const email = `${identifier}@hadirmu.school`;

            // Auto-Sync Auth Account
            const syncRes = await fetch('/api/auth/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nis: identifier })
            });
            const syncData = await syncRes.json();

            if (!syncRes.ok && syncRes.status !== 404) {
                console.error("Sync error:", syncData.error);
            }

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Fetch profile for checks
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .maybeSingle();

            if (profileError) throw profileError;
            if (!profile) throw new Error('Profil tidak ditemukan. Hubungi Admin.');

            // 1. Auto-Bind Device (Relaxed Rule)
            // Always update to the current deviceId on login.
            if (profile.device_id !== deviceId) {
                await supabase
                    .from('profiles')
                    .update({ device_id: deviceId })
                    .eq('id', authData.user.id);
            }

            // 3. Remember Me logic
            if (rememberMe) {
                localStorage.setItem('remembered_nis', nis);
            } else {
                localStorage.removeItem('remembered_nis');
            }

            // 4. Force password change if default and first_login is true
            if (profile.first_login && password === '123456') {
                window.location.href = '/change-password';
            } else {
                window.location.href = profile.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBiometric = () => {
        setBiometricStatus('scanning');
        setTimeout(() => {
            setBiometricStatus('success');
            setTimeout(() => setBiometricStatus('idle'), 2000);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center flex-col items-center">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200 mb-4 animate-in zoom-in-50 duration-500">
                        <School className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-center text-4xl font-black tracking-tight text-slate-900">HadirMu</h2>
                    <p className="mt-2 text-slate-500 font-medium">Sistem Presensi Digital Sekolah</p>
                </div>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-6 shadow-[0_20px_50px_rgba(8,112,184,0.07)] sm:rounded-3xl sm:px-12 border border-slate-100 relative overflow-hidden">
                    {/* Subtle Glow Background */}
                    <div className="absolute -top-24 -right-24 h-48 w-48 bg-blue-50 rounded-full blur-3xl opacity-50" />

                    <form className="space-y-6 relative z-10" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 ml-1">Username / NIS</label>
                            <div className="mt-1.5 relative">
                                <input
                                    type="text"
                                    required
                                    className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                    placeholder="Masukkan NIS atau Username"
                                    value={nis}
                                    onChange={(e) => setNis(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 ml-1">Password</label>
                            <div className="mt-1.5 relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                    placeholder="········"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between ml-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">Ingat Saya</span>
                            </label>
                            <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline">Lupa Password?</a>
                        </div>

                        {error && (
                            <div className="rounded-2xl bg-red-50 p-4 border border-red-100 flex items-start gap-3 animate-shake">
                                <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
                                <p className="text-sm text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all active:scale-[0.98]"
                            >
                                {loading ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <LogIn className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        Masuk Sekarang
                                    </>
                                )}
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Atau gunakan</span></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={handleBiometric}
                                    className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-95"
                                >
                                    {biometricStatus === 'scanning' ? (
                                        <div className="h-4 w-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                                    ) : biometricStatus === 'success' ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <Fingerprint className="h-4 w-4" />
                                    )}
                                    Biometric
                                </button>
                                <button
                                    type="button"
                                    className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-95"
                                >
                                    <Smartphone className="h-4 w-4" />
                                    Device ID
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <p className="mt-8 text-center text-sm text-slate-400 font-medium">
                    Masalah saat masuk? <a href="#" className="text-blue-600 font-bold">Hubungi Admin</a>
                </p>
            </div>
        </div>
    );
}
