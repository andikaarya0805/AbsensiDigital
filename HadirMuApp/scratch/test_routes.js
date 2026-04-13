const baseUrl = 'https://absensi-digital-i87xnkg8j-andikaarya0805s-projects.vercel.app';
const routes = [
    '/api/admin/broadcast',
    '/api/admin/users/reset',
];

async function test() {
    for (const route of routes) {
        const url = `${baseUrl}${route}`;
        console.log(`Testing ${route}...`);
        try {
            const response = await fetch(url, { method: 'POST' });
            console.log(`  Status: ${response.status}`);
            console.log(`  Content-Type: ${response.headers.get('content-type')}`);
        } catch (e) {
            console.log(`  Error: ${e.message}`);
        }
    }
}

test();
