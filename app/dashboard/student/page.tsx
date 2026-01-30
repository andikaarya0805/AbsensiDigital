'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import Scanner from '@/components/Scanner';
import { calculateDistance } from '@/lib/utils';
import {
    MapPin,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Navigation
} from 'lucide-react';

// Mock Class Coordinates (e.g., School Yard)
const CLASS_COORDS = { lat: -6.200000, lon: 106.816666 };
const MAX_DISTANCE = 100000; // 100km (Temporary for easier testing)

export default function StudentDashboard() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [coords, setCoords] = useState<{ lat: number, lon: number } | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(profile);
            } else {
                window.location.href = '/login';
            }
        };
        fetchUser();

        // Get live location
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    console.log("Location found:", pos.coords.latitude, pos.coords.longitude);
                    setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                },
                (err) => {
                    console.error("Location error:", err);
                    setMessage("Gagal mengambil lokasi. Pastikan GPS aktif dan izin diberikan.");
                },
                { enableHighAccuracy: true }
            );
        } else {
            setMessage("Browser kamu tidak mendukung GPS.");
        }
    }, []);

    const handleScan = async (decodedText: string) => {
        if (status === 'success') return;

        setStatus('scanning');

        try {
            // 1. Geofencing check
            if (!coords) throw new Error("Please enable location to scan.");

            const distance = calculateDistance(
                coords.lat,
                coords.lon,
                CLASS_COORDS.lat,
                CLASS_COORDS.lon
            );

            if (distance > MAX_DISTANCE) {
                throw new Error(`Out of range. You are ${Math.round(distance)}m away from class.`);
            }

            // 2. Submit Attendance
            console.log("Submitting attendance for:", user.id);
            const { data, error: attError } = await supabase
                .from('attendance')
                .insert({
                    student_id: user.id,
                    status: 'present',
                })
                .select(); // Select to ensure it's working

            if (attError) {
                console.error("Attendance Insert Error:", attError);
                throw attError;
            }

            console.log("Attendance recorded:", data);
            setStatus('success');
            setMessage('Attendance recorded successfully!');
        } catch (err: any) {
            console.error("HandleScan Error:", err.message);
            setStatus('error');
            setMessage(err.message);
            // Don't auto-reset to idle, let user retry manually or refresh
            // to avoid infinite loops if it's a persistent error.
        }
    };

    if (!profile) return <div className="p-8 text-center text-slate-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-900 leading-none">{profile.full_name}</h1>
                            <span className="text-xs text-slate-500">NIS: {profile.nis}</span>
                        </div>
                    </div>
                    <button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')} className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium">
                        Sign Out
                    </button>
                </div>
            </div>

            <main className="max-w-md mx-auto px-6 mt-6 space-y-6">
                {/* Distance Card */}
                <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Current Location</p>
                            <h3 className="text-xl font-bold flex items-center gap-2 mt-1">
                                <MapPin className="h-5 w-5" />
                                {coords ? 'Location Active' : 'Waiting...'}
                            </h3>
                        </div>
                        <div className="bg-blue-500/30 p-2 rounded-lg">
                            <Navigation className="h-5 w-5 text-blue-100 animate-pulse" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-blue-100 bg-white/10 w-fit px-3 py-1.5 rounded-full">
                        <Clock className="h-3 w-3" />
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                {/* Action Area */}
                {status === 'success' ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-10 text-center animate-in zoom-in-95 duration-300">
                        <div className="bg-emerald-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Success!</h2>
                        <p className="text-slate-600 mt-2">{message}</p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="mt-6 text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                            Scan Another?
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Scanner onScanSuccess={handleScan} />

                        {status === 'error' && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-3">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                    <p className="text-sm text-red-600 font-medium">{message}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setStatus('idle');
                                        window.location.reload();
                                    }}
                                    className="text-xs font-bold text-red-700 underline underline-offset-2 w-fit"
                                >
                                    Coba Lagi
                                </button>
                            </div>
                        )}

                        <p className="text-center text-xs text-slate-400">
                            Point your camera to the teacher's dynamic QR code
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
