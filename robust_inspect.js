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
  const tables = ['students', 'teachers', 'attendance', 'schedules', 'classes'];
  let output = "";
  
  for (const table of tables) {
    output += `\n--- ${table.toUpperCase()} TABLE ---\n`;
    const { data, error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
       output += `Error inspecting ${table}: ${error.message}\n`;
       continue;
    }
    
    if (data && data.length > 0) {
      output += `Columns: ${JSON.stringify(Object.keys(data[0]))}\n`;
    } else {
      output += `No data found in ${table}\n`;
    }
  }
  
  fs.writeFileSync('schema_result.txt', output);
  console.log("Schema written to schema_result.txt");
}

inspect();
