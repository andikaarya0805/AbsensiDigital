import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { calculateDistance } from '@/lib/geofencing';
import { sendTelegramMessage } from '@/lib/telegram';

// Initialize Supabase Admin Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        let { studentId, sessionName, lat, lng, qrText } = body;

        console.log(`[Scan API] User: ${studentId}, Lat: ${lat}, Lng: ${lng}, QR: ${qrText?.substring(0, 20)}...`);

        // 1. Basic Validation
        if (!studentId || !qrText) {
            return NextResponse.json({ error: 'Data presensi tidak lengkap' }, { status: 400 });
        }

        // 2. QR Security Check
        const QR_SECRET = process.env.NEXT_PUBLIC_QR_SECRET || 'FALLBACK_SECRET';
        const parts = qrText.split('_');

        if (parts.length < 4 || parts[0] !== 'HADIR' || parts[1] !== 'SESSION') {
            return NextResponse.json({ error: 'Format QR Code tidak valid' }, { status: 400 });
        }

        const scannedTimestamp = parseInt(parts[2]);
        const scannedSecret = parts[3];
        
        // Auto-extract sessionName if missing from payload
        if (!sessionName && parts.length >= 5) {
            sessionName = parts.slice(4).join('_');
        }
        
        if (scannedSecret !== QR_SECRET) {
            return NextResponse.json({ error: 'QR Code palsu atau tidak valid' }, { status: 403 });
        }

        // Validate timestamp (30s window, allow 1 window tolerance)
        const currentTimestamp = Math.floor(Date.now() / (30 * 1000));
        if (Math.abs(scannedTimestamp - currentTimestamp) > 1) {
            return NextResponse.json({ error: 'QR Code sudah kadaluarsa (silakan scan ulang)' }, { status: 400 });
        }

        // 3. Geofencing Check
        const { data: settings } = await supabase
            .from('school_settings')
            .select('*')
            .single();

        if (settings?.latitude && settings?.longitude) {
            if (!lat || !lng) {
                return NextResponse.json({ error: 'Lokasi GPS diperlukan untuk presensi' }, { status: 400 });
            }

            const distance = calculateDistance(lat, lng, settings.latitude, settings.longitude);
            const radius = settings.radius_meters || 50; // Default buffer 50m

            console.log(`[Geofencing] User distance: ${distance}m, Max radius: ${radius}m`);

            if (distance > radius) {
                return NextResponse.json({ 
                    error: `Gagal: Anda berada di luar radius sekolah (${Math.round(distance)}m). Jarak maksimal adalah ${radius}m.` 
                }, { status: 403 });
            }
        }

        // 4. Rate Limiting (Double Scan)
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabase
            .from('attendance')
            .select('id')
            .eq('student_id', studentId)
            .eq('session_name', sessionName || 'DEFAULT')
            .gte('timestamp', `${today}T00:00:00`)
            .lte('timestamp', `${today}T23:59:59`)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: 'Anda sudah presensi untuk sesi ini hari ini' }, { status: 400 });
        }

        // 5. Insert Attendance
        const { data: student } = await supabase
            .from('students')
            .select('full_name, telegram_chat_id')
            .eq('id', studentId)
            .single();

        const { error: insertError } = await supabase
            .from('attendance')
            .insert({
                student_id: studentId,
                status_type: 'hadir',
                session_name: sessionName || 'DEFAULT',
            });

        if (insertError) throw insertError;

        // 6. Send Telegram Notification
        if (student?.telegram_chat_id) {
            try {
                const timeStr = new Date().toLocaleTimeString('id-ID', { hour12: false });
                const message = `✅ *Presensi Berhasil!*\n\nHalo *${student.full_name}*,\nPresensi kamu telah dicatat pada:\n\n📅 Tanggal: ${today}\n⏰ Waktu: ${timeStr} WIB\n📚 Sesi: ${sessionName || 'HadirMu'}\n\nSemangat belajarnya! 🚀`;
                await sendTelegramMessage(student.telegram_chat_id, message);
            } catch (tgError) {
                console.error('Telegram Notify Error:', tgError);
            }
        }

        return NextResponse.json({ success: true, message: 'Presensi berhasil dicatat' });

    } catch (error: any) {
        console.error('Scan API Error:', error);
        return NextResponse.json({ error: 'Server Error: ' + error.message }, { status: 500 });
    }
}
