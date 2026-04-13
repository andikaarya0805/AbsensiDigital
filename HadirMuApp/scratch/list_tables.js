const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read from .env.local manually
const envLocal = fs.readFileSync('.env.local', 'utf8');
const getEnv = (name) => {
    const match = envLocal.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('Fetching tables...');
    const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
    
    if (error) {
        // Alternative approach if information_schema is restricted
        console.log('Trying alternative table check...');
        const tablesToCheck = ['school_settings', 'students', 'teachers', 'attendance'];
        for (const table of tablesToCheck) {
            const { error: checkError } = await supabase.from(table).select('*').limit(0);
            console.log(`Table ${table}: ${checkError ? 'ERROR (' + checkError.code + ')' : 'OK'}`);
        }
    } else {
        console.log('Tables found:', data.map(t => t.table_name));
    }
}

listTables();
