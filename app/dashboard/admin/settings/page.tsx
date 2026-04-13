'use client';

import { useState, useEffect } from 'react';
import { Settings, MapPin, Save, Loader2, CheckCircle, Navigation, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
    const [config, setConfig] = useState({
        latitude: 0,
        longitude: 0,
        radius_meters: 20
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data && !data.error) {
                setConfig({
                    latitude: data.latitude || 0,
                    longitude: data.longitude || 0,
                    radius_meters: data.radius_meters || 20
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            
            const result = await res.json();
            
            if (res.ok) {
                setStatus({ type: 'success', msg: result.message || 'Pengaturan berhasil disimpan!' });
            } else {
                let errorMsg = 'Gagal menyimpan';
                if (result.code === 'PGRST205') {
                    errorMsg = 'Error: Tabel "school_settings" belum dibuat di database Supabase.';
                } else if (result.details) {
                    errorMsg = `Error: ${result.details}`;
                }
                throw new Error(errorMsg);
            }
        } catch (e: any) {
            console.error('Settings Save Error:', e);
            setStatus({ type: 'error', msg: e.message || 'Terjadi kesalahan sistem.' });
        } finally {
            setSaving(false);
        }
    };

    const useCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setConfig(prev => ({
                    ...prev,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                }));
            });
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Settings className="h-8 w-8 text-blue-600" />
                    Pengaturan Sekolah
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    Atur koordinat pusat sekolah dan radius presensi siswa.
                </p>
            </div>

            {(config.latitude === 0 && config.longitude === 0) && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-[24px] flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-amber-100 dark:bg-amber-800 p-3 rounded-2xl">
                        <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-black text-amber-900 dark:text-amber-200">Lokasi Belum Diatur</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                            Koordinat sekolah saat ini masih bernilai 0. Siswa <b>tidak akan bisa absen</b> atau akan mendapatkan pesan error karena jarak tidak valid. Silakan gunakan tombol "Gunakan Lokasi Saya Sekarang" atau isi koordinat secara manual.
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-red-500" />
                            Lokasi Geofencing
                        </h3>
                        
                        <div className="space-y-4 bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={config.latitude}
                                        onChange={(e) => setConfig(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                                        className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold shadow-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={config.longitude}
                                        onChange={(e) => setConfig(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                                        className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold shadow-sm"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={useCurrentLocation}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-100 transition-colors"
                            >
                                <Navigation className="h-4 w-4" />
                                Gunakan Lokasi Saya Sekarang
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Navigation className="h-5 w-5 text-blue-500" />
                            Radius Kehadiran
                        </h3>
                        
                        <div className="space-y-4 bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jarak Maksimal (Meter)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="10"
                                        max="500"
                                        step="5"
                                        value={config.radius_meters}
                                        onChange={(e) => setConfig(prev => ({ ...prev, radius_meters: parseInt(e.target.value) }))}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <span className="w-16 text-center font-black text-blue-600 bg-white dark:bg-slate-900 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        {config.radius_meters}m
                                    </span>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                Siswa harus berada dalam radius {config.radius_meters} meter dari titik koordinat untuk bisa melakukan scan.
                            </p>
                        </div>
                    </div>
                </div>

                {status && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 ${
                        status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                        {status.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        <p className="text-sm font-bold">{status.msg}</p>
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full md:w-auto md:px-12 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white py-4 rounded-[20px] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200/50 dark:shadow-none"
                >
                    {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                    Simpan Pengaturan
                </button>
            </div>
        </div>
    );
}


