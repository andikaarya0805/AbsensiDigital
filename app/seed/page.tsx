'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Database, CheckCircle, AlertTriangle, UserPlus, Calendar } from 'lucide-react';

export default function SeedPage() {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const supabase = createClient();

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const seedStudents = async () => {
        setLoading(true);
        setLogs([]);
        addLog("🚀 Starting student seed process...");

        const classes = [
            { name: "XII RPL 1", startNis: 12100 },
            { name: "XII RPL 2", startNis: 12200 },
            { name: "XII TKJ 1", startNis: 12300 }
        ];

        try {
            for (const cls of classes) {
                addLog(`📂 Processing Class: ${cls.name}...`);

                const students = Array.from({ length: 10 }).map((_, i) => ({
                    id: crypto.randomUUID(),
                    nis: (cls.startNis + i).toString(),
                    full_name: `Siswa ${cls.name} ${i + 1}`,
                    class: cls.name,
                    role: 'student',
                }));

                const { data, error } = await supabase
                    .from('students')
                    .upsert(students, { onConflict: 'nis', ignoreDuplicates: false })
                    .select();

                if (error) {
                    addLog(`❌ Error inserting ${cls.name}: ${error.message}`);
                } else {
                    addLog(`✅ Inserted ${data.length} students for ${cls.name}`);
                }
            }
            addLog("✨ Student seeding completed!");
        } catch (err: any) {
            addLog(`❌ Critical Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const seedTeacherAndSchedule = async () => {
        setLoading(true);
        setLogs([]);

        // Use existing teacher UUID from database
        const TEACHER_UUID = '2f0a01fd-24ff-4c8c-b1de-a02526326f7f';

        addLog(`👨‍🏫 Using Teacher UUID: ${TEACHER_UUID}`);
        addLog("📅 Creating schedule for teacher...");

        try {

            // Define schedule data
            const schedules = [
                // Monday
                { class_name: 'XII RPL 1', subject: 'Matematika', day_of_week: 1, start_time: '07:30', end_time: '09:00' },
                { class_name: 'XII RPL 2', subject: 'Bahasa Inggris', day_of_week: 1, start_time: '09:15', end_time: '10:45' },
                { class_name: 'XII TKJ 1', subject: 'Pemrograman Web', day_of_week: 1, start_time: '11:00', end_time: '12:30' },
                // Tuesday
                { class_name: 'XII RPL 1', subject: 'Fisika', day_of_week: 2, start_time: '07:30', end_time: '09:00' },
                { class_name: 'XII TKJ 1', subject: 'Jaringan Komputer', day_of_week: 2, start_time: '09:15', end_time: '10:45' },
                // Wednesday
                { class_name: 'XII RPL 2', subject: 'Basis Data', day_of_week: 3, start_time: '07:30', end_time: '09:00' },
                { class_name: 'XII RPL 1', subject: 'Matematika', day_of_week: 3, start_time: '09:15', end_time: '10:45' },
                // Thursday
                { class_name: 'XII TKJ 1', subject: 'Pemrograman Web', day_of_week: 4, start_time: '07:30', end_time: '09:00' },
                { class_name: 'XII RPL 2', subject: 'Bahasa Inggris', day_of_week: 4, start_time: '09:15', end_time: '10:45' },
                // Friday
                { class_name: 'XII RPL 1', subject: 'Pemrograman Mobile', day_of_week: 5, start_time: '07:30', end_time: '09:00' },
                { class_name: 'XII RPL 2', subject: 'UI/UX Design', day_of_week: 5, start_time: '09:15', end_time: '10:45' },
                { class_name: 'XII TKJ 1', subject: 'Keamanan Jaringan', day_of_week: 5, start_time: '11:00', end_time: '12:30' },
            ].map(s => ({ ...s, teacher_id: TEACHER_UUID }));

            // Delete old schedules for this teacher first
            await supabase
                .from('schedules')
                .delete()
                .eq('teacher_id', TEACHER_UUID);

            // Insert new schedules
            const { data: scheduleData, error: scheduleError } = await supabase
                .from('schedules')
                .insert(schedules)
                .select();

            if (scheduleError) {
                addLog(`❌ Error creating schedule: ${scheduleError.message}`);
                addLog("💡 Pastikan tabel 'schedules' sudah dibuat di Supabase!");
                addLog("📋 Jalankan SQL berikut di Supabase SQL Editor:");
                addLog("CREATE TABLE schedules (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), teacher_id UUID, class_name VARCHAR(50), subject VARCHAR(100), day_of_week INTEGER, start_time TIME, end_time TIME);");
            } else {
                addLog(`✅ Created ${scheduleData.length} schedule entries`);
                addLog("✨ Teacher and schedule seeding completed!");
            }

        } catch (err: any) {
            addLog(`❌ Critical Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const resetDeviceId = async () => {
        const nis = prompt("Masukkan NIS user yang mau di-reset device ID-nya (contoh: 99999):");
        if (!nis) return;

        setLoading(true);
        addLog(`🔄 Resetting device_id for NIS: ${nis}...`);

        const { data, error } = await supabase
            .from('profiles')
            .update({ device_id: null })
            .eq('nis', nis)
            .select();

        if (error) {
            addLog(`❌ Error resetting device ID: ${error.message}`);
        } else if (data.length === 0) {
            addLog(`⚠️ User with NIS ${nis} not found.`);
        } else {
            addLog(`✅ SUCCESS! Device ID for ${data[0].full_name} has been cleared.`);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-indigo-100 p-3 rounded-xl">
                        <Database className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Database Tools</h1>
                        <p className="text-slate-500">Utilities for development & testing</p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-8">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Available Actions:
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-600 ml-6 list-disc">
                        <li><strong>Generate Students</strong>: Create dummy students for each class.</li>
                        <li><strong>Generate Teacher</strong>: Create teacher (NIS 99999) with schedule.</li>
                        <li><strong>Reset Device</strong>: Clear device binding for specific user.</li>
                    </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <button
                        onClick={seedStudents}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Database className="h-5 w-5" />
                        {loading ? '...' : 'Students'}
                    </button>

                    <button
                        onClick={seedTeacherAndSchedule}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <UserPlus className="h-5 w-5" />
                        {loading ? '...' : 'Teacher + Schedule'}
                    </button>

                    <button
                        onClick={resetDeviceId}
                        disabled={loading}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <AlertTriangle className="h-5 w-5" />
                        Reset Device
                    </button>
                </div>

                {logs.length > 0 && (
                    <div className="bg-slate-900 rounded-xl p-6 font-mono text-sm text-green-400 max-h-[300px] overflow-y-auto">
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1 border-b border-indigo-500/10 pb-1 last:border-0 last:pb-0">
                                <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {log}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
