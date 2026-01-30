'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { KeyRound, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export default function ChangePasswordPage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setError("Password minimal 6 karakter.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Konfirmasi password tidak cocok.");
            return;
        }

        setLoading(true);
        try {
            // 1. Update Password in Auth
            const { error: authError } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (authError) throw authError;

            // 2. Mark first_login as false in profiles
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('profiles')
                    .update({ first_login: false })
                    .eq('id', user.id);
            }

            window.location.href = '/dashboard/student';
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="inline-block bg-orange-100 p-4 rounded-3xl mb-6">
                    <KeyRound className="h-10 w-10 text-orange-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ganti Password</h2>
                <p className="mt-3 text-slate-500 font-medium px-4">
                    Anda menggunakan password default. Demi keamanan, silakan buat password baru yang unik.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] sm:rounded-[32px] border border-slate-100">
                    <form className="space-y-6" onSubmit={handleUpdate}>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 ml-1">Password Baru</label>
                            <input
                                type="password"
                                required
                                className="mt-1.5 block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 ml-1">Konfirmasi Password</label>
                            <input
                                type="password"
                                required
                                className="mt-1.5 block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                                <p className="text-sm text-amber-700 font-medium">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 py-4 px-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold transition-all disabled:opacity-50 active:scale-95 shadow-xl shadow-slate-200"
                        >
                            {loading ? 'Simpan...' : (
                                <>
                                    Simpan Password
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>

                        <div className="flex items-center gap-2 justify-center text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 py-2 rounded-xl">
                            <ShieldCheck className="h-3 w-3" />
                            Sistem Keamanan Terenkripsi
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
