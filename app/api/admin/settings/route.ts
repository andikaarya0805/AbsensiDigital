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
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return NextResponse.json(data || {});
    } catch (e: any) {
        console.error('Fetch Settings Error:', e);
        return NextResponse.json({ error: 'Failed to fetch settings', details: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { latitude, longitude, radius_meters } = body;

        console.log('[Settings API] Saving:', body);

        // Fetch existing using maybeSingle() which is safer than single()
        const { data: existing, error: fetchError } = await supabase
            .from('school_settings')
            .select('id')
            .limit(1)
            .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Fetch existing settings error:', fetchError);
            throw fetchError;
        }

        let result;
        if (existing) {
            console.log('[Settings API] Updating existing ID:', existing.id);
            result = await supabase
                .from('school_settings')
                .update({ 
                    latitude, 
                    longitude, 
                    radius_meters, 
                    updated_at: new Date().toISOString() 
                })
                .eq('id', existing.id)
                .select();
        } else {
            console.log('[Settings API] Inserting new settings');
            result = await supabase
                .from('school_settings')
                .insert({ latitude, longitude, radius_meters })
                .select();
        }

        if (result.error) {
            console.error('Upsert result error:', result.error);
            throw result.error;
        }

        return NextResponse.json({ 
            success: true, 
            data: result.data?.[0],
            message: 'Pengaturan berhasil diperbarui'
        });

    } catch (error: any) {
        console.error('Settings API Critical Error:', error);
        return NextResponse.json({ 
            error: 'Gagal menyimpan pengaturan', 
            details: error.message,
            code: error.code 
        }, { status: 500 });
    }
}
