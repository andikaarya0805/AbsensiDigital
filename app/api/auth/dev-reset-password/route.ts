import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseServiceKey) {
            return NextResponse.json({ error: 'Server config error: Missing Service Key' }, { status: 500 });
        }

        // Admin Client to bypass RLS and Auth restrictions
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 1. Find User by Email
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) throw listError;

        const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (!user) {
            return NextResponse.json({ error: 'Email tidak ditemukan di sistem Auth.' }, { status: 404 });
        }

        // 2. Force Update Password
        const newPassword = '123456';
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            message: `Password untuk ${email} berhasil direset ke: ${newPassword}`
        });

    } catch (error: any) {
        console.error('Dev Reset Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
