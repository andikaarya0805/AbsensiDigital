'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import {
    Search,
    UserSquare2,
    GraduationCap,
    ChevronRight,
    Loader2,
    FileText
} from 'lucide-react';

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<{
        teachers: any[];
        students: any[];
    }>({ teachers: [], students: [] });

    useEffect(() => {
        if (query) {
            performSearch();
        } else {
            setLoading(false);
        }
    }, [query]);

    const performSearch = async () => {
        setLoading(true);

        const searchQuery = `%${query}%`;

        const [teachersReq, studentsReq] = await Promise.all([
            supabase
                .from('teachers')
                .select('*')
                .or(`full_name.ilike.${searchQuery},nip.ilike.${searchQuery}`)
                .limit(5),
            supabase
                .from('students')
                .select('*, classes(name)')
                .or(`full_name.ilike.${searchQuery},nis.ilike.${searchQuery}`)
                .limit(10)
        ]);

        setResults({
            teachers: teachersReq.data || [],
            students: studentsReq.data || []
        });
        setLoading(false);
    };

    const totalResults = results.teachers.length + results.students.length;

    return (
        <div className="space-y-8 py-6">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Hasil Pencarian</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Menampilkan hasil untuk <span className="font-bold text-slate-900 dark:text-white">"{query}"</span>
                </p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-600" />
                    <p className="font-medium animate-pulse">Mencari data...</p>
                </div>
            ) : totalResults > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Teachers Section */}
                    {results.teachers.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <UserSquare2 className="h-5 w-5 text-blue-600" />
                                Guru & Staff
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-1 rounded-full">{results.teachers.length}</span>
                            </h3>
                            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                {results.teachers.map((t) => (
                                    <div key={t.id} className="p-4 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold">
                                                {t.full_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{t.full_name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">NIP: {t.nip || '-'}</p>
                                            </div>
                                        </div>
                                        <Link href={`/dashboard/admin/teachers?q=${t.full_name}`} className="p-2 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            <ChevronRight className="h-5 w-5" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Students Section */}
                    {results.students.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-emerald-600" />
                                Siswa
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-1 rounded-full">{results.students.length}</span>
                            </h3>
                            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                {results.students.map((s) => (
                                    <div key={s.id} className="p-4 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                                                {s.full_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{s.full_name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                                    <span className="font-mono">{s.nis}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{s.classes?.name || s.class}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <Link href={`/dashboard/admin/students?q=${s.full_name}`} className="p-2 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            <ChevronRight className="h-5 w-5" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-full mb-4">
                        <Search className="h-10 w-10 text-slate-300 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">Tidak ada hasil ditemukan</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                        Coba gunakan kata kunci yang berbeda atau periksa ejaan Anda.
                    </p>
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-600" />
                <p className="font-medium animate-pulse">Memuat halaman...</p>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
