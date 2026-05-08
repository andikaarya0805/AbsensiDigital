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

        console.log(`[Scan API] START - User: ${studentId}, Lat: ${lat}, Lng: ${lng}, session: ${sessionName}`);

        // 1. Basic Validation
        if (!studentId || !qrText) {
            console.error('[Scan API] ERROR: Missing studentId or qrText');
            return NextResponse.json({ error: 'Data presensi tidak lengkap' }, { status: 400 });
        }

        // 2. Fetch Student & Class Info (EARLY)
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('id, full_name, telegram_chat_id, class_id, class, classes(name)')
            .eq('id', studentId)
            .single();

        if (studentError || !student) {
            console.error('[Scan API] ERROR: Student not found', studentError);
            return NextResponse.json({ error: 'Identitas siswa tidak ditemukan' }, { status: 404 });
        }

        const linkedClass = Array.isArray(student.classes) ? student.classes[0]?.name : (student.classes as any)?.name;
        const studentClass = linkedClass || student.class;
        console.log(`[Scan API] Student found: ${student.full_name} (Linked: ${linkedClass}, Legacy: ${student.class})`);

        // 3. QR Security Check
        const QR_SECRET = process.env.NEXT_PUBLIC_QR_SECRET || 'FALLBACK_SECRET';
        const parts = qrText.split('_');

        if (parts.length < 4 || parts[0] !== 'HADIR' || parts[1] !== 'SESSION') {
            console.error('[Scan API] ERROR: Invalid QR Format', qrText);
            return NextResponse.json({ error: 'Format QR Code tidak valid' }, { status: 400 });
        }

        const scannedTimestamp = parseInt(parts[2]);
        const scannedSecret = parts[3];
        
        // Auto-extract sessionName if missing from payload
        if (!sessionName && parts.length >= 5) {
            sessionName = parts.slice(4).join('_');
        }
        
        if (scannedSecret !== QR_SECRET) {
            console.error('[Scan API] ERROR: Secret Mismatch', { scanned: scannedSecret, expected: QR_SECRET });
            return NextResponse.json({ error: 'QR Code palsu atau tidak valid' }, { status: 403 });
        }

        // Validate timestamp (60s window, allow 2 windows tolerance = ~2.5 mins window)
        const currentTimestamp = Math.floor(Date.now() / (60 * 1000));
        const scannedTimeInMinutes = Math.floor(scannedTimestamp * 30 / 60); // QR is in 30s chunks
        
        if (Math.abs(scannedTimeInMinutes - currentTimestamp) > 2) {
            console.error('[Scan API] ERROR: Expired', { scannedTimeInMinutes, currentTimestamp });
            return NextResponse.json({ error: 'QR Code sudah kadaluarsa (silakan scan ulang)' }, { status: 400 });
        }

        // 4. Class Validation
        if (sessionName && studentClass) {
            const qrClassName = sessionName.split(' - ')[0];
            const isMatchingClass = sessionName.toLowerCase().includes(studentClass.toLowerCase());
            
            if (!isMatchingClass) {
                console.warn(`[Scan API] DENIED: Class mismatch. Student class: ${studentClass}, QR for: ${qrClassName}`);
                return NextResponse.json({ 
                    error: `Gagal: Sesi ini untuk kelas "${qrClassName}", sedangkan Anda berada di kelas "${studentClass}".` 
                }, { status: 403 });
            }
        }

        // 5. Geofencing Check
        const { data: settings } = await supabase
            .from('school_settings')
            .select('*')
            .maybeSingle();

        if (settings?.latitude && settings?.longitude && settings.latitude !== 0) {
            if (!lat || !lng) {
                return NextResponse.json({ error: 'Lokasi GPS diperlukan untuk presensi' }, { status: 400 });
            }

            const distance = calculateDistance(lat, lng, settings.latitude, settings.longitude);
            const radius = settings.radius_meters || 50; 

            console.log(`[Geofencing] User distance: ${distance}m, Max radius: ${radius}m`);

            if (distance > radius) {
                return NextResponse.json({ 
                    error: `Gagal: Anda berada di luar radius sekolah (${Math.round(distance)}m). Jarak maksimal adalah ${radius}m.` 
                }, { status: 403 });
            }
        }

        // 6. Rate Limiting (Double Scan)
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

        // 7. Insert Attendance
        const { error: insertError } = await supabase
            .from('attendance')
            .insert({
                student_id: studentId,
                status_type: 'hadir',
                session_name: sessionName || 'DEFAULT',
            });

        if (insertError) throw insertError;

        // 8. Send Telegram Notification
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
