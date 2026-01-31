'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Database, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SeedPage() {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const supabase = createClient();

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const seedData = async () => {
        setLoading(true);
        setLogs([]);
        addLog("🚀 Starting seed process...");

        const classes = [
            { name: "XII RPL 1", startNis: 12100 },
            { name: "XII RPL 2", startNis: 12200 },
            { name: "XII TKJ 1", startNis: 12300 }
        ];

        try {
            for (const cls of classes) {
                addLog(`📂 Processing Class: ${cls.name}...`);

                const students = Array.from({ length: 10 }).map((_, i) => ({
                    id: crypto.randomUUID(), // Generate array-valid UUID
                    nis: (cls.startNis + i).toString(),
                    full_name: `Siswa ${cls.name} ${i + 1}`,
                    class: cls.name,
                    role: 'student',
                }));

                const { data, error } = await supabase
                    .from('profiles')
                    .upsert(students, { onConflict: 'nis', ignoreDuplicates: false })
                    .select();

                if (error) {
                    addLog(`❌ Error inserting ${cls.name}: ${error.message}`);
                    console.error(error);
                } else {
                    addLog(`✅ Successfully inserted/updated ${data.length} students for ${cls.name}`);
                }
            }
            addLog("✨ Seeding completed!");
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
                        <li><strong>Seeding</strong>: Create dummy classes and students.</li>
                        <li><strong>Reset Device</strong>: Clear device binding for specific user (Fix Login Error).</li>
                    </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button
                        onClick={seedData}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processing...' : 'Generate Dummy Data'}
                    </button>

                    <button
                        onClick={resetDeviceId}
                        disabled={loading}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <AlertTriangle className="h-5 w-5" />
                        Reset Device ID
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
