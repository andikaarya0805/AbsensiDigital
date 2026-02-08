import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { whatsapp_number, token, newPassword } = await request.json();

        if (!whatsapp_number || !token || !newPassword) {
            return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 });
        }

        // 1. Password Complexity Validation
        // - Minimal 6 characters
        // - Starts with Uppercase
        // - Contains number
        // - Contains special character
        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });
        }
        if (!/^[A-Z]/.test(newPassword)) {
            return NextResponse.json({ error: 'Password harus diawali huruf besar.' }, { status: 400 });
        }
        if (!/\d/.test(newPassword)) {
            return NextResponse.json({ error: 'Password harus mengandung angka.' }, { status: 400 });
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            return NextResponse.json({ error: 'Password harus mengandung minimal satu karakter spesial.' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        let user: any = null;
        let table: 'teachers' | 'students' = 'teachers';

        // 2. Find User and Verify Token
        // Check Teachers
        const { data: teacher } = await supabaseAdmin
            .from('teachers')
            .select('*')
            .eq('whatsapp_number', whatsapp_number)
            .maybeSingle();

        if (teacher) {
            user = teacher;
            table = 'teachers';
        } else {
            // Check Students
            const { data: student } = await supabaseAdmin
                .from('students')
                .select('*')
                .eq('whatsapp_number', whatsapp_number)
                .maybeSingle();

            if (student) {
                user = student;
                table = 'students';
            }
        }

        if (!user) {
            return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
        }

        if (user.reset_token !== token) {
            return NextResponse.json({ error: 'Token salah atau tidak valid.' }, { status: 400 });
        }

        if (new Date(user.reset_token_expiry) < new Date()) {
            return NextResponse.json({ error: 'Token sudah kadaluarsa.' }, { status: 400 });
        }

        // 3. Update Password
        if (table === 'teachers') {
            // Update Supabase Auth for Teachers
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                user.id,
                { password: newPassword }
            );
            if (authError) throw authError;
        } else {
            // Update Students table (we renamed pin to password in migration)
            const { error: studentError } = await supabaseAdmin
                .from('students')
                .update({ password: newPassword })
                .eq('id', user.id);
            if (studentError) throw studentError;
        }

        // 4. Clear Token
        await supabaseAdmin
            .from(table)
            .update({
                reset_token: null,
                reset_token_expiry: null
            })
            .eq('id', user.id);

        return NextResponse.json({ success: true, message: 'Password berhasil diperbarui.' });

    } catch (error: any) {
        console.error('Verify Reset Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
