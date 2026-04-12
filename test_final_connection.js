const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("--- DB STATUS CHECK (FINAL) ---");
  console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('id, full_name, nis')
      .limit(5);

    if (error) {
      console.error("DB Error:", error.message);
      return;
    }

    console.log(`Successfully connected! Found ${students.length} students.`);
    students.forEach(s => {
      console.log(`Student: ${s.full_name} (${s.nis})`);
    });
  } catch (err) {
    console.error("Unexpected Error:", err.message);
  }
}

check();
