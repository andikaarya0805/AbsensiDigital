'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [inputToken, setInputToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validatePassword = (pwd: string) => {
        if (pwd.length < 6) return 'Password minimal 6 karakter.';
        if (!/^[A-Z]/.test(pwd)) return 'Password harus diawali huruf besar.';
        if (!/\d/.test(pwd)) return 'Password harus mengandung angka.';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password harus mengandung karakter spesial.';
        return null;
    };

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/request-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ whatsapp_number: whatsappNumber })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Gagal mengirim permintaan.');

            setStep('verify');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndReset = async (e: React.FormEvent) => {
        e.preventDefault();

        const pwdError = validatePassword(newPassword);
        if (pwdError) {
            setError(pwdError);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/verify-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    whatsapp_number: whatsappNumber,
                    token: inputToken,
                    newPassword
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Gagal mereset password.');

            setSuccess(true);
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 border border-slate-100">
                <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-6 font-medium transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Login
                </Link>

                <div className="text-center mb-8">
                    <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Lupa Password?</h1>

                    {step === 'request' ? (
                        <p className="text-slate-500 text-sm mt-2">
                            Masukkan Nomor WhatsApp Anda. Kode OTP reset akan dikirimkan langsung via <strong>WhatsApp</strong>.
                        </p>
                    ) : (
                        <p className="text-slate-500 text-sm mt-2">
                            Masukkan Kode OTP dari WhatsApp & Password Baru Anda.
                        </p>
                    )}
                </div>

                {success ? (
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center animate-fade-in">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <h3 className="font-bold text-green-800 text-lg mb-2">Password Berhasil Diubah!</h3>
                        <p className="text-green-700 text-sm">
                            Silakan login dengan password baru Anda. Mengalihkan...
                        </p>
                    </div>
                ) : (
                    <>
                        {step === 'request' ? (
                            <form onSubmit={handleRequest} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nomor WhatsApp</label>
                                    <input
                                        type="tel"
                                        value={whatsappNumber}
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                        placeholder="Contoh: 08123456789"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:outline-none text-black transition-all"
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-100">
                                        <AlertCircle className="h-5 w-5 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                                >
                                    {loading ? 'Mengirim...' : (
                                        <>
                                            Kirim OTP WhatsApp
                                            <ArrowRight className="h-5 w-5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyAndReset} className="space-y-6 animate-in slide-in-from-right-8">
                                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-xs text-green-800 mb-4">
                                    <p className="font-bold mb-1">Aturan Password Baru:</p>
                                    <ul className="list-disc ml-4 space-y-0.5">
                                        <li>Minimal 6 karakter</li>
                                        <li>Diawali Huruf Besar</li>
                                        <li>Mengandung Angka</li>
                                        <li>Mengandung Karakter Spesial (!@#$)</li>
                                    </ul>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Kode OTP</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={inputToken}
                                            onChange={(e) => setInputToken(e.target.value)}
                                            placeholder="6 digit kode"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:outline-none text-lg font-bold tracking-widest text-center"
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Password Baru</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min. 6 karakter (Kriteria khusus)"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:outline-none text-black"
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-100">
                                        <AlertCircle className="h-5 w-5 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-100"
                                >
                                    {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
