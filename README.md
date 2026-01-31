# HadirMu - Sistem Absensi Digital Masa Depan 🎓🚀

![HadirMu Banner](C:/Users/andik/.gemini/antigravity/brain/2ad9d6e3-6fa1-4d0c-a324-14167fe50644/hadirmu_banner_1769759427998.png)

**HadirMu** adalah solusi absensi sekolah modern berbasis QR Code Dinamis, Geofencing, dan Real-time Data Sync. Dibuat untuk meningkatkan integritas data kehadiran dengan teknologi *Device Binding* dan integrasi *Supabase*.

## ✨ Fitur Unggulan

- **🛡️ Login Berbasis NIS**: Login simpel menggunakan Nomor Induk Siswa. Akun otomatis disinkronkan ke Supabase Auth saat pertama kali masuk.
- **🔄 Dynamic QR Code**: QR Code yang berubah setiap 30 detik untuk mencegah kecurangan (titip absen).
- **📍 Smart Geofencing**: Absen hanya bisa dilakukan jika siswa berada dalam radius yang ditentukan dari titik sekolah.
- **📱 Device Binding**: Satu akun terkunci pada satu perangkat. Tidak bisa absen dari HP orang lain!
- **⚡ Real-time Dashboard**: Guru dapat memantau kehadiran siswa secara live tanpa perlu refresh halaman.
- **🔑 Auto-Account Sync**: Cukup masukkan data di tabel `profiles`, akun login akan dibuat otomatis saat siswa login pertama kali.

## 🚀 Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (Auth, Database, Realtime)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Components**: Framer Motion & Radix UI (Coming Soon)

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
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (Penting untuk Auto-Sync)
```

### 4. Setup Database
Jalankan query berikut di **SQL Editor** Supabase:
```sql
-- Tabel Profil Pengguna
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nis TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'student',
  device_id TEXT,
  first_login BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Absensi
CREATE TABLE public.attendance (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'present',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  class_id TEXT DEFAULT 'MAIN_CLASS'
);

-- Aktifkan Realtime untuk tabel attendance
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
```

## 📖 Cara Penggunaan

1.  **Admin/Guru**: Menambahkan data murid (Nama & NIS) ke dalam tabel `profiles`.
2.  **Guru**: Membuka Dashboard Guru untuk menampilkan QR Code Dinamis.
3.  **Siswa**: Login menggunakan NIS (Password default: `123456`), jika pertama kali akan diminta ganti password.
4.  **Siswa**: Scan QR Code di laptop Guru. Pastikan GPS aktif!
5.  **Selesai**: Data kehadiran muncul secara Real-time di layar Guru.

## 🤝 Kontribusi
Kontribusi selalu terbuka! Silakan lakukan *Fork* repository ini dan kirimkan *Pull Request*.

---
Dibuat dengan ❤️ untuk kemajuan pendidikan Indonesia. 🇮🇩
