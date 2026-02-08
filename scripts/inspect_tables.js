const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  let output = "";
  const log = (msg) => { output += msg + "\n"; console.log(msg); };

  log("--- EXISTING CLASSES ---");
  const { data: classes, error: cError } = await supabase.from('classes').select('*').order('level', { ascending: true });
  if (cError) log("Error fetching classes: " + JSON.stringify(cError));
  if (classes) {
      log(`Found ${classes.length} classes:`);
      classes.forEach(c => log(`- [${c.id}] ${c.name} (Level ${c.level})`));
  }

  log("\n--- STUDENT COUNTS ---");
  // Fetch all students to count manually (simplest way without exact GROUP BY support in simple client sometimes)
  const { data: students, error: sError } = await supabase.from('students').select('id, full_name, class, class_id');
  if (sError) log("Error fetching students: " + JSON.stringify(sError));
  
  if (students) {
      log(`Total students: ${students.length}`);
      const paramCounts = {}; // By 'class' string parameter
      const idCounts = {};    // By 'class_id' UUID
      
      students.forEach(s => {
          const cStr = s.class || "Unassigned";
          paramCounts[cStr] = (paramCounts[cStr] || 0) + 1;

          const cId = s.class_id || "Unassigned";
          idCounts[cId] = (idCounts[cId] || 0) + 1;
      });

      log("\nBy 'class' string column:");
      Object.keys(paramCounts).forEach(k => log(`  ${k}: ${paramCounts[k]}`));

      log("\nBy 'class_id' column:");
      Object.keys(idCounts).forEach(k => {
          // Try to find name if possible
          const cls = classes ? classes.find(c => c.id === k) : null;
          const name = cls ? cls.name : "Unknown/Unassigned";
          log(`  ${name} (${k}): ${idCounts[k]}`);
      });
  }

  fs.writeFileSync('data_analysis_utf8.txt', output, 'utf8');
}

inspect();
