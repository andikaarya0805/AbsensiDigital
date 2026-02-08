import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: Request) {
    try {
        const update = await req.json();
        console.log('--- Incoming Webhook ---');
        console.log(JSON.stringify(update, null, 2));

        // 1. Validate Input
        if (!update.message || !update.message.text) {
            return NextResponse.json({ ok: true }); // Ignore non-text updates
        }

        const message = update.message;
        const text = message.text;
        const chatId = message.chat.id;
        const username = message.chat.username; // Optional
        const firstName = message.chat.first_name || 'Siswa';

        // 2. Handle /start v_TOKEN Verification
        if (text.startsWith('/start v_')) {
            const token = text.replace('/start v_', '').trim();
            console.log(`Telegram Verification Request: Token=${token}, ChatID=${chatId}`);

            // Find student with this token
            const { data: student, error: fetchError } = await supabase
                .from('students')
                .select('id, full_name')
                .eq('verification_token', token)
                .single();

            if (fetchError || !student) {
                console.log("Token invalid or expired:", token);
                await sendTelegramMessage(chatId, `❌ *Token Tidak Valid*\nToken mungkin sudah kadaluarsa atau salah.`);
                return NextResponse.json({ ok: true });
            }

            // Update Student: Link Telegram & Clear Token
            const { error: updateError } = await supabase
                .from('students')
                .update({
                    telegram_chat_id: chatId,
                    telegram_username: username || null,
                    verification_token: null // Invalidate token to prevent reuse
                })
                .eq('id', student.id);

            if (updateError) {
                console.error("Failed to update student telegram:", updateError);
                await sendTelegramMessage(chatId, `⚠️ *Gagal Menghubungkan*\nTerjadi kesalahan sistem.`);
            } else {
                console.log(`Student ${student.full_name} verified with ChatID ${chatId}`);
                await sendTelegramMessage(chatId, `✅ *Berhasil Terhubung!*\n\nHalo ${student.full_name}, akun HadirMu kamu sudah aktif.\nSekarang kamu bisa menggunakan fitur Scan QR di website.`);
            }

        } else if (text === '/start') {
            // Generic Start
            await sendTelegramMessage(chatId, `👋 *Halo ${firstName}!*\n\nUntuk menghubungkan akun, silakan klik tombol *Verifikasi* di aplikasi HadirMu.`);
        } else {
            // Unknown command
            await sendTelegramMessage(chatId, `🤖 Saya bot HadirMu. Gunakan website untuk interaksi.`);
        }

        return NextResponse.json({ ok: true });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function sendTelegramMessage(chatId: number, text: string) {
    if (!BOT_TOKEN) return;
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.error("Telegram Send Error:", e);
    }
}
