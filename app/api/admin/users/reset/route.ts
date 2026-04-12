import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { userId, type, target, action } = await req.json();

        if (!userId || !type || !action) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const table = type === 'student' ? 'students' : 'teachers';
        let updateData: any = {};

        if (action === 'reset_password') {
            // Default password is '123456'
            updateData.password = '123456';
        } else if (action === 'reset_device_id') {
            updateData.device_id = null;
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from(table)
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ 
            success: true, 
            message: action === 'reset_password' ? 'Password berhasil direset ke 123456' : 'ID Perangkat berhasil direset'
        });

    } catch (error: any) {
        console.error('Reset User Error:', error);
        return NextResponse.json({ error: 'Gagal melakukan reset: ' + error.message }, { status: 500 });
    }
}
