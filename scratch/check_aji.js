const { createClient } = require('@supabase/supabase-js');
// We use process.env directly if we run with -r dotenv/config or similar
// But let's just hardcode for a quick check or use fs to read .env
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, key);

async function checkStudent() {
    const { data, error } = await supabase
        .from('students')
        .select('id, full_name, nis, class, classes(name)')
        .ilike('full_name', '%aji sinte%');
        
    if (error) {
        console.error("Error:", error);
        return;
    }
    
    console.log(JSON.stringify(data, null, 2));
}

checkStudent();
