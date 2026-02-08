import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(request: Request) {
    try {
        const { whatsapp_number } = await request.json();

        if (!whatsapp_number) {
            return NextResponse.json({ error: 'Nomor WhatsApp wajib diisi.' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        let user: any = null;
        let table: 'teachers' | 'students' = 'teachers';

        // 1. Try finding in Teachers
        const { data: teacher } = await supabaseAdmin
            .from('teachers')
            .select('id, full_name')
            .eq('whatsapp_number', whatsapp_number)
            .maybeSingle();

        if (teacher) {
            user = teacher;
            table = 'teachers';
        } else {
            // 2. Try finding in Students
            const { data: student } = await supabaseAdmin
                .from('students')
                .select('id, full_name')
                .eq('whatsapp_number', whatsapp_number)
                .maybeSingle();

            if (student) {
                user = student;
                table = 'students';
            }
        }

        if (!user) {
            return NextResponse.json({ error: 'Nomor WhatsApp tidak terdaftar di sistem.' }, { status: 404 });
        }

        // 3. Generate Token
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1); // 1 Hour

        // 4. Save Token
        const { error: updateError } = await supabaseAdmin
            .from(table)
            .update({
                reset_token: token,
                reset_token_expiry: expiry.toISOString()
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        // 5. Send Notification via WhatsApp
        const type = table === 'teachers' ? 'Password' : 'Password/PIN';
        const message = `🔐 *KODE VERIFIKASI HADIRMU*\n\n` +
            `Halo ${user.full_name},\n` +
            `Kode verifikasi untuk reset ${type} Anda adalah: *${token}*\n\n` +
            `Kode ini berlaku selama 1 jam. Jangan berikan kode ini kepada siapapun.`;

        await sendWhatsAppMessage(whatsapp_number, message);

        return NextResponse.json({
            success: true,
            message: 'OTP berhasil dikirim ke WhatsApp.',
            role: table === 'teachers' ? 'teacher' : 'student'
        });

    } catch (error: any) {
        console.error('Request Reset Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
