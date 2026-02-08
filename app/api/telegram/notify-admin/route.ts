import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { nis, student_name, token, type } = await request.json();

        // 1. Get Config from Env
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            console.error("Telegram Config Missing");
            return NextResponse.json({
                error: 'Server Telegram Config Missing'
            }, { status: 500 });
        }

        // 2. Compose Message based on type
        let message = '';
        if (type === 'TEACHER_RESET') {
            message = `🔐 *PERMINTAAN RESET PASSWORD GURU*\n\n` +
                `Email: ${nis}\n` + // nis here acts as identifier/email
                `Token Reset: \`${token}\`\n\n` +
                `Berikan token ini kepada guru yang bersangkutan.`;
        } else {
            // Default: Student
            message = `🔐 *PERMINTAAN RESET PIN SISWA*\n\n` +
                `Nama: ${student_name}\n` +
                `NIS: ${nis}\n` +
                `Token Reset: \`${token}\`\n\n` +
                `Berikan token ini kepada siswa tersebut untuk melanjutkan proses reset PIN.`;
        }

        // 3. Send to Telegram API
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const result = await res.json();

        if (!result.ok) {
            console.error("Telegram API Error:", result);
            return NextResponse.json({ error: 'Gagal mengirim pesan Telegram' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Notifikasi terkirim ke Admin' });

    } catch (error: any) {
        console.error('Telegram Handler Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
