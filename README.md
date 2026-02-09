# HadirMu - Sistem Absensi Digital Masa Depan 🎓🚀

![HadirMu Banner](C:/Users/andik/.gemini/antigravity/brain/2ad9d6e3-6fa1-4d0c-a324-14167fe50644/hadirmu_banner_1769759427998.png)

**HadirMu** adalah solusi absensi sekolah modern berbasis QR Code Dinamis, Geofencing, dan Real-time Data Sync. Dibuat untuk meningkatkan integritas data kehadiran dengan teknologi *Device Binding* dan integrasi *Supabase*.

## ✨ Fitur Unggulan

- **🛡️ Login Berbasis NIS/NIP**: Login simpel menggunakan Nomor Induk Siswa atau NIP Guru. Sistem menggunakan database internal untuk autentikasi yang lebih cepat dan fleksibel.
- **🔄 Dynamic QR Code**: QR Code yang berubah setiap 30 detik untuk mencegah kecurangan (titip absen).
- **📍 Smart Geofencing**: Absen hanya bisa dilakukan jika siswa berada dalam radius yang ditentukan dari titik sekolah.
- **📱 Device Binding**: Satu akun terkunci pada satu perangkat (1 Account, 1 Device). Tidak bisa absen dari HP orang lain!
- **⚡ Real-time Dashboard**: Guru dan Admin dapat memantau kehadiran siswa secara live.
- **🛠️ Admin Tools**: Dilengkapi dengan halaman `/seed` untuk manajemen data, registrasi guru, dan reset binding perangkat siswa.

## 🚀 Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (Auth, Database, Realtime)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🛠️ Persiapan & Instalasi

### 1. Clone Repository
```bash
git clone https://github.com/andikaarya0805/AbsensiDigital.git
cd AbsensiDigital
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables (`.env.local`)
Buat file `.env.local` dan isi dengan kunci API dari Dashboard Supabase kamu:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_QR_SECRET=your_qr_secret
```

### 4. Setup Database
Jalankan query berikut di **SQL Editor** Supabase untuk struktur dasar yang sesuai dengan sistem HadirMu:

```sql
-- 1. Tabel Kelas
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Siswa
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  nis TEXT UNIQUE NOT NULL,
  password TEXT DEFAULT '123456',
  role TEXT DEFAULT 'student',
  class_id UUID REFERENCES public.classes(id),
  device_id TEXT,
  whatsapp_number TEXT,
  telegram_chat_id TEXT,
  telegram_username TEXT,
  avatar_url TEXT,
  verification_token TEXT,
  first_login BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Guru
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nip TEXT UNIQUE,
  full_name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT DEFAULT 'teacher',
  subject TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Jadwal
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID,
  class_name TEXT,
  subject TEXT,
  day_of_week INTEGER, -- 1 (Senin) - 7 (Minggu)
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Absensi
CREATE TABLE public.attendance (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  status_type TEXT DEFAULT 'hadir', -- hadir, izin, sakit, alpa
  session_name TEXT,
  class_id UUID REFERENCES public.classes(id),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Realtime untuk tabel attendance agar dapat dipantau Live
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
```

## 📖 Cara Penggunaan

1.  **Admin**: Menambahkan data Kelas, Siswa, dan Guru ke dalam tabel masing-masing.
2.  **Guru**: Membuka Dashboard Guru untuk menampilkan QR Code Dinamis sesuai jadwal.
3.  **Siswa**: Login menggunakan NIS (Password default: `123456`). Jika pertama kali, siswa akan diminta mengamankan akun.
4.  **Siswa**: Scan QR Code di perangkat Guru saat sesi pelajaran berlangsung.
5.  **Selesai**: Data kehadiran otomatis terupdate di Dashboard Guru secara Real-time.

---
Dibuat dengan ❤️ untuk kemajuan pendidikan Indonesia. 🇮🇩
