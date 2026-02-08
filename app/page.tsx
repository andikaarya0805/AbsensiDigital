'use client';

import Link from "next/link";
import { School, ArrowRight, CheckCircle, Shield, Smartphone, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors">
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <School className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight">HadirMu</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <Link
              href="/login"
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-full font-bold text-sm transition-all hover:bg-black dark:hover:bg-slate-200 active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none"
            >
              Masuk
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-xs font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400/50 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            Sistem Presensi QR Dinamis v1.0
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-8">
            Presensi Lebih <span className="text-blue-600 dark:text-blue-500">Cepat, Aman & Pintar.</span>
          </h1>

          <p className="text-xl text-slate-500 dark:text-slate-400 font-medium mb-12 max-w-2xl mx-auto">
            HadirMu membantu sekolah mengelola kehadiran dengan teknologi QR dinamis, geofencing, dan penguncian perangkat.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:bg-blue-700 active:scale-95 shadow-xl shadow-blue-100"
            >
              Mulai Sekarang
              <ArrowRight className="h-5 w-5" />
            </Link>
            <button className="w-full sm:w-auto text-slate-400 dark:text-slate-500 font-bold px-8 py-4 hover:text-slate-600 dark:hover:text-slate-400 transition-colors">
              Lihat Tutorial
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white dark:bg-slate-900 py-24 px-6 border-t border-slate-100 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 w-12 h-12 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">QR Dinamis</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">QR berganti setiap 30 detik untuk mencegah kecurangan titip absen lewat foto.</p>
          </div>

          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 w-12 h-12 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Device Binding</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Satu akun hanya bisa login di satu HP. Memastikan murid absen secara jujur.</p>
          </div>

          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 w-12 h-12 rounded-xl flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Geofencing</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Validasi lokasi memastikan murid benar-benar berada di kawasan sekolah.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-slate-400 dark:text-slate-600 text-sm font-medium border-t border-slate-100 dark:border-slate-800 transition-colors">
        &copy; 2026 HadirMu - School Attendance System. Build with ❤️ for Education.
      </footer>
    </div>
  );
}
