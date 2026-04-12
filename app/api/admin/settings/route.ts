import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('school_settings')
            .select('*')
            .single();

        return NextResponse.json(data || {});
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { latitude, longitude, radius_meters } = body;

        // Upsert logic: if exists update, if not insert
        // Since we only want ONE row of settings, we use a fixed ID or check existence.
        const { data: existing } = await supabase.from('school_settings').select('id').limit(1).single();

        let result;
        if (existing) {
            result = await supabase
                .from('school_settings')
                .update({ latitude, longitude, radius_meters })
                .eq('id', existing.id)
                .select();
        } else {
            result = await supabase
                .from('school_settings')
                .insert({ latitude, longitude, radius_meters })
                .select();
        }

        if (result.error) throw result.error;

        return NextResponse.json({ success: true, data: result.data[0] });
    } catch (error: any) {
        console.error('Settings API Error:', error);
        return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 });
    }
}
