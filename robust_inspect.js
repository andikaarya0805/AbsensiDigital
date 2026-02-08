const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log("--- STUDENTS TABLE ---");
  const { data: sData } = await supabase.from('students').select('*').limit(1);
  if (sData && sData[0]) Object.keys(sData[0]).forEach(k => console.log(`COL: ${k}`));
  
  console.log("\n--- TEACHERS TABLE ---");
  const { data: tData } = await supabase.from('teachers').select('*').limit(1);
  if (tData && tData[0]) Object.keys(tData[0]).forEach(k => console.log(`COL: ${k}`));
}

inspect();
