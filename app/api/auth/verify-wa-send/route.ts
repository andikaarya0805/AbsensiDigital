import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { whatsapp_number, userId, role } = await request.json();

        if (!whatsapp_number || !userId || !role) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 10); // 10 Minutes

        // 2. Save OTP to user's record (temporarily in reset_token fields for reuse)
        const table = role === 'teacher' ? 'teachers' : 'students';
        const { error: updateError } = await supabaseAdmin
            .from(table)
            .update({
                reset_token: `VERIFY_${otp}`,
                reset_token_expiry: expiry.toISOString()
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        // 3. Send via WhatsApp
        const message = `🔐 *VERIFIKASI NOMOR WHATSAPP HADIRMU*

Kode verifikasi Anda adalah: *${otp}*

Masukkan kode ini di aplikasi untuk menghubungkan nomor WhatsApp Anda. Kode berlaku selama 10 menit.`;

        await sendWhatsAppMessage(whatsapp_number, message);

        return NextResponse.json({ success: true, message: 'OTP terkirim' });

    } catch (error: any) {
        console.error('Verify WA Send Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
