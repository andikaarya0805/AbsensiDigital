import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        let url = searchParams.get('url');

        if (!url) {
            return NextResponse.json({ error: 'Missing ?url= parameter' }, { status: 400 });
        }

        // Clean URL: remove trailing slash and existing paths if the user pasted full path
        url = url.replace(/\/$/, '').replace(/\/api\/telegram\/webhook$/, '');

        const webhookUrl = `${url}/api/telegram/webhook`;

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${webhookUrl}`);
        const data = await response.json();

        if (data.ok) {
            return NextResponse.json({
                success: true,
                message: `Webhook successfully set to: ${webhookUrl}`
            });
        } else {
            return NextResponse.json({
                success: false,
                error: data.description
            });
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
