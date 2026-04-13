const url = 'https://absensi-digital-i87xnkg8j-andikaarya0805s-projects.vercel.app/api/admin/broadcast';
const payload = {
    message: 'Test message from debug script',
    target: 'all'
};

async function test() {
    console.log('Testing Broadcast API...');
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        console.log('Status:', response.status);
        console.log('StatusText:', response.statusText);
        console.log('Content-Type:', response.headers.get('content-type'));
        
        const text = await response.text();
        console.log('Response Body (first 1000Chars):');
        console.log(text.substring(0, 1000));
        
        try {
            const json = JSON.parse(text);
            console.log('Parsed JSON Success:', json);
        } catch (e) {
            console.log('JSON Parse Failed.');
        }
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

test();
