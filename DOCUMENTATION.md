# HadirMu - Sistem Presensi QR Digital
**Status**: Production Ready ✅

## Overview
HadirMu adalah sistem presensi digital berbasis web yang menggunakan **Dynamic QR Code** untuk memvalidasi kehadiran siswa secara realtime, aman, dan anti-kecurangan.

---

## ✨ Fitur Utama

### 👨‍🏫 Panel Guru (Teacher Dashboard)
- **Schedule Integration**: Otomatis mendeteksi jadwal mengajar berdasarkan akun guru yang login.
- **Dynamic QR Generator**:
  - QR berubah setiap **30 detik** (Anti-Screenshot).
  - Mengandung *encrypted secret* & *timestamp*.
  - Terikat dengan sesi/mata pelajaran spesifik.
- **Realtime Attendance**: Data siswa yang scan langsung muncul "HADIR" tanpa refresh halaman.
- **Rekap & Export**: Filter history per tanggal/kelas dan export laporan ke **Excel**.
- **Security Login**: Login menggunakan Email & Password (Supabase Auth).

### 👨‍🎓 Panel Siswa (Student Dashboard)
- **Simple Login**: Akses menggunakan **NIS** saja (Validation via Database Profiles).
- **Secure Scanner**:
  - Validasi *Secret Key* (dari Environment Variable).
  - Validasi *Timestamp* (Expired dalam 30 detik).
  - **Rate Limiting**: Mencegah absen ganda di sesi yang sama pada hari yang sama.
- **Lokasi**: (Optional) Integrasi GPS check.
- **Logout Aman**: Clear session localStorage.

---

## 🛡️ Security Implementation
1. **Row Level Security (RLS)**:
   - Data siswa aman dari akses orang lain.
   - Siswa hanya bisa `INSERT` (Absen) tapi tidak bisa `DELETE/UPDATE`.
   - Guru memiliki akses penuh ke manajemen data.
2. **Middleware Protection**:
   - Route `/dashboard/teacher` terkunci khusus user Authenticated (Guru).
   - Route `/dashboard/student` divalidasi client-side via Session Check.
3. **Anti-Injection**: Menggunakan Supabase Client (Parameter Binding).
4. **Environment Variables**: Secret Key disimpan di `.env.local`, tidak di-hardcode.

---

## 🧪 Testing Result
| Skenario | Status |
|----------|--------|
| Login Guru & Siswa | ✅ PASS |
| Security Access (Unauthorized URL) | ✅ PASS |
| QR Expired Test (>30s) | ✅ PASS |
| Double Scan Test | ✅ PASS |
| Realtime Update | ✅ PASS |

---

## 🚀 Cara Menjalankan
```bash
# Install dependencies
npm install

# Run Development Server
npm run dev
```

**Credentials Demo:**
- **Guru**: Login via Email (sesuai tabel `teachers`)
- **Siswa**: Login via NIS (sesuai tabel `profiles`)
