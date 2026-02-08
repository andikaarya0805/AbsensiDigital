'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Camera,
    Save,
    Loader2,
    User,
    KeyRound,
    Image as ImageIcon,
    ZoomIn,
    X,
    MessageCircle,
    CheckCircle2
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/canvasUtils';

export default function EditProfilePage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
        id: '',
        full_name: '',
        nis: '',
        class: '',
        password: '',
        whatsapp_number: '',
        avatar_url: ''
    });

    const [verifyingWA, setVerifyingWA] = useState(false);
    const [waOTP, setWaOTP] = useState('');
    const [waStep, setWaStep] = useState<'input' | 'otp'>('input');
    const [isWaVerified, setIsWaVerified] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Image Crop State ---
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isCropping, setIsCropping] = useState(false);

    useEffect(() => {
        const sessionData = localStorage.getItem('student_session');
        if (!sessionData) {
            router.replace('/login');
            return;
        }

        const fetchProfile = async () => {
            setLoading(true);
            try {
                const session = JSON.parse(sessionData);
                const { data, error } = await supabase
                    .from('students')
                    .select('*')
                    .eq('id', session.id)
                    .single();

                if (error) throw error;
                if (data) {
                    setFormData({
                        id: data.id,
                        full_name: data.full_name || '',
                        nis: data.nis || '',
                        class: data.class || '',
                        password: data.password || '',
                        whatsapp_number: data.whatsapp_number || '',
                        avatar_url: data.avatar_url || ''
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

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setImageSrc(reader.result as string);
                setIsCropping(true);
            };
        }
    };

    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setSaving(true);
        setIsCropping(false);
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (!croppedImageBlob) throw new Error("Gagal mengolah gambar");

            const fileName = `${formData.id}-${Date.now()}.jpg`;

            // Upload directly to 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, croppedImageBlob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
            setMessage({ type: 'success', text: 'Foto berhasil di-crop! Klik Simpan Perubahan untuk mengupdate profile.' });

        } catch (error: any) {
            console.error("Crop/Upload error:", error);
            setMessage({ type: 'error', text: 'Gagal upload foto: ' + error.message });
        } finally {
            setSaving(false);
            setImageSrc(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            // Update via API Route (to bypass RLS safely)
            const response = await fetch('/api/student/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: formData.id,
                    full_name: formData.full_name,
                    password: formData.password,
                    avatar_url: formData.avatar_url
                })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Gagal menyimpan profil');

            // Update Local Storage Session
            const sessionData = localStorage.getItem('student_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                session.full_name = formData.full_name;
                session.avatar_url = formData.avatar_url; // Sync avatar
                localStorage.setItem('student_session', JSON.stringify(session));
            }

            setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });

            // Redirect back after short delay
            setTimeout(() => {
                router.push('/dashboard/student');
            }, 1500);

        } catch (error: any) {
            console.error("Update error:", error);
            setMessage({ type: 'error', text: 'Gagal menyimpan profil: ' + error.message });
        } finally {
            setSaving(false);
        }
    };

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
                    role: 'student'
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
                    role: 'student'
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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 animate-pulse">Memuat Profil...</p>
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
                <h1 className="font-bold text-slate-900 dark:text-white text-lg">Edit Profil</h1>
            </div>

            <main className="max-w-md mx-auto px-6 mt-8 space-y-8">

                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-slate-200 dark:bg-slate-800 transition-colors">
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <User className="h-12 w-12 text-slate-400 dark:text-slate-600" />
                                </div>
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Ketuk foto untuk mengganti</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {message && (
                        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 border animate-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/50'}`}>
                            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <Loader2 className="h-5 w-5 shrink-0 animate-spin" />}
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nama Lengkap</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-all"
                                />
                            </div>
                        </div>


                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Password Login</label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none font-sans transition-all"
                                />
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 ml-1">Password digunakan untuk login.</p>
                        </div>

                        <div className="pt-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nomor WhatsApp (Reset Password)</label>
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
                                        className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none transition-all ${isWaVerified ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 text-stone-900 dark:text-white'}`}
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
                                            <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                                <p className="text-[10px] font-bold text-blue-800 uppercase">Masukkan OTP WhatsApp</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        value={waOTP}
                                                        onChange={(e) => setWaOTP(e.target.value)}
                                                        placeholder="6 Digit OTP"
                                                        className="flex-1 px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:border-blue-500 text-center font-mono font-bold tracking-[0.5em]"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleConfirmWAOTP}
                                                        disabled={verifyingWA || waOTP.length < 6}
                                                        className="px-6 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        {verifyingWA ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Selesai'}
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setWaStep('input')}
                                                    className="text-[10px] text-blue-600 font-bold hover:underline"
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
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 ml-1">Nomor ini akan digunakan sebagai satu-satunya cara jika Anda lupa password.</p>
                        </div>

                        {/* Readonly Fields */}
                        <div className="opacity-50 pointer-events-none bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4 transition-colors">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">NIS</label>
                                <p className="font-mono text-slate-700 dark:text-slate-300">{formData.nis}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">Kelas</label>
                                <p className="font-mono text-slate-700 dark:text-slate-300">{formData.class}</p>
                            </div>
                        </div>

                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Simpan Perubahan
                    </button>

                </form>
            </main>

            {/* --- CROP MODAL --- */}
            {isCropping && imageSrc && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-white mb-2">Sesuaikan Foto</h3>
                        <p className="text-slate-400">Geser dan perbesar untuk posisi terbaik</p>
                    </div>

                    <div className="relative w-full max-w-lg aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            cropShape="round"
                            showGrid={false}
                        />
                    </div>

                    <div className="w-full max-w-lg mt-8 space-y-6">
                        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                            <ZoomIn className="h-5 w-5 text-white/50" />
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="flex-1 accent-blue-500"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => { setIsCropping(false); setImageSrc(null); }}
                                className="flex-1 py-4 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
                            >
                                <X className="h-5 w-5" />
                                Batal
                            </button>
                            <button
                                onClick={handleCropSave}
                                className="grow py-4 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                            >
                                <Save className="h-5 w-5" />
                                Gunakan Foto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
