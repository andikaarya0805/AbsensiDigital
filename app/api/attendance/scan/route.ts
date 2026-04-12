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
        const { studentId, sessionName, lat, lng, qrText } = await req.json();

        // 1. Basic Validation
        if (!studentId || !qrText) {
            return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
        }

        // 2. QR Security Check
        const QR_SECRET = process.env.NEXT_PUBLIC_QR_SECRET || 'FALLBACK_SECRET';
        const parts = qrText.split('_');

        if (parts.length < 4 || parts[0] !== 'HADIR' || parts[1] !== 'SESSION') {
            return NextResponse.json({ error: 'Format QR Code tidak valid' }, { status: 400 });
        }

        const scannedTimestamp = parseInt(parts[2]);
        const scannedSecret = parts[3];
        
        if (scannedSecret !== QR_SECRET) {
            return NextResponse.json({ error: 'QR Code palsu atau tidak valid' }, { status: 403 });
        }

        // Validate timestamp (30s window, allow 1 window tolerance)
        const currentTimestamp = Math.floor(Date.now() / (30 * 1000));
        if (Math.abs(scannedTimestamp - currentTimestamp) > 1) {
            return NextResponse.json({ error: 'QR Code sudah kadaluarsa' }, { status: 400 });
        }

        // 3. Geofencing Check
        // Fetch school settings
        const { data: settings } = await supabase
            .from('school_settings')
            .select('*')
            .single();

        if (settings?.latitude && settings?.longitude) {
            if (!lat || !lng) {
                return NextResponse.json({ error: 'Lokasi GPS diperlukan untuk presensi' }, { status: 400 });
            }

            const distance = calculateDistance(lat, lng, settings.latitude, settings.longitude);
            const radius = settings.radius_meters || 20;

            if (distance > radius) {
                return NextResponse.json({ 
                    error: `Anda berada di luar radius sekolah (${Math.round(distance)}m). Jarak maksimal adalah ${radius}m.` 
                }, { status: 403 });
            }
        }

        // 4. Rate Limiting (Double Scan)
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabase
            .from('attendance')
            .select('id')
            .eq('student_id', studentId)
            .eq('session_name', sessionName)
            .gte('timestamp', `${today}T00:00:00`)
            .lte('timestamp', `${today}T23:59:59`)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Anda sudah melakukan presensi untuk sesi ini' }, { status: 400 });
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
                session_name: sessionName,
                status: 'present' // for compatibility with admin reports
            });

        if (insertError) throw insertError;

        // 6. Send Telegram Notification
        if (student?.telegram_chat_id) {
            const timeStr = new Date().toLocaleTimeString('id-ID', { hour12: false });
            const message = `✅ *Presensi Berhasil!*\n\nHalo *${student.full_name}*,\nPresensi kamu telah dicatat pada:\n\n📅 Tanggal: ${today}\n⏰ Waktu: ${timeStr} WIB\n📚 Sesi: ${sessionName}\n\nSemangat belajarnya! 🚀`;
            
            await sendTelegramMessage(student.telegram_chat_id, message);
        }

        return NextResponse.json({ success: true, message: 'Presensi berhasil dicatat' });

    } catch (error: any) {
        console.error('Scan API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
