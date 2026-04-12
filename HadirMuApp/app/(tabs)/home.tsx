import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Alert, Modal, Linking, ActivityIndicator, Dimensions } from 'react-native';
import { RADIUS, SHADOW } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { 
  Calendar, Clock, MapPin, ShieldCheck, ShieldAlert, 
  LogOut, User, Moon, Sun, ChevronRight, QrCode, 
  Scan, RefreshCw, Maximize2, X, Users, BookOpen,
  CheckCircle2, Download, GraduationCap, Megaphone,
  CalendarCheck, FileText
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { documentDirectory, writeAsStringAsync } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { validateQRPayload } from '../../lib/qr';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

const getStatusOptions = (colors: any) => [
  { value: 'hadir', label: 'HADIR', color: colors.success },
  { value: 'izin', label: 'IZIN', color: colors.info },
  { value: 'sakit', label: 'SAKIT', color: colors.warning },
  { value: 'alpha', label: 'ALPHA', color: colors.danger },
];

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://absensi-digital-i87xnkg8j-andikaarya0805s-projects.vercel.app';

export default function HomeScreen() {
  const { colors, theme, setTheme, isDark } = useTheme();
  const STATUS_OPTIONS = getStatusOptions(colors);
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const styles = createStyles(colors);
  
  // --- Teacher States ---
  const [qrValue, setQrValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [scheduleSubjects, setScheduleSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [studentStatuses, setStudentStatuses] = useState<Record<string, string>>({});
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // --- Student States ---
  const [permission, requestPermission] = useCameraPermissions();
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  // --- Admin States ---
  const [adminStats, setAdminStats] = useState({
    teachers: 0,
    students: 0,
    classes: 0,
    todayAttendance: 0
  });

  const QR_SECRET = process.env.EXPO_PUBLIC_QR_SECRET || 'FALLBACK_SECRET';
  const REFRESH_INTERVAL = 30;

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    if (!user) return;
    setRefreshing(true);
    
    try {
      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from(user.role === 'student' ? 'students' : 'teachers')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        setIsVerified(user.role !== 'student' || !!profileData.telegram_chat_id);
      } else {
        setIsVerified(user.role !== 'student');
      }

      // 2. Role Specific Init
      if (user.role === 'teacher') {
        fetchTeacherSchedule();
      } else if (user.role === 'admin') {
        fetchAdminStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (typeof setRefreshing === 'function') setRefreshing(false);
    }
  };

  // --- Admin Logic ---
  const fetchAdminStats = async () => {
     try {
        const { count: teacherCount } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
        const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
        const { count: classCount } = await supabase.from('classes').select('*', { count: 'exact', head: true });
        
        const today = new Date().toISOString().split('T')[0];
        const { count: attendanceCount } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .gte('timestamp', `${today}T00:00:00`)
            .lte('timestamp', `${today}T23:59:59`);

        setAdminStats({
            teachers: teacherCount || 0,
            students: studentCount || 0,
            classes: classCount || 0,
            todayAttendance: attendanceCount || 0
        });
     } catch (e) {
        console.error('Admin stats fetch error:', e);
     }
  };

  // --- Teacher Logic ---
  const fetchTeacherSchedule = async () => {
    const { data } = await supabase
      .from('schedules')
      .select('class_name, subject')
      .eq('teacher_id', user?.id);

    if (data) {
      const unique = data.filter((v, i, a) =>
        a.findIndex(t => t.class_name === v.class_name && t.subject === v.subject) === i
      );
      setScheduleSubjects(unique);
    }
  };

  const generateQR = useCallback(() => {
    const timestamp = Math.floor(Date.now() / (REFRESH_INTERVAL * 1000));
    const session = sessionName || 'DEFAULT';
    setQrValue(`HADIR_SESSION_${timestamp}_${QR_SECRET}_${session}`);
    setTimeLeft(REFRESH_INTERVAL);
  }, [sessionName]);

  useEffect(() => {
    if (user?.role !== 'teacher') return;
    generateQR();
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          generateQR();
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [user, sessionName, generateQR]);

  useEffect(() => {
    if (user?.role === 'teacher' && selectedClass) {
      fetchClassStudents();
    }
  }, [selectedClass, sessionName]);

  const fetchClassStudents = async () => {
    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('class', selectedClass)
      .order('full_name');

    if (students) setClassStudents(students);

    const today = new Date().toISOString().split('T')[0];
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('student_id, status_type')
      .gte('timestamp', `${today}T00:00:00`)
      .eq('session_name', sessionName || 'DEFAULT');

    if (attendanceData) {
      const map: Record<string, string> = {};
      attendanceData.forEach(a => map[a.student_id] = a.status_type);
      setStudentStatuses(map);
    }

    // Subscribe to real-time updates for THIS CLASS
    const channel = supabase
      .channel(`realtime_attendance_${selectedClass}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance' },
        (payload: any) => {
          if (payload.new.session_name === (sessionName || 'DEFAULT')) {
            setStudentStatuses((prev: Record<string, string>) => ({
              ...prev,
              [payload.new.student_id]: payload.new.status_type
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateStudentStatus = async (studentId: string, status: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', studentId)
      .eq('session_name', sessionName || 'DEFAULT')
      .gte('timestamp', `${today}T00:00:00`)
      .single();

    if (existing) {
      await supabase.from('attendance').update({ status_type: status }).eq('id', existing.id);
    } else {
      await supabase.from('attendance').insert({
        student_id: studentId,
        status_type: status,
        session_name: sessionName || 'DEFAULT',
      });
    }
    setStudentStatuses((prev: Record<string, string>) => ({ ...prev, [studentId]: status }));
  };

  const handleExport = async () => {
    if (!selectedClass || classStudents.length === 0) {
      Alert.alert('Peringatan', 'Pilih kelas terlebih dahulu!');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    let csv = 'No,Nama Siswa,NIS,Status,Sesi,Tanggal\n';
    
    classStudents.forEach((s, idx) => {
      const status = (studentStatuses[s.id] || 'ALPHA').toUpperCase();
      csv += `${idx + 1},${s.full_name},${s.nis},${status},${sessionName || 'Semua Sesi'},${today}\n`;
    });

    const filename = `Absensi_${selectedClass}_${today}.csv`;
    const filepath = `${documentDirectory}${filename}`;

    try {
      await writeAsStringAsync(filepath, csv, { encoding: 'utf8' });
      await shareAsync(filepath);
    } catch (e) {
      Alert.alert('Error', 'Gagal mengekspor data.');
    }
  };

  const handleExportMonthly = async () => {
    if (!selectedClass || !sessionName) {
      Alert.alert('Peringatan', 'Pilih kelas dan mata pelajaran terlebih dahulu!');
      return;
    }

    setRefreshing(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: logs } = await supabase
          .from('attendance')
          .select('student_id, status_type, timestamp')
          .eq('session_name', sessionName)
          .gte('timestamp', startOfMonth.toISOString())
          .lte('timestamp', endOfMonth.toISOString());

      let csv = `No,Nama Siswa,NIS,Hadir,Izin,Sakit,Alpha,Total Sesi\n`;
      
      classStudents.forEach((student, index) => {
        const sLogs = logs?.filter(l => l.student_id === student.id) || [];
        const hadir = sLogs.filter(l => l.status_type === 'hadir').length;
        const izin = sLogs.filter(l => l.status_type === 'izin').length;
        const sakit = sLogs.filter(l => l.status_type === 'sakit').length;
        const alpha = sLogs.filter(l => l.status_type === 'alpha').length;

        csv += `${index + 1},"${student.full_name}",${student.nis},${hadir},${izin},${sakit},${alpha},${sLogs.length}\n`;
      });

      const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(now);
      const filename = `Rekap_Bulanan_${selectedClass}_${monthName}.csv`;
      const filepath = `${documentDirectory}${filename}`;

      await writeAsStringAsync(filepath, csv, { encoding: 'utf8' });
      await shareAsync(filepath);
    } catch (e: any) {
      Alert.alert('Error', 'Gagal rekap bulanan: ' + e.message);
    } finally {
      setRefreshing(false);
    }
  };

  // --- Student Logic ---
  const handleScan = async ({ data }: { data: string }) => {
    if (scanStatus === 'success' || scanStatus === 'scanning') return;
    setScanStatus('scanning');

    try {
      // SECURITY CHECK: Device Identity (Sync with web parity)
      const currentDeviceId = await SecureStore.getItemAsync('expo_device_id');
      if (profile?.device_id && profile.device_id !== currentDeviceId) {
          throw new Error('Perangkat ini tidak terdaftar untuk akun Anda. Gunakan perangkat asli atau hubungi Admin.');
      }

      // GEOLOCATION & UNIFIED API
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      const response = await fetch(`${API_URL}/api/attendance/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrPayload: data,
          studentId: user?.id,
          coords: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          }
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal absensi');

      setScanStatus('success');
      setScanMessage(result.message || 'Presensi berhasil dicatat!');
      fetchInitialData();
    } catch (err: any) {
      setScanStatus('error');
      setScanMessage(err.message);
      setTimeout(() => setScanStatus('idle'), 3000);
    }
  };

  useEffect(() => {
    let interval: string | number | NodeJS.Timeout | undefined;
    if (user?.role === 'student' && isVerified === false) {
      interval = setInterval(async () => {
        const { data } = await supabase.from('students').select('telegram_chat_id').eq('id', user.id).single();
        if (data?.telegram_chat_id) {
          setIsVerified(true);
          setProfile((prev: any) => ({ ...prev, telegram_chat_id: data.telegram_chat_id }));
          Alert.alert('Sukses', 'Akun berhasil diverifikasi!');
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [user, isVerified]);

  const handleVerifyTelegram = async () => {
    const token = Math.random().toString(36).substring(2, 15);
    await supabase.from('students').update({ verification_token: token }).eq('id', user?.id);
    Linking.openURL(`https://t.me/HadirMu_Bot?start=v_${token}`);
  };

  if (!user || refreshing || isVerified === null) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* FULLSCREEN QR OVERLAY */}
      <Modal visible={isFullscreen} animationType="fade" transparent={false}>
          <View style={styles.fullscreenOverlay}>
              <TouchableOpacity onPress={() => setIsFullscreen(false)} style={styles.closeBtn}>
                  <X size={32} color="#fff" />
              </TouchableOpacity>
              <View style={styles.fsHeader}>
                  <Text style={styles.fsLabel}>ABSENSI REAL-TIME</Text>
                  <Text style={styles.fsSubject}>{sessionName || 'HadirMu'}</Text>
              </View>
              <View style={styles.fsQrWrapper}>
                  <QRCode value={qrValue} size={width * 0.7} backgroundColor="white" />
              </View>
              <View style={styles.fsTimerRow}>
                  <Clock size={28} color="#fff" />
                  <Text style={styles.fsTimerText}>{timeLeft}s</Text>
              </View>
              <View style={styles.fsProgressBar}>
                  <View style={[styles.fsProgressFill, { width: `${(timeLeft/30)*100}%` }]} />
              </View>
              <Text style={styles.fsHint}>Silakan arahkan kamera HP Siswa ke layar ini</Text>
          </View>
      </Modal>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchInitialData} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.avatarWrapper} onPress={() => setShowProfileMenu(true)}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                ) : (
                  <User size={24} color={colors.primary} />
                )}
                <View style={[styles.statusDot, { backgroundColor: isVerified ? colors.success : colors.warning }]} />
              </TouchableOpacity>
              <View>
                <Text style={styles.greeting}>Selamat datang,</Text>
                <Text style={styles.name}>{profile?.full_name || user?.fullName}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
               <TouchableOpacity onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={styles.iconBtn}>
                  {theme === 'dark' ? <Sun size={20} color={colors.warning} /> : <Moon size={20} color={colors.textSub} />}
               </TouchableOpacity>
               <TouchableOpacity 
                 onPress={() => Alert.alert('Logout', 'Yakin ingin keluar?', [
                   { text: 'Batal', style: 'cancel' },
                   { text: 'Keluar', style: 'destructive', onPress: logout }
                 ])} 
                 style={styles.iconBtn}
               >
                  <LogOut size={20} color={colors.danger} />
               </TouchableOpacity>
            </View>
        </View>

        {/* --- ACCOUNT MENU MODAL (Web Parity) --- */}
        <Modal visible={showProfileMenu} animationType="slide" transparent={true}>
            <View style={styles.menuOverlay}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowProfileMenu(false)} />
                <View style={styles.menuSheet}>
                    <View style={styles.sheetHandle} />
                    <Text style={styles.sheetTitle}>Menu Akun</Text>
                    
                    <TouchableOpacity 
                      style={styles.sheetItem} 
                      onPress={() => {
                        setShowProfileMenu(false);
                        router.push('/profile');
                      }}
                    >
                        <View style={[styles.sheetIconBox, { backgroundColor: colors.primary + '15' }]}>
                          <User size={20} color={colors.primary} />
                        </View>
                        <View>
                          <Text style={styles.sheetItemTitle}>Pengaturan Profil</Text>
                          <Text style={styles.sheetItemSub}>Ganti foto, nama & password</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.sheetItem, { borderBottomWidth: 0 }]} 
                      onPress={() => {
                        setShowProfileMenu(false);
                        Alert.alert('Logout', 'Yakin ingin keluar?', [
                          { text: 'Batal', style: 'cancel' },
                          { text: 'Keluar', style: 'destructive', onPress: logout }
                        ]);
                      }}
                    >
                        <View style={[styles.sheetIconBox, { backgroundColor: colors.danger + '15' }]}>
                          <LogOut size={20} color={colors.danger} />
                        </View>
                        <View>
                          <Text style={[styles.sheetItemTitle, { color: colors.danger }]}>Keluar Aplikasi</Text>
                          <Text style={styles.sheetItemSub}>Selesaikan sesi Anda</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowProfileMenu(false)}>
                        <Text style={styles.sheetCloseText}>Tutup</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* --- ADMIN DASHBOARD --- */}
        {user.role === 'admin' && (
          <View style={styles.adminLayout}>
            {/* System Stats Grid */}
            <View style={styles.statsGrid}>
              {[
                { label: 'Total Guru', val: adminStats.teachers, icon: Users, color: '#3B82F6', bg: '#EFF6FF' },
                { label: 'Total Siswa', val: adminStats.students, icon: GraduationCap, color: '#10B981', bg: '#ECFDF5' },
                { label: 'Total Kelas', val: adminStats.classes, icon: BookOpen, color: '#F59E0B', bg: '#FFF7ED' },
                { label: 'Presensi', val: adminStats.todayAttendance, icon: CheckCircle2, color: '#6366F1', bg: '#EEF2FF' },
              ].map((s, idx) => (
                <View key={idx} style={[styles.statCard, { borderLeftColor: s.color }]}>
                  <View style={[styles.statIconBox, { backgroundColor: s.bg }]}>
                    <s.icon size={18} color={s.color} />
                  </View>
                  <Text style={styles.statVal}>{s.val}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Launchpad Quick Actions */}
            <View style={styles.sectionHeader}>
              <Maximize2 size={18} color={colors.primary} />
              <Text style={styles.tableTitle}>Admin Launchpad</Text>
            </View>
            <View style={styles.launchpadGrid}>
              {[
                { name: 'Data Guru', icon: User, color: '#3B82F6', route: '/admin/teachers' },
                { name: 'Data Siswa', icon: GraduationCap, color: '#10B981', route: '/admin/students' },
                { name: 'Data Kelas', icon: BookOpen, color: '#F59E0B', route: '/admin/classes' },
                { name: 'Mata Pelajaran', icon: FileText, color: '#6366F1', route: '/admin/subjects' },
                { name: 'Broadcast', icon: Megaphone, color: '#EC4899', route: '/admin/broadcast' },
                { name: 'Radius & Lokasi', icon: MapPin, color: '#F59E0B', route: '/admin/settings' },
                { name: 'Jadwal Pelajaran', icon: CalendarCheck, color: '#8B5CF6', route: '/schedules' },
              ].map((item, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.launchItem} 
                  onPress={() => item.route ? router.push(item.route as any) : Alert.alert('Info', `${item.name} (Dalam Pengembangan)`)}
                >
                  <View style={[styles.launchIconBox, { backgroundColor: item.color + '15' }]}>
                    <item.icon size={24} color={item.color} />
                  </View>
                  <Text style={styles.launchName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* System Status */}
            <View style={styles.sysStatusRow}>
               <View style={styles.sysCard}>
                  <CheckCircle2 size={24} color={colors.success} />
                  <View>
                    <Text style={styles.sysTitle}>Database Layer</Text>
                    <Text style={styles.sysSub}>Connected & Optimized</Text>
                  </View>
               </View>
               <View style={styles.sysCard}>
                  <RefreshCw size={24} color={colors.primary} />
                  <View>
                    <Text style={styles.sysTitle}>Live Updates</Text>
                    <Text style={styles.sysSub}>Sync Mode Active</Text>
                  </View>
               </View>
            </View>
          </View>
        )}

        {/* --- TEACHER DASHBOARD --- */}
        {user.role === 'teacher' && (
          <View style={styles.teacherLayout}>
            {/* 1. Session Selector */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <BookOpen size={18} color={colors.primary} />
                <Text style={styles.cardTitle}>Pilih Kelas & Mata Pelajaran</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sessionScroll}>
                {scheduleSubjects.map((s, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.sessionChip, sessionName === `${s.class_name} - ${s.subject}` && styles.activeChip]}
                    onPress={() => {
                      setSessionName(`${s.class_name} - ${s.subject}`);
                      setSelectedClass(s.class_name);
                    }}
                  >
                    <Text style={[styles.chipText, sessionName === `${s.class_name} - ${s.subject}` && styles.activeChipText]}>
                      {s.class_name} • {s.subject}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 2. QR Generator Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <QrCode size={18} color={colors.primary} />
                  <Text style={styles.cardTitle}>Attendance QR</Text>
                </View>
                <View style={styles.qrContent}>
                   <View style={styles.qrContainer}>
                     <QRCode value={qrValue || 'HADIR_INACTIVE'} size={180} />
                   </View>
                   <View style={styles.qrMeta}>
                     <View style={styles.timerBox}>
                        <Clock size={16} color={colors.textSub} />
                        <Text style={styles.timerText}>{timeLeft}s</Text>
                     </View>
                     <View style={styles.miniProgress}>
                        <View style={[styles.miniFill, { width: `${(timeLeft/30)*100}%` }]} />
                     </View>
                     <View style={styles.qrActions}>
                        <TouchableOpacity style={styles.qrBtn} onPress={generateQR}>
                          <RefreshCw size={18} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.qrBtn, { backgroundColor: colors.primary }]} onPress={() => setIsFullscreen(true)}>
                          <Maximize2 size={18} color="#fff" />
                        </TouchableOpacity>
                     </View>
                   </View>
                </View>
            </View>

            {/* 3. Rekap Absensi Table */}
            <View style={styles.tableHeader}>
               <Users size={18} color={colors.primary} />
               <Text style={styles.tableTitle}>Rekap Absensi</Text>
               <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
                      <Download size={14} color="#fff" />
                      <Text style={styles.exportText}>Harian</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.info }]} onPress={handleExportMonthly}>
                      <Calendar size={14} color="#fff" />
                      <Text style={styles.exportText}>Bulanan</Text>
                  </TouchableOpacity>
               </View>
            </View>

            <View style={styles.cardTable}>
               {classStudents.length > 0 ? (
                 classStudents.map((s, idx) => (
                   <View key={idx} style={[styles.tableRow, idx === classStudents.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={styles.rowInfo}>
                        <Text style={styles.rowName}>{s.full_name}</Text>
                        <Text style={styles.rowNis}>NIS: {s.nis}</Text>
                      </View>
                      <View style={styles.rowAction}>
                        <TouchableOpacity 
                          style={[styles.statusBadge, { backgroundColor: studentStatuses[s.id] ? STATUS_OPTIONS.find(o => o.value === studentStatuses[s.id])?.color + '20' : colors.border + '20' }]}
                          onPress={() => {
                            setSelectedStudent(s);
                            setShowStatusModal(true);
                          }}
                        >
                           <Text style={[styles.statusText, { color: studentStatuses[s.id] ? STATUS_OPTIONS.find(o => o.value === studentStatuses[s.id])?.color : colors.textSub }]}>
                             {(studentStatuses[s.id] || 'ALPHA').toUpperCase()}
                           </Text>
                        </TouchableOpacity>
                      </View>
                   </View>
                 ))
               ) : (
                 <Text style={styles.emptyTable}>Pilih kelas untuk rekap</Text>
               )}
            </View>
          </View>
        )}

        {/* --- STUDENT DASHBOARD --- */}
        {user.role === 'student' && (
          <View style={styles.studentLayout}>
            {/* 1. Status Overlay if not verified */}
            {!isVerified && (
              <View style={styles.verifyBox}>
                <ShieldAlert size={40} color={colors.warning} />
                <Text style={styles.verifyTitle}>Belum Verifikasi</Text>
                <Text style={styles.verifySub}>Hubungkan Telegram untuk absen</Text>
                <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyTelegram}>
                  <Text style={styles.verifyBtnText}>Buka Telegram</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 2. Integrated Scanner */}
            {isVerified && (
              <View style={styles.scannerCard}>
                 <View style={styles.scannerHeader}>
                    <Scan size={20} color={colors.primary} />
                    <Text style={styles.scannerTitle}>Scan QR Presensi</Text>
                 </View>
                 
                 {scanStatus === 'success' ? (
                   <View style={styles.scanSuccess}>
                      <CheckCircle2 size={60} color={colors.success} />
                      <Text style={styles.successTitle}>Berhasil!</Text>
                      <Text style={styles.successSub}>{scanMessage}</Text>
                      <TouchableOpacity onPress={() => setScanStatus('idle')} style={styles.resetBtn}>
                        <Text style={styles.resetText}>Absen Sesi Lain?</Text>
                      </TouchableOpacity>
                   </View>
                 ) : (
                   <View style={styles.scannerContainer}>
                      {!permission?.granted ? (
                        <View style={styles.noPerms}>
                          <Text style={styles.permText}>Izin kamera dibutuhkan</Text>
                          <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
                            <Text style={styles.permBtnText}>Beri Izin</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <CameraView 
                          style={styles.camera} 
                          onBarcodeScanned={scanStatus === 'idle' ? handleScan : undefined}
                          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                        >
                          <View style={styles.scanFrame} />
                        </CameraView>
                      )}
                   </View>
                 )}
                 <Text style={styles.scanHint}>Arahkan kamera ke QR Code Guru</Text>
              </View>
            )}

            {/* 3. Info GPS */}
            <View style={styles.tipBox}>
              <MapPin size={18} color={colors.info} />
              <Text style={styles.tipText}>
                Pastikan GPS aktif untuk mempermudah validasi lokasi (Geofencing).
              </Text>
            </View>
          </View>
        )}
        {/* STATUS PICKER MODAL */}
        <Modal visible={showStatusModal} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.pickerModal}>
               <Text style={styles.pickerTitle}>Ubah Status: {selectedStudent?.full_name}</Text>
               <View style={styles.statusGrid}>
                  {STATUS_OPTIONS.map(opt => (
                    <TouchableOpacity 
                      key={opt.value} 
                      style={[styles.statusOption, { borderColor: opt.color + '40' }]}
                      onPress={() => {
                        updateStudentStatus(selectedStudent?.id, opt.value);
                        setShowStatusModal(false);
                      }}
                    >
                      <View style={[styles.dot, { backgroundColor: opt.color }]} />
                      <Text style={[styles.optLabel, { color: opt.color }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
               </View>
               <TouchableOpacity onPress={() => setShowStatusModal(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Batal</Text>
               </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 24,
    padding: 10,
    zIndex: 10,
  },
  fsHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  fsLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  fsSubject: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
  fsQrWrapper: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: RADIUS.xl,
  },
  fsTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  fsTimerText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '800',
  },
  fsProgressBar: {
    width: 250,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  fsProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  fsHint: {
    color: '#64748b',
    marginTop: 30,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  avatarWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  greeting: {
    fontSize: 12,
    color: colors.textSub,
  },
  name: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  teacherLayout: {
    width: '100%',
  },
  studentLayout: {
    width: '100%',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: RADIUS.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  sessionScroll: {
    flexDirection: 'row',
  },
  sessionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.bg,
    borderRadius: RADIUS.lg,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeChip: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSub,
  },
  activeChipText: {
    color: colors.primary,
  },
  qrContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  qrContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
  },
  qrMeta: {
    flex: 1,
    gap: 12,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  miniProgress: {
    height: 4,
    backgroundColor: colors.bg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  qrActions: {
    flexDirection: 'row',
    gap: 10,
  },
  qrBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: 10,
  },
  tableTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  exportText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  cardTable: {
    backgroundColor: colors.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  rowNis: {
    fontSize: 10,
    color: colors.textSub,
    marginTop: 2,
  },
  rowAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyTable: {
    padding: 40,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
  },
  verifyBox: {
    backgroundColor: colors.card,
    borderRadius: RADIUS.xl,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  verifyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    marginTop: 12,
  },
  verifySub: {
    fontSize: 13,
    color: colors.textSub,
    marginTop: 4,
    textAlign: 'center',
  },
  verifyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    marginTop: 20,
  },
  verifyBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  scannerCard: {
    backgroundColor: colors.card,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  scannerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
  scannerContainer: {
    width: '100%',
    height: 300,
    borderRadius: RADIUS.xl,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  noPerms: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 12,
  },
  permBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  permBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  camera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scanHint: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textSub,
    marginTop: 16,
    fontWeight: '600',
  },
  scanSuccess: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    marginTop: 16,
  },
  successSub: {
    fontSize: 14,
    color: colors.textSub,
    marginTop: 8,
  },
  resetBtn: {
    marginTop: 24,
    padding: 10,
  },
  resetText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(129, 140, 248, 0.05)',
    padding: 16,
    borderRadius: RADIUS.lg,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.2)',
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    color: colors.info,
    marginLeft: 12,
    lineHeight: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  pickerModal: {
    backgroundColor: colors.card,
    borderRadius: RADIUS.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: colors.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optLabel: {
    fontWeight: '800',
    fontSize: 12,
  },
  cancelBtn: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textSub,
    fontWeight: '700',
  },
  // --- Admin Styles ---
  adminLayout: {
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 56) / 2,
    backgroundColor: colors.card,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderLeftWidth: 4,
    ...SHADOW.card,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statVal: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSub,
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: 10,
  },
  launchpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  launchItem: {
    width: (width - 64) / 3,
    backgroundColor: colors.card,
    borderRadius: RADIUS.xl,
    padding: 16,
    alignItems: 'center',
    ...SHADOW.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  launchIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  launchName: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  sysStatusRow: {
    marginTop: 24,
    gap: 12,
  },
  sysCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: RADIUS.xl,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sysTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
  },
  sysSub: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSub,
    marginTop: 2,
  },
  // --- Account Menu Modal Styles ---
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: 24,
    ...SHADOW.card,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 20,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 16,
  },
  sheetIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetItemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  sheetItemSub: {
    fontSize: 11,
    color: colors.textSub,
    marginTop: 2,
  },
  sheetCloseBtn: {
    marginTop: 20,
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  sheetCloseText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSub,
  },
});
