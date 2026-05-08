const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addColumn() {
    console.log("Attempting to add 'verification_token' to students table...");
    
    // We use RPC if possible, but usually we just try to update a non-existent row to check if it fails
    // However, the best way is to use the SQL API if enabled, but here we will just tell the user to run SQL.
    // Since I can't run ALTER TABLE via the JS client easily without an RPC.
    
    console.log("---------------------------------------------------------");
    console.log("PLEASE RUN THIS SQL IN YOUR SUPABASE SQL EDITOR:");
    console.log("ALTER TABLE students ADD COLUMN verification_token TEXT;");
    console.log("---------------------------------------------------------");
}

addColumn();
