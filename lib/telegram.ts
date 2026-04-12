/**
 * Telegram Bot API Utility
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Sends a message to a Telegram chat
 * @param chatId The chat ID to send to
 * @param text The message text (Markdown supported)
 */
export async function sendTelegramMessage(chatId: string | number, text: string) {
    if (!BOT_TOKEN) {
        throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
    }

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown',
        }),
    });

    const data = await response.json();

    if (!data.ok) {
        console.error('Telegram Send Error:', data);
        throw new Error(data.description || 'Failed to send Telegram message');
    }

    return data;
}
