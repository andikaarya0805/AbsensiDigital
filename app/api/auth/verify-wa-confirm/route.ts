import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { whatsapp_number, otp, userId, role } = await request.json();

        if (!whatsapp_number || !otp || !userId || !role) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const table = role === 'teacher' ? 'teachers' : 'students';

        // 1. Get User and Check OTP
        const { data: user, error: fetchError } = await supabaseAdmin
            .from(table)
            .select('reset_token, reset_token_expiry')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
        }

        const now = new Date();
        const expiry = new Date(user.reset_token_expiry);

        if (user.reset_token !== `VERIFY_${otp}` || now > expiry) {
            return NextResponse.json({ error: 'Kode verifikasi salah atau sudah kadaluarsa' }, { status: 400 });
        }

        // 2. Clear token and Save WhatsApp Number
        const { error: updateError } = await supabaseAdmin
            .from(table)
            .update({
                whatsapp_number: whatsapp_number,
                reset_token: null,
                reset_token_expiry: null
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, message: 'Nomor WhatsApp berhasil diverifikasi' });

    } catch (error: any) {
        console.error('Verify WA Confirm Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
