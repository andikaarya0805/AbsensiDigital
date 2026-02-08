'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { KeyRound, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    // Check session on mount to ensure user is essentially "logged in" via the recovery link
    useEffect(() => {
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event == "PASSWORD_RECOVERY") {
                // User is ready to update password
            }
        });
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);

            // Redirect after 3s
            setTimeout(() => {
                window.location.href = '/dashboard/teacher';
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
                <div className="text-center mb-8">
                    <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Buat Password Baru</h1>
                    <p className="text-slate-500 text-sm mt-2">
                        Silakan masukkan password baru untuk akun Anda.
                    </p>
                </div>

                {success ? (
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center animate-fade-in">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <h3 className="font-bold text-green-800 text-lg mb-2">Berhasil!</h3>
                        <p className="text-green-700 text-sm mb-4">
                            Password Anda telah diperbarui. Mengalihkan ke dashboard...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Password Baru</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimal 6 karakter"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none text-black"
                                minLength={6}
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Menyimpan...' : (
                                <>
                                    Simpan Password
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
