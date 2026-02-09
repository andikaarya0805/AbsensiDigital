# Panduan Deploy Vercel (Repo Private)

Tenang aja, deploy ke Vercel itu gratis dan dukung private repository. Ikuti langkah-langkah simpel ini:

## 1. Persiapan GitHub
Pastikan source code kamu sudah ada di **GitHub** dalam status **Private Repo**:
1. Buat repo baru di GitHub (pilih "Private").
2. Push code ini ke sana.

## 2. Setup Vercel
1. Login ke [vercel.com](https://vercel.com) pakai akun GitHub kamu.
2. Klik tombol **"Add New..."** -> **"Project"**.
3. Di bagian "Import Git Repository", cari nama repo kamu.
   - **PENTING:** Kalau repo kamu gak muncul, klik link **"Adjust GitHub App Permissions"** di bawah list repo. Centang "All repositories" atau pilih repo spesifik supaya Vercel bisa akses repo private kamu.
4. Klik **Import**.

## 3. Konfigurasi Project (PENTING!)
Jangan langsung deploy! Isi dulu konfigurasi ini:

### Framework Preset
Pastikan sudah terpilih **Next.js**.

### Environment Variables
Ini langkah paling krusial. Buka menu **Environment Variables**, lalu copy-paste semua isi dari file `.env.local` kamu di laptop ke sini.

Formatnya:
- **Key**: Nama variabel (misal `NEXT_PUBLIC_SUPABASE_URL`)
- **Value**: Isinya (misal `https://xyz.supabase.co`)

> **💡 Tips Cepat (Cara Import):**
> Kamu nggak perlu ketik satu-persatu!
> 1. Buka file `.env.local` di text editor kamu (Notepad/VS Code).
> 2. Select All (Ctrl+A) lalu Copy (Ctrl+C).
> 3. Di halaman Environment Variables Vercel, klik field **Key** yang paling atas.
> 4. Paste (Ctrl+V).
> 5. Vercel otomatis bakal ngisi semua kolom Key dan Value secara ajaib! ✨

> ⚠️ Tanpa ini, aplikasi kamu bakal error pas jalan atau gagal connect database.

## 4. Deploy!
Klik tombol **Deploy**. Tunggu proses build (biasanya 1-2 menit).
Kalau sukses, kamu bakal dapet domain (contoh: `presensiqr.vercel.app`).

---

## Troubleshooting

### Error: `Type error: ...` saat Build
Vercel secara default nge-build mode production yang strict banget sama error TypeScript. Kalau ada error kecil yang di local gak masalah tapi di Vercel gagal, kamu punya dua opsi:

**Opsi 1 (Disarankan):**
Fix error TypeScript tersebut di kode kamu, lalu push lagi ke GitHub. Vercel otomatis redeploy.

**Opsi 2 (Jalan Pintas / Darurat):**
Matikan pengecekan TypeScript saat build production (tapi jangan dibiasain ya).
Update `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  // ... config lain
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
```

### Database Connection Error
Pastikan kamu pakai connection string yang benar di Environment Variables Vercel. Kalau pakai database yang perlu whitelist IP (misal MongoDB Atlas), kamu perlu "Allow Access from Anywhere (0.0.0.0/0)" karena IP Vercel dinamis.

Selamat mencoba! 🚀
