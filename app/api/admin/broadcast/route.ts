import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { message, target } = body;

        console.log(`[Broadcast API] Target: ${target}, Message: ${message}`);

        if (!message) {
            return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 });
        }

        let recipients: { telegram_chat_id: string }[] = [];

        if (target === 'all' || target === 'students') {
            const { data: students } = await supabase
                .from('students')
                .select('telegram_chat_id')
                .not('telegram_chat_id', 'is', null);
            if (students) recipients = [...recipients, ...students];
        }

        if (target === 'all' || target === 'teachers') {
            const { data: teachers } = await supabase
                .from('teachers')
                .select('telegram_chat_id')
                .not('telegram_chat_id', 'is', null);
            if (teachers) recipients = [...recipients, ...teachers];
        }

        // Filter duplicates
        const uniqueChatIds = [...new Set(recipients.map(r => r.telegram_chat_id))];

        if (uniqueChatIds.length === 0) {
            return NextResponse.json({ 
                success: true,
                successCount: 0,
                message: 'Tidak ada user yang terhubung ke Telegram untuk target ini.' 
            }, { status: 200 });
        }

        // Send messages
        const broadcastPromise = uniqueChatIds.map(chatId => 
            sendTelegramMessage(chatId, `📢 *PENGUMUMAN ADMIN*\n\n${message}`)
        );

        await Promise.all(broadcastPromise);

        return NextResponse.json({ 
            success: true, 
            successCount: uniqueChatIds.length,
            message: `Pesan berhasil dikirim ke ${uniqueChatIds.length} user.` 
        });

    } catch (error: any) {
        console.error('Broadcast Error:', error);
        return NextResponse.json({ 
            error: 'Gagal mengirim broadcast', 
            details: error.message 
        }, { status: 500 });
    }
}
