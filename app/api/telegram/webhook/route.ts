import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

// Initialize Supabase Admin Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
        const firstName = message.chat.first_name || 'User';

        // 2. Handle /start v_TOKEN Verification
        if (text.startsWith('/start v_')) {
            const token = text.replace('/start v_', '').trim();
            console.log(`Telegram Verification Request: Token=${token}, ChatID=${chatId}`);

            // A. Try finding in students first
            let { data: user, error: fetchError } = await supabase
                .from('students')
                .select('id, full_name, role')
                .eq('verification_token', token)
                .single();

            let targetTable = 'students';

            // B. If not found in students, try teachers
            if (!user) {
                const { data: teacher, error: teacherError } = await supabase
                    .from('teachers')
                    .select('id, full_name, role')
                    .eq('verification_token', token)
                    .single();
                
                if (teacher) {
                    user = teacher;
                    targetTable = 'teachers';
                }
            }

            if (!user) {
                console.log("Token invalid or expired:", token);
                await sendTelegramMessage(chatId, `❌ *Token Tidak Valid*\nToken mungkin sudah kadaluarsa atau salah.`);
                return NextResponse.json({ ok: true });
            }

            // Update User: Link Telegram & Clear Token
            const { error: updateError } = await supabase
                .from(targetTable)
                .update({
                    telegram_chat_id: chatId,
                    telegram_username: username || null,
                    verification_token: null // Invalidate token to prevent reuse
                })
                .eq('id', user.id);

            if (updateError) {
                console.error(`Failed to update ${targetTable} telegram:`, updateError);
                await sendTelegramMessage(chatId, `⚠️ *Gagal Menghubungkan*\nTerjadi kesalahan sistem.`);
            } else {
                console.log(`${user.role} ${user.full_name} verified with ChatID ${chatId}`);
                await sendTelegramMessage(
                    chatId, 
                    `✅ *Berhasil Terhubung!*\n\nHalo ${user.full_name}, akun HadirMu (${user.role === 'teacher' ? 'Guru' : 'Siswa'}) kamu sudah aktif terhubung dengan Telegram.`
                );
            }

        } else if (text === '/start') {
            await sendTelegramMessage(chatId, `👋 *Halo ${firstName}!*\n\nUntuk menghubungkan akun, silakan klik tombol *Verifikasi* (Hubungkan Telegram) di profil aplikasi HadirMu.`);
        } else if (text === '/status' || text === '/cek') {
            // Find user first
            let { data: user } = await supabase
                .from('students')
                .select('id, full_name')
                .eq('telegram_chat_id', chatId)
                .single();

            if (!user) {
                const { data: teacher } = await supabase
                    .from('teachers')
                    .select('id, full_name')
                    .eq('telegram_chat_id', chatId)
                    .single();
                user = teacher;
            }

            if (!user) {
                await sendTelegramMessage(chatId, `⚠️ *Akun Tidak Ditemukan*\nSilakan hubungkan akun Anda di website HadirMu terlebih dahulu.`);
                return NextResponse.json({ ok: true });
            }

            // Get month range
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            const { data: logs } = await supabase
                .from('attendance')
                .select('status_type')
                .eq('student_id', user.id)
                .gte('timestamp', startOfMonth.toISOString());

            const hadir = logs?.filter(l => l.status_type === 'hadir').length || 0;
            const izin = logs?.filter(l => l.status_type === 'izin').length || 0;
            const sakit = logs?.filter(l => l.status_type === 'sakit').length || 0;
            const alpha = logs?.filter(l => l.status_type === 'alpha').length || 0;

            const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date());

            const statusMsg = `📊 *Rekap Presensi ${monthName}*\n\n👤 Nama: *${user.full_name}*\n\n✅ Hadir: ${hadir}\nℹ️ Izin: ${izin}\n🤒 Sakit: ${sakit}\n❌ Alpha: ${alpha}\n\n_Data diambil secara real-time dari sistem HadirMu._`;
            
            await sendTelegramMessage(chatId, statusMsg);

        } else {
            await sendTelegramMessage(chatId, `🤖 Saya bot HadirMu.\n\nGunakan perintah berikut:\n/status - Cek rekap bulanan\n/start - Petunjuk awal`);
        }

        return NextResponse.json({ ok: true });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
