require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStudent() {
    const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error fetching students:', error);
    } else {
        console.log('Sample Students:', students.map(s => ({ id: s.id, nis: s.nis, name: s.full_name })));
    }

    const { data: found, error: findError } = await supabase
        .from('students')
        .select('*')
        .eq('nis', '12308')
        .maybeSingle();

    if (findError) {
        console.error('Error finding 12308:', findError);
    } else {
        console.log('Student 12308 found:', found);
    }
}

checkStudent();
