import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { userId, type, action } = body; // action: 'reset_password', 'reset_device_id'

        console.log(`[Reset API] Action: ${action}, User: ${userId}, Type: ${type}`);

        if (!userId || !type || !action) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
        }

        const table = type === 'student' ? 'students' : 'teachers';
        const payload: any = {};

        if (action === 'reset_password') {
            payload.password = '123456';
        } else if (action === 'reset_device_id') {
            payload.device_id = null;
        } else {
            return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 });
        }

        const { error } = await supabase
            .from(table)
            .update(payload)
            .eq('id', userId);

        if (error) throw error;

        return NextResponse.json({ 
            success: true, 
            message: action === 'reset_password' 
                ? 'Password berhasil direset ke 123456' 
                : 'Device ID berhasil direset' 
        });

    } catch (error: any) {
        console.error('Reset Error:', error);
        return NextResponse.json({ 
            error: 'Gagal melakukan reset', 
            details: error.message 
        }, { status: 500 });
    }
}
