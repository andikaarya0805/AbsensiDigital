import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { id, full_name, password, whatsapp_number, avatar_url } = await req.json();

        console.log('Update Profile Request for ID:', id);
        console.log('New Password length:', password?.length);

        const updateData: any = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (password !== undefined) updateData.password = password;
        if (whatsapp_number !== undefined) updateData.whatsapp_number = whatsapp_number;
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

        console.log('Update Data:', updateData);

        const { data, error } = await supabase
            .from('students')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase Update Error:', error);
            throw error;
        }

        console.log('Profile updated successfully in DB');

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Update Profile Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
