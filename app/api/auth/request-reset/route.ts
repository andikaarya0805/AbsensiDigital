import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(request: Request) {
    try {
        const { identifier } = await request.json();

        if (!identifier) {
            return NextResponse.json({ error: 'NIS atau NIP wajib diisi.' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        let user: any = null;
        let table: 'teachers' | 'students' = 'teachers';

        // 1. Try finding in Teachers (by NIP or Email)
        const { data: teacher } = await supabaseAdmin
            .from('teachers')
            .select('id, full_name, telegram_chat_id')
            .or(`nip.eq.${identifier},email.eq.${identifier}`)
            .maybeSingle();

        if (teacher) {
            user = teacher;
            table = 'teachers';
        } else {
            // 2. Try finding in Students (by NIS)
            const { data: student } = await supabaseAdmin
                .from('students')
                .select('id, full_name, telegram_chat_id')
                .eq('nis', identifier)
                .maybeSingle();

            if (student) {
                user = student;
                table = 'students';
            }
        }

        if (!user) {
            return NextResponse.json({ error: 'Identitas tidak terdaftar di sistem.' }, { status: 404 });
        }

        if (!user.telegram_chat_id) {
            return NextResponse.json({ 
                error: 'Akun Anda belum terhubung ke Telegram. Silakan hubungi Admin untuk reset password atau hubungkan Telegram di profil terlebih dahulu.' 
            }, { status: 403 });
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

        // 5. Send Notification via Telegram
        const type = table === 'teachers' ? 'Password' : 'Password/PIN';
        const message = `🔐 *KODE VERIFIKASI HADIRMU*\n\n` +
            `Halo *${user.full_name}*,\n` +
            `Kode verifikasi untuk reset ${type} Anda adalah: \`${token}\`\n\n` +
            `Kode ini berlaku selama 1 jam. Jangan berikan kode ini kepada siapapun.`;

        await sendTelegramMessage(user.telegram_chat_id, message);

        return NextResponse.json({
            success: true,
            message: 'Kode verifikasi telah dikirim ke Telegram Anda.',
            role: table === 'teachers' ? 'teacher' : 'student'
        });

    } catch (error: any) {
        console.error('Request Reset Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
