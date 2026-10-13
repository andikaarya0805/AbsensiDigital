'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getDeviceId } from '@/lib/utils';
import Scanner from '@/components/Scanner';
import { CheckCircle2, XCircle, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';

interface StudentSession {
    id: string;
    nis: string;
    full_name: string;
    class: string;
    role: string;
    loginAt: string;
}

export default function ScanPage() {
    const router = useRouter();
    const [user, setUser] = useState<StudentSession | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const supabase = createClient();
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        const sessionData = localStorage.getItem('student_session');
        if (!sessionData) {
            router.replace('/login');
            return;
        }

        try {
            const session: StudentSession = JSON.parse(sessionData);
            setUser(session);

            const fetchFullProfile = async () => {
                const { data, error } = await supabase
                    .from('students')
                    .select('*')
                    .eq('id', session.id)
                    .single();

                if (!error && data) {
                    setProfile(data);
                } else {
                    setProfile(session);
                }
            };

            fetchFullProfile();

            // Check Verification Status
            const checkVerification = async () => {
                try {
                    const res = await fetch(`/api/student/verify-token?nis=${session.nis}`);
                    const data = await res.json();
                    setIsVerified(data.verified);
                } catch (e) {
                    console.error("Verification Check Error:", e);
                }
            };
            checkVerification();
        } catch (e) {
            localStorage.removeItem('student_session');
            router.replace('/login');
        }
    }, [router, supabase]);

    const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Browser Anda tidak mendukung lokasi (GPS)'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => {
                    let msg = 'Gagal mengambil lokasi.';
                    if (err.code === 1) msg = 'Harap izinkan akses lokasi (GPS) untuk presensi.';
                    reject(new Error(msg));
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        });
    };

    const handleScan = useCallback(async (decodedText: string) => {
        if (!isVerified) {
            setStatus('error');
            setMessage("Harap verifikasi akun Telegram Anda terlebih dahulu di Dashboard!");
            return;
        }

        if (status === 'success' || status === 'scanning') return;
        if (!user) {
            setStatus('error');
            setMessage('Session tidak ditemukan. Silakan login ulang.');
            return;
        }

        setStatus('scanning');
        setMessage('Sedang memproses...');

        try {
            let location = { lat: 0, lng: 0 };
            try {
                location = await getCurrentLocation();
            } catch (locErr: any) {
                throw locErr;
            }

            const currentDeviceId = getDeviceId();
            if (profile?.web_device_id && profile.web_device_id !== currentDeviceId) {
                throw new Error('Perangkat ini tidak terdaftar untuk akun Anda.');
            }

            const parts = decodedText.split('_');
            const sessionName = parts.length >= 5 ? parts.slice(4).join('_') : 'DEFAULT';

            const response = await fetch('/api/attendance/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: user.id,
                    sessionName: sessionName,
                    lat: location.lat,
                    lng: location.lng,
                    qrText: decodedText
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Gagal mencatat presensi');
            }

            setStatus('success');
            setMessage(result.message || 'Presensi berhasil dicatat!');

        } catch (err: any) {
            console.error("HandleScan Error:", err.message);
            setStatus('error');
            setMessage(err.message);

            setTimeout(() => {
                setStatus('idle');
            }, 5000);
        }
    }, [user, status, profile, isVerified]);

    if (!profile) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-5 mb-8">
                    <div className={`p-5 rounded-[24px] ${isVerified ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-amber-50 dark:bg-amber-900/30'} shadow-sm`}>
                        {isVerified ? <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" /> : <ShieldAlert className="h-8 w-8 text-amber-600 dark:text-amber-400" />}
                    </div>
                    <div>
                        <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tighter italic">{isVerified ? 'Scanner Aktif' : 'Verifikasi Bot'}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{isVerified ? 'Arahkan kamera ke QR Code Guru' : 'Selesaikan verifikasi di Dashboard'}</p>
                    </div>
                </div>

                <div className="flex-1">
                    {status === 'success' ? (
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-[32px] p-12 text-center animate-in zoom-in-95 duration-500">
                            <div className="bg-white dark:bg-emerald-800 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Presensi Berhasil</h2>
                            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm font-semibold">{message}</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-8 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/20"
                            >
                                Selesai
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {isVerified ? (
                                <div className="relative group/scanner">
                                    <div className="absolute -inset-2 bg-linear-to-r from-blue-600/20 to-indigo-600/20 rounded-[42px] blur-2xl opacity-0 group-hover/scanner:opacity-100 transition duration-700"></div>
                                    <div className="relative overflow-hidden rounded-[32px] border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 shadow-inner">
                                        <Scanner onScanSuccess={handleScan} />
                                    </div>
                                    {status === 'error' && (
                                        <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-2xl p-5 flex items-center justify-between animate-in slide-in-from-top-4">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-red-100 p-2 rounded-lg">
                                                    <XCircle className="h-5 w-5 text-red-600" />
                                                </div>
                                                <p className="text-xs text-red-700 dark:text-red-400 font-black tracking-tight">{message}</p>
                                            </div>
                                            <button onClick={() => setStatus('idle')} className="p-2 bg-white/50 dark:bg-red-900/40 hover:bg-red-100 rounded-xl transition-colors">
                                                <RefreshCw className="h-4 w-4 text-red-600" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="aspect-square sm:aspect-video bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 transition-all duration-500 hover:border-blue-400/50 group/locked">
                                    <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 group-hover/locked:scale-110 transition-transform">
                                        <ShieldAlert className="h-12 w-12 opacity-50 text-slate-400 group-hover/locked:text-blue-500 transition-colors" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-[0.3em] mb-2">Scanner Terkunci</p>
                                    <p className="text-[10px] font-bold text-slate-500">Hubungkan Telegram di Dashboard Terlebih Dahulu</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
