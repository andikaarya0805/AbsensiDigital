'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Save,
    Loader2,
    User,
    MessageCircle,
    CheckCircle2
} from 'lucide-react';

export default function TeacherProfilePage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        id: '',
        full_name: '',
        email: '',
        whatsapp_number: ''
    });

    const [verifyingWA, setVerifyingWA] = useState(false);
    const [waOTP, setWaOTP] = useState('');
    const [waStep, setWaStep] = useState<'input' | 'otp'>('input');
    const [isWaVerified, setIsWaVerified] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const userSession = document.cookie.split('; ').find(row => row.startsWith('user_session='))?.split('=')[1];
                const userId = user?.id || userSession;

                if (!userId) {
                    router.replace('/login');
                    return;
                }

                const { data, error } = await supabase
                    .from('teachers')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) throw error;
                if (data) {
                    setFormData({
                        id: data.id,
                        full_name: data.full_name || '',
                        email: data.email || '',
                        whatsapp_number: data.whatsapp_number || ''
                    });
                    setIsWaVerified(!!data.whatsapp_number);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                setMessage({ type: 'error', text: 'Gagal memuat data profil.' });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router, supabase]);

    const handleSendWAOTP = async () => {
        if (!formData.whatsapp_number) {
            setMessage({ type: 'error', text: 'Masukkan nomor WhatsApp terlebih dahulu.' });
            return;
        }
        setVerifyingWA(true);
        try {
            const res = await fetch('/api/auth/verify-wa-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    whatsapp_number: formData.whatsapp_number,
                    userId: formData.id,
                    role: 'teacher'
                })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            setWaStep('otp');
            setMessage({ type: 'success', text: 'Kode OTP telah dikirim ke WhatsApp Anda.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setVerifyingWA(false);
        }
    };

    const handleConfirmWAOTP = async () => {
        if (!waOTP) return;
        setVerifyingWA(true);
        try {
            const res = await fetch('/api/auth/verify-wa-confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    whatsapp_number: formData.whatsapp_number,
                    otp: waOTP,
                    userId: formData.id,
                    role: 'teacher'
                })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            setIsWaVerified(true);
            setWaStep('input');
            setMessage({ type: 'success', text: 'Nomor WhatsApp berhasil diverifikasi!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setVerifyingWA(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const response = await fetch('/api/teacher/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: formData.id,
                    full_name: formData.full_name,
                    whatsapp_number: formData.whatsapp_number
                })
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Gagal menyimpan profil');
            }

            setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });

            setTimeout(() => {
                router.push('/dashboard/teacher');
            }, 1500);

        } catch (error: any) {
            console.error("Update error:", error);
            setMessage({ type: 'error', text: 'Gagal menyimpan profil: ' + error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <p className="text-sm font-bold text-slate-400 dark:text-slate-400 animate-pulse">Memuat Profil...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-10 flex items-center gap-4 transition-colors">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </button>
                <h1 className="font-bold text-slate-900 dark:text-white text-lg">Profil Saya</h1>
            </div>

            <main className="max-w-md mx-auto px-6 mt-8 space-y-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {message && (
                        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 border animate-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/50'}`}>
                            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <Loader2 className="h-5 w-5 shrink-0" />}
                            {message.text}
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 transition-colors">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-2">Nama Lengkap</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none text-black dark:text-white font-medium transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-2">Nomor WhatsApp (Reset Password)</label>
                            <div className="space-y-3">
                                <div className="relative">
                                    <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="tel"
                                        value={formData.whatsapp_number}
                                        onChange={(e) => {
                                            setFormData({ ...formData, whatsapp_number: e.target.value });
                                            setIsWaVerified(false);
                                        }}
                                        disabled={isWaVerified}
                                        placeholder="Contoh: 08123456789"
                                        className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none transition-all font-medium ${isWaVerified ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 text-black dark:text-white'}`}
                                    />
                                    {isWaVerified && (
                                        <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    )}
                                </div>

                                {!isWaVerified && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        {waStep === 'input' ? (
                                            <button
                                                type="button"
                                                onClick={handleSendWAOTP}
                                                disabled={verifyingWA || !formData.whatsapp_number}
                                                className="w-full py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2 border border-blue-100 dark:border-blue-800/50"
                                            >
                                                {verifyingWA ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                                                Verifikasi via WhatsApp
                                            </button>
                                        ) : (
                                            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                                <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase">Masukkan OTP WhatsApp</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        value={waOTP}
                                                        onChange={(e) => setWaOTP(e.target.value)}
                                                        placeholder="6 Digit OTP"
                                                        className="flex-1 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500 text-center font-mono font-bold tracking-[0.5em] text-black dark:text-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleConfirmWAOTP}
                                                        disabled={verifyingWA || waOTP.length < 6}
                                                        className="px-6 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        {verifyingWA ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Selesai'}
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setWaStep('input')}
                                                    className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                                                >
                                                    Ganti Nomor?
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {isWaVerified && (
                                    <button
                                        type="button"
                                        onClick={() => setIsWaVerified(false)}
                                        className="text-[10px] text-slate-400 dark:text-slate-500 font-bold hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-1"
                                    >
                                        Ganti Nomor WhatsApp
                                    </button>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-2 ml-1">Nomor ini akan digunakan sebagai satu-satunya cara jika Anda lupa password.</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Simpan Perubahan
                    </button>
                </form>
            </main>
        </div>
    );
}
