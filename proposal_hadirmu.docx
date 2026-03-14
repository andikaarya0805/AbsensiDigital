# PROPOSAL PROYEK
# SISTEM INFORMASI ABSENSI DIGITAL BERBASIS QR CODE DINAMIS
# **"HadirMu"**

---

**Diajukan Oleh:**

| | |
|---|---|
| **Nama** | Andika Arya |
| **NIM** | *(isi NIM kamu)* |
| **Program Studi** | *(isi Prodi kamu)* |
| **Institusi** | *(isi nama kampus/sekolah kamu)* |
| **Tanggal** | 14 Maret 2026 |

---

## BAB I — PENDAHULUAN

### 1.1 Latar Belakang

Kehadiran siswa merupakan salah satu indikator penting dalam mengukur kedisiplinan dan partisipasi proses pembelajaran. Namun, sistem absensi konvensional yang masih banyak digunakan saat ini—seperti pengisian daftar hadir manual—memiliki berbagai kelemahan, di antaranya:

- **Rentan kecurangan** berupa *titip absen*, yaitu siswa meminta temannya menandatangani absen meskipun yang bersangkutan tidak hadir.
- **Rekap data lambat** karena guru harus merekap manual ke dalam buku atau spreadsheet.
- **Tidak ada pemantauan real-time** bagi pihak sekolah atau orang tua.
- **Data tidak terpusat** sehingga sulit untuk menganalisis tren kehadiran.

Perkembangan teknologi informasi, khususnya perangkat *smartphone* yang kini dimiliki hampir setiap pelajar, membuka peluang untuk menghadirkan solusi absensi yang lebih modern, akurat, dan aman. Dengan memanfaatkan teknologi **QR Code Dinamis**, **Geofencing**, dan **Device Binding**, sistem absensi dapat dirancang sehingga kecurangan dapat diminimalkan secara signifikan.

### 1.2 Rumusan Masalah

Berdasarkan latar belakang di atas, rumusan masalah dalam proyek ini adalah:

1. Bagaimana merancang sistem absensi digital yang dapat mencegah praktik *titip absen*?
2. Bagaimana mengimplementasikan mekanisme *QR Code Dinamis* yang hanya valid dalam rentang waktu tertentu?
3. Bagaimana menerapkan *Device Binding* agar satu akun hanya dapat digunakan pada satu perangkat?
4. Bagaimana memastikan siswa hanya dapat melakukan absensi saat berada di lokasi sekolah melalui *Geofencing*?
5. Bagaimana menyediakan dashboard real-time bagi guru dan admin untuk memantau kehadiran siswa?

### 1.3 Tujuan Proyek

Tujuan dari pengembangan sistem ini adalah:

1. Membangun aplikasi web absensi digital bernama **HadirMu** berbasis QR Code dinamis yang aman dan modern.
2. Mengimplementasikan fitur keamanan berlapis: *Dynamic QR Code*, *Device Binding*, dan *Smart Geofencing*.
3. Menyediakan dashboard manajemen kehadiran secara *real-time* bagi guru dan administrator sekolah.
4. Mengintegrasikan notifikasi otomatis melalui platform pesan.

### 1.4 Manfaat Proyek

| Pihak | Manfaat |
|---|---|
| **Siswa** | Proses absensi lebih cepat, mudah, dan transparan |
| **Guru** | Rekap kehadiran otomatis, pemantauan real-time |
| **Admin Sekolah** | Data terpusat, laporan kehadiran akurat dan mudah diakses |
| **Institusi** | Meningkatkan integritas dan akuntabilitas data kehadiran |

---

## BAB II — BATASAN SISTEM

Untuk menjaga fokus dan kelayakan pengembangan, sistem dibatasi pada:

1. Platform berbasis **web aplikasi** (dapat diakses melalui browser di smartphone atau komputer).
2. Absensi dilakukan dengan **scan QR Code** yang ditampilkan di perangkat guru.
3. Autentikasi menggunakan **NIS (Nomor Induk Siswa)** untuk siswa dan **NIP** untuk guru.
4. QR Code bersifat **dinamis** dan hanya berlaku selama **30 detik**.
5. Satu akun siswa hanya dapat terdaftar pada **satu perangkat** (*Device Binding*).
6. Absensi hanya dapat dilakukan dalam **radius lokasi yang ditentukan** dari sekolah (*Geofencing*).
7. Data disimpan dan dikelola menggunakan layanan **Supabase** (PostgreSQL + Realtime).

---

## BAB III — TINJAUAN PUSTAKA

### 3.1 QR Code (Quick Response Code)

QR Code adalah kode matriks dua dimensi yang dapat menyimpan informasi dalam jumlah besar dan dapat dibaca oleh kamera smartphone. Dalam sistem ini, QR Code dibuat **dinamis** dengan menambahkan token waktu (*timestamp*) dan tanda tangan kriptografis (*HMAC secret key*) sehingga setiap kode berbeda setiap 30 detik dan tidak bisa disalahgunakan melalui *screenshot*.

### 3.2 Geofencing

Geofencing adalah teknologi yang menggunakan data GPS/lokasi untuk membuat batas geografis virtual (*geofence*). Sistem akan memvalidasi koordinat GPS perangkat siswa dan memastikan posisinya berada dalam radius yang telah ditentukan sebelum mengizinkan proses absensi.

### 3.3 Device Binding

Device Binding adalah mekanisme keamanan yang mengikat satu akun pengguna hanya pada satu perangkat fisik berdasarkan identitas unik perangkat (*device fingerprint*). Pendekatan ini efektif mencegah penyalahgunaan akun dari perangkat yang berbeda.

### 3.4 Next.js dan Supabase

- **Next.js 15** adalah framework React berbasis Node.js yang mendukung rendering sisi server (SSR) dan *App Router*, cocok untuk membangun aplikasi web yang cepat dan SEO-friendly.
- **Supabase** adalah platform *Backend-as-a-Service* (BaaS) berbasis PostgreSQL yang menyediakan autentikasi, database, penyimpanan, dan fitur *Realtime* untuk memantau perubahan data secara langsung.

---

## BAB IV — METODOLOGI PENGEMBANGAN

Pengembangan sistem menggunakan pendekatan **Agile Development** dengan siklus iterasi pendek. Tahapan pengembangan adalah sebagai berikut:

```
Analisis Kebutuhan → Desain Sistem → Implementasi → Pengujian → Deployment
```

### 4.1 Analisis Kebutuhan

Mengidentifikasi kebutuhan fungsional dan non-fungsional sistem berdasarkan permasalahan yang ada di lingkungan sekolah.

### 4.2 Desain Sistem

Merancang:
- **Arsitektur sistem** (Client ↔ Next.js Server ↔ Supabase)
- **Skema database** (Tabel: `students`, `teachers`, `classes`, `schedules`, `attendance`)
- **Alur proses absensi** dan antarmuka pengguna (UI/UX)

### 4.3 Implementasi

Pengembangan dilakukan menggunakan teknologi berikut:

| Komponen | Teknologi |
|---|---|
| Framework Web | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Backend & Database | Supabase (PostgreSQL) |
| Realtime Update | Supabase Realtime |
| Autentikasi | Custom Auth (NIS/NIP based) |
| Keamanan QR | HMAC SHA-256 dengan secret key |
| Ikon & UI | Lucide React |

### 4.4 Pengujian

- **Pengujian fungsional**: Memastikan semua fitur berjalan sesuai spesifikasi.
- **Pengujian keamanan**: Simulasi *titip absen* melalui screenshot dan perangkat berbeda.
- **Pengujian geofencing**: Memvalidasi pembatasan lokasi berhasil.

### 4.5 Deployment

Aplikasi akan di-*deploy* ke layanan hosting seperti **Vercel** dan dapat diakses secara publik melalui URL yang diberikan kepada sekolah.

---

## BAB V — FITUR SISTEM

### 5.1 Fitur Utama

#### 🔄 Dynamic QR Code
QR Code yang ditampilkan di perangkat guru akan **berubah secara otomatis setiap 30 detik**. Setiap QR Code mengandung token terenkripsi sehingga tidak bisa dipalsukan melalui *screenshot*.

#### 📍 Smart Geofencing
Siswa hanya dapat melakukan absensi jika perangkatnya **terdeteksi berada dalam radius yang ditentukan** dari lokasi sekolah. Jika di luar radius, sistem akan menolak proses absensi.

#### 📱 Device Binding (1 Akun, 1 Perangkat)
Setiap akun siswa hanya dapat digunakan pada **satu perangkat terdaftar**. Jika mencoba login dari HP yang berbeda, sistem akan menolak akses—kecuali admin melakukan reset binding.

#### ⚡ Real-time Dashboard
Guru dan admin dapat memantau data kehadiran secara **langsung (live)** tanpa perlu refresh halaman, memanfaatkan teknologi Supabase Realtime.

#### 🛠️ Manajemen Admin Lengkap
Admin dapat mengelola:
- Data Siswa (CRUD)
- Data Guru (CRUD)
- Data Kelas (CRUD)
- Data Mata Pelajaran (CRUD)
- Jadwal Pelajaran
- Laporan Kehadiran

#### 🔐 Keamanan Berlapis
- Row Level Security (RLS) di database
- Middleware proteksi rute berdasarkan role
- Variabel lingkungan terenkripsi

### 5.2 Alur Penggunaan

```
┌─────────┐     ┌──────────────────────┐     ┌───────────────────────┐
│  Admin  │────▶│ Input data           │────▶│ Siswa & Guru terdaftar│
└─────────┘     │ Kelas, Siswa, Guru   │     └───────────────────────┘
                └──────────────────────┘
                                                        │
┌─────────┐     ┌──────────────────────┐               ▼
│  Guru   │────▶│ Buka Dashboard Guru  │     ┌───────────────────────┐
└─────────┘     │ QR Code tampil live  │     │ Siswa login via NIS   │
                └──────────────────────┘     │ Perangkat terdaftar   │
                         │                   └───────────────────────┘
                         │                              │
                         └──────────────────────────────▼
                                              ┌─────────────────────┐
                                              │ Siswa scan QR Code  │
                                              │ ✅ Validasi:         │
                                              │  - Token valid?      │
                                              │  - Dalam radius?     │
                                              │  - Device sesuai?    │
                                              └─────────────────────┘
                                                         │
                                                         ▼
                                              ┌─────────────────────┐
                                              │ Absensi Tercatat    │
                                              │ Real-time di        │
                                              │ Dashboard Guru      │
                                              └─────────────────────┘
```

---

## BAB VI — RENCANA JADWAL PENGERJAAN

| Minggu | Kegiatan |
|:---:|---|
| 1 | Analisis kebutuhan, perancangan database, dan desain UI/UX |
| 2 | Implementasi autentikasi, sistem QR Code Dinamis, dan Device Binding |
| 3 | Implementasi Geofencing, Dashboard Real-time, dan Admin Panel |
| 4 | Pengujian sistem (fungsional & keamanan), perbaikan bug, deployment |
| 5 | Penyusunan laporan akhir dan presentasi |

---

## BAB VII — PENUTUP

Sistem **HadirMu** dirancang untuk menjawab permasalahan nyata yang terjadi dalam manajemen kehadiran di institusi pendidikan. Dengan menggabungkan teknologi *Dynamic QR Code*, *Geofencing*, dan *Device Binding* dalam satu platform web yang modern, sistem ini mampu memberikan solusi absensi yang **aman, efisien, dan andal**.

Diharapkan proposal ini dapat mendapat persetujuan untuk dilanjutkan ke tahap pengembangan penuh. Atas perhatian dan bimbingan yang diberikan, kami mengucapkan terima kasih.

---

*Hormat kami,*

&nbsp;

**Andika Arya**
*(NIM: ....)*
14 Maret 2026
