import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { nis } = await request.json();

        if (!nis) {
            return NextResponse.json({ error: 'NIS is required' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        // Use service_role key to bypass RLS and Auth restrictions
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 1. Check if profile exists
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('students')
            .select('*')
            .eq('nis', nis)
            .maybeSingle();

        if (profileError) throw profileError;
        if (!profile) {
            return NextResponse.json({ error: 'Data NIS tidak terdaftar di sistem.' }, { status: 404 });
        }

        // 2. Check if user already exists in Auth
        const email = `${nis}@hadirmu.school`;
        const { data: authUser, error: authFetchError } = await supabaseAdmin.auth.admin.listUsers();

        if (authFetchError) throw authFetchError;

        let existingUser = authUser.users.find(u => u.email === email);

        if (!existingUser) {
            // Create New Auth User
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: '123456', // Default password
                email_confirm: true,
                user_metadata: { full_name: profile.full_name }
            });

            if (createError) throw createError;
            existingUser = newUser.user;
        }

        // 3. Link profile to Auth ID if not already linked correctly
        if (profile.id !== existingUser.id) {
            const { error: updateError } = await supabaseAdmin
                .from('students')
                .update({ id: existingUser.id })
                .eq('nis', nis);

            if (updateError) throw updateError;
        }

        return NextResponse.json({
            success: true,
            message: 'User synced successfully',
            userId: existingUser.id
        });

    } catch (error: any) {
        console.error('Auth Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
