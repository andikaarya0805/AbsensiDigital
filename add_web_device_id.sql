-- Tambah kolom web_device_id untuk dual device binding (web + mobile app)
-- Jalankan ini di Supabase SQL Editor

ALTER TABLE students ADD COLUMN IF NOT EXISTS web_device_id TEXT DEFAULT NULL;

-- Reset device_id yang lama biar bisa login ulang dari awal
-- (optional, uncomment jika mau reset semua)
-- UPDATE students SET device_id = NULL, web_device_id = NULL;

-- Reset spesifik untuk NIS 12008
UPDATE students SET device_id = NULL, web_device_id = NULL WHERE nis = '12008';
