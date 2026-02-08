export async function sendWhatsAppMessage(target: string, message: string) {
    const token = process.env.FONNTE_TOKEN?.trim();

    if (!token) {
        console.error("FONNTE_TOKEN is not set in environment variables");
        throw new Error("WhatsApp config error");
    }

    console.log(`Sending WA to ${target}. Token starts with: ${token.substring(0, 5)}...`);

    try {
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': token
            },
            body: new URLSearchParams({
                'target': target,
                'message': message,
                'token': token
            })
        });

        const result = await response.json();

        if (!result.status) {
            console.error("Fonnte API Error Details:", JSON.stringify(result, null, 2));
            throw new Error(result.reason || "Gagal mengirim pesan WhatsApp");
        }

        return result;
    } catch (error: any) {
        console.error("Error sending WhatsApp:", error);
        throw error;
    }
}
