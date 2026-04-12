'use client';

import { useState } from 'react';
import { Megaphone, Send, Users, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function BroadcastPage() {
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState<'all' | 'students' | 'teachers'>('all');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const handleBroadcast = async () => {
        if (!message.trim()) return;

        setLoading(true);
        setStatus(null);

        try {
            const res = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, target })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', msg: data.message });
                setMessage('');
            } else {
                throw new Error(data.error || 'Gagal mengirim broadcast');
            }
        } catch (err: any) {
            setStatus({ type: 'error', msg: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Megaphone className="h-8 w-8 text-blue-600" />
                    Broadcast Telegram
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    Kirim pengumuman massal ke seluruh pengguna yang terhubung dengan Bot Telegram HadirMu.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Target Penerima</label>
                            <div className="flex gap-2">
                                {(['all', 'students', 'teachers'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTarget(t)}
                                        className={`flex-1 py-3 px-4 rounded-2xl text-sm font-bold transition-all border ${
                                            target === t 
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-none' 
                                            : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        {t === 'all' ? 'Semua' : t === 'students' ? 'Siswa' : 'Guru'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Isi Pengumuman</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tuliskan pengumuman di sini..."
                                rows={6}
                                className="w-full p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[24px] text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all resize-none shadow-inner"
                            />
                        </div>

                        {status && (
                            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                                status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                                {status.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                                <p className="text-sm font-bold">{status.msg}</p>
                            </div>
                        )}

                        <button
                            onClick={handleBroadcast}
                            disabled={loading || !message.trim()}
                            className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white py-4 rounded-[20px] font-black text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200/50 dark:shadow-none"
                        >
                            {loading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <>
                                    <Send className="h-5 w-5" />
                                    Kirim Pengumuman
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-blue-600 rounded-[32px] p-8 text-white space-y-4 shadow-xl shadow-blue-200 dark:shadow-none">
                        <div className="bg-white/20 h-12 w-12 rounded-2xl flex items-center justify-center">
                            <Megaphone className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-black">Tips Broadcast</h3>
                        <p className="text-blue-100 text-sm font-medium leading-relaxed">
                            Gunakan broadcast untuk info penting seperti hari libur, pengumuman ujian, atau perubahan jadwal mendadak.
                        </p>
                        <ul className="text-xs text-blue-100/80 space-y-2 list-disc list-inside">
                            <li>Pesan dikirim real-time</li>
                            <li>Format pesan mendukung Markdown</li>
                            <li>Gunakan emoticon agar lebih menarik</li>
                        </ul>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-[32px] p-8 border border-amber-100 dark:border-amber-900/50 space-y-4">
                        <Users className="h-8 w-8 text-amber-600" />
                        <h3 className="text-lg font-black text-amber-800 dark:text-amber-400">Catatan Penting</h3>
                        <p className="text-amber-700 dark:text-amber-500 text-sm font-medium leading-relaxed">
                            Hanya user yang sudah menautkan Telegram yang akan menerima pesan ini. Pastikan siswa & guru sudah memverifikasi akun mereka.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
