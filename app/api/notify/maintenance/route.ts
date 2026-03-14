import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { title, body, secret } = await req.json();

    // Basic security check
    if (secret !== process.env.NEXT_PUBLIC_QR_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get all push tokens from students and teachers
    const { data: students } = await supabase.from('students').select('expo_push_token').not('expo_push_token', 'is', null);
    const { data: teachers } = await supabase.from('teachers').select('expo_push_token').not('expo_push_token', 'is', null);

    const tokens = [
      ...(students?.map(s => s.expo_push_token) || []),
      ...(teachers?.map(t => t.expo_push_token) || [])
    ];

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, message: 'No tokens found' });
    }

    // 2. Send to Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(tokens.map(token => ({
        to: token,
        title: title || 'HadirMu Maintenance',
        body: body || 'Sistem akan segera dimaintenance. Mohon maaf atas ketidaknyamanannya.',
        data: { type: 'maintenance' },
        sound: 'default',
        priority: 'high',
      }))),
    });

    const result = await response.json();

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error('Push Notification Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
