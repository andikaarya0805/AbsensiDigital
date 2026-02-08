const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
  console.log("--- Inspecting 'students' table columns ---");
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log("Columns found:", Object.keys(data[0]).join(', '));
  } else {
    console.log("No data in 'students' table to inspect columns.");
  }
}

inspectSchema();
