const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("--- DB STATUS CHECK ---");
  
  // Check column existence by querying
  const { data: students, error } = await supabase
    .from('students')
    .select('id, full_name, nis, telegram_chat_id, verification_token')
    .limit(5);

  if (error) {
    console.error("DB Error:", error.message);
    return;
  }

  console.log(`Found ${students.length} students.`);
  students.forEach(s => {
    console.log(`Student: ${s.full_name} (${s.nis})`);
    console.log(` - Token: ${s.verification_token ? 'EXISTS' : 'NULL'}`);
    console.log(` - ChatID: ${s.telegram_chat_id ? 'VERIFIED ('+s.telegram_chat_id+')' : 'NOT VERIFIED'}`);
  });
}

check();
