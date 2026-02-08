'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    UserSquare2,
    GraduationCap,
    BookOpen,
    CalendarCheck,
    FileText,
    LogOut,
    Menu,
    X,
    Bell,
    Settings,
    ChevronRight,
    Search,
    Moon,
    Sun
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useTheme } from '@/components/ThemeProvider';

const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/admin' },
    { name: 'Data Guru', icon: UserSquare2, href: '/dashboard/admin/teachers' },
    { name: 'Data Siswa', icon: GraduationCap, href: '/dashboard/admin/students' },
    { name: 'Data Kelas', icon: BookOpen, href: '/dashboard/admin/classes' },
    { name: 'Mata Pelajaran', icon: FileText, href: '/dashboard/admin/subjects' },
    { name: 'Jadwal Kuliah', icon: CalendarCheck, href: '/dashboard/admin/schedules' },
    { name: 'Laporan Presensi', icon: FileText, href: '/dashboard/admin/reports' },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const supabase = createClient();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        // Strict role check
        const userRole = document.cookie.split('; ').find(row => row.startsWith('user_role='))?.split('=')[1];
        if (userRole !== 'admin') {
            window.location.href = '/dashboard/teacher';
            return;
        }

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        document.cookie = "user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex transition-colors duration-300">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen transition-colors duration-300">
                <div className="p-8 flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
                        <LayoutDashboard className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">HadirMu <span className="text-blue-600">Admin</span></span>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
                    <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 mt-2">Main Menu</p>
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600 transition-colors'}`} />
                                    <span className="font-bold text-sm tracking-tight">{item.name}</span>
                                </div>
                                {isActive && <ChevronRight className="h-4 w-4 text-white/70" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-3.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all group"
                    >
                        <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                        <span className="font-bold text-sm tracking-tight">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Mobile Sidebar */}
            <aside className={`fixed top-0 bottom-0 left-0 w-80 bg-white z-50 lg:hidden transform transition-transform duration-300 ease-out border-r border-slate-200 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-xl">
                            <LayoutDashboard className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-black text-slate-900 tracking-tight">HadirMu <span className="text-blue-600">Admin</span></span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <nav className="p-4 space-y-1 h-[calc(100vh-140px)] overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                <span className="font-bold text-sm">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-3.5 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-all"
                    >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Wrapper */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-3' : 'bg-transparent py-5'}`}>
                    <div className="px-6 md:px-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-2xl w-64 focus-within:ring-2 focus-within:ring-blue-100 transition-all border-none shadow-sm">
                                <Search className="h-4 w-4 text-slate-400" />
                                <input type="text" placeholder="Search data..." className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-600 dark:text-slate-300 placeholder:text-slate-400" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleTheme}
                                className="p-2.5 text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-yellow-400 rounded-xl transition-all border-none relative group"
                                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                            >
                                {theme === 'light' ? (
                                    <Moon className="h-5 w-5 animate-in zoom-in-0 duration-300" />
                                ) : (
                                    <Sun className="h-5 w-5 animate-in spin-in-90 duration-300" />
                                )}
                            </button>
                            <button className="hidden sm:flex p-2.5 text-slate-400 hover:bg-white hover:text-slate-900 rounded-xl transition-all border-none relative">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#F8FAFC]"></span>
                            </button>
                            <button className="hidden sm:flex p-2.5 text-slate-400 hover:bg-white hover:text-slate-900 rounded-xl transition-all border-none">
                                <Settings className="h-5 w-5" />
                            </button>
                            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
                            <div className="flex items-center gap-3 pl-1">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">Administrator</p>
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Super Admin</p>
                                </div>
                                <div className="h-10 w-10 md:h-11 md:w-11 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center p-0.5 overflow-hidden shadow-sm">
                                    <div className="h-full w-full bg-linear-to-br from-blue-500 to-indigo-600 rounded-[14px]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 px-6 md:px-10 pb-10">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
