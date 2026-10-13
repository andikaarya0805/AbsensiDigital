'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    User,
    LogOut,
    Menu,
    X,
    Bell,
    Settings,
    ChevronRight,
    Search,
    Moon,
    Sun,
    AlertTriangle,
    CheckCircle2,
    ScanLine
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useTheme } from '@/components/ThemeProvider';

const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/student' },
    { name: 'Scan Presensi', icon: ScanLine, href: '/dashboard/student/scan' },
    { name: 'Edit Profil', icon: User, href: '/dashboard/student/edit' },
];

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const supabase = createClient();
    const { theme, toggleTheme } = useTheme();
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const sessionData = localStorage.getItem('student_session');
        if (!sessionData) {
            window.location.href = '/login';
            return;
        }

        try {
            const session = JSON.parse(sessionData);
            const fetchFullProfile = async () => {
                const { data, error } = await supabase
                    .from('students')
                    .select('*')
                    .eq('id', session.id)
                    .single();

                if (!error && data) {
                    setProfile(data);
                } else {
                    setProfile(session);
                }
            };
            fetchFullProfile();
        } catch (e) {
            localStorage.removeItem('student_session');
            window.location.href = '/login';
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

    const handleSignOut = () => {
        localStorage.removeItem('student_session');
        window.location.href = '/login';
    };

    const [showSettings, setShowSettings] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [allowNotifications, setAllowNotifications] = useState(true);

    // Mock Notifications
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: 'Welcome!',
            message: 'Selamat datang di dashboard siswa HadirMu.',
            time: '1 menit yang lalu',
            read: false,
            icon: CheckCircle2,
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
            iconColor: 'text-emerald-600',
        }
    ]);

    const router = useRouter();
    const notificationRef = useRef<HTMLDivElement>(null);

    const unreadNotificationsCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const saved = localStorage.getItem('allow_notifications');
        if (saved !== null) setAllowNotifications(saved === 'true');

        // Click outside handler
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleNotifications = () => {
        const newState = !allowNotifications;
        setAllowNotifications(newState);
        localStorage.setItem('allow_notifications', String(newState));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const markNotificationAsRead = (id: number) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    if (!profile) return <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex transition-colors duration-300">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen transition-colors duration-300">
                <div className="p-8 flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
                        <LayoutDashboard className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">HadirMu <span className="text-blue-600">Student</span></span>
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

                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
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
            <aside className={`fixed top-0 bottom-0 left-0 w-80 bg-white dark:bg-slate-900 z-50 lg:hidden transform transition-transform duration-300 ease-out border-r border-slate-200 dark:border-slate-800 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-xl">
                            <LayoutDashboard className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">HadirMu <span className="text-blue-600">Student</span></span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
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
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                <span className="font-bold text-sm">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-3.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold text-sm transition-all"
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
                                className="lg:hidden p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-2xl w-64 opacity-0 pointer-events-none">
                                {/* Hidden Search Bar to keep layout balanced if needed, or just remove */}
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

                            {/* Notification Dropdown */}
                            <div className="relative" ref={notificationRef}>
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className={`p-2.5 rounded-xl transition-all border-none relative ${showNotifications ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                                >
                                    <Bell className="h-5 w-5" />
                                    {allowNotifications && unreadNotificationsCount > 0 && (
                                        <span className={`absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#F8FAFC] dark:border-slate-900 transition-transform ${allowNotifications ? 'scale-100' : 'scale-0'}`}></span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute right-0 top-full mt-4 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                                        <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                            <h3 className="font-black text-slate-900 dark:text-white">Notifikasi</h3>
                                            <button onClick={markAllAsRead} className="text-xs font-bold text-blue-600 hover:text-blue-700">Tandai semua dibaca</button>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">Tidak ada notifikasi.</div>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        onClick={() => markNotificationAsRead(notification.id)}
                                                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 cursor-pointer ${!notification.read ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={`h-10 w-10 ${notification.iconBg} ${notification.iconColor} rounded-full flex items-center justify-center shrink-0`}>
                                                                <notification.icon className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{notification.title}</p>
                                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notification.message}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 mt-2">{notification.time}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                                            <button className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                                                Lihat Semua Notifikasi
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setShowSettings(true)}
                                className="hidden sm:flex p-2.5 text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all border-none"
                            >
                                <Settings className="h-5 w-5" />
                            </button>
                            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                            <div className="flex items-center gap-3 pl-1 cursor-pointer" onClick={() => router.push('/dashboard/student/edit')}>
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{profile.full_name.split(' ')[0]}</p>
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Siswa</p>
                                </div>
                                <div className="h-10 w-10 md:h-11 md:w-11 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-center p-0.5 overflow-hidden shadow-sm">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover rounded-[14px]" />
                                    ) : (
                                        <div className="h-full w-full bg-linear-to-br from-blue-500 to-indigo-600 rounded-[14px] flex items-center justify-center">
                                            <User className="h-5 w-5 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-10 pb-10">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </main>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                            <div>
                                <h3 className="text-lg font-black text-black dark:text-white tracking-tight">Pengaturan</h3>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Preferensi Sistem</p>
                            </div>
                            <button onClick={() => setShowSettings(false)} className="p-2 text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                        <Bell className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">Notifikasi</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tampilkan lencana notifikasi</p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleNotifications}
                                    className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${allowNotifications ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 ${allowNotifications ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                        {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">Tema Aplikasi</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ganti tampilan Light/Dark</p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`p-2 rounded-lg text-xs font-bold transition-all ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                </button>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-50 dark:border-slate-800/50">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
