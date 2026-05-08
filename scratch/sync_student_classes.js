const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function sync() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
    const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
    const supabase = createClient(url, key);

    console.log("Fetching classes...");
    const { data: classes } = await supabase.from('classes').select('*');
    const classMap = {};
    classes.forEach(c => {
        classMap[c.name.toLowerCase()] = c.id;
    });

    console.log("Fetching students...");
    const { data: students } = await supabase.from('students').select('id, full_name, class, class_id');

    let updatedCount = 0;
    for (const student of students) {
        if (!student.class) continue;
        
        const targetClassId = classMap[student.class.toLowerCase()];
        if (targetClassId && student.class_id !== targetClassId) {
            console.log(`Syncing ${student.full_name}: ${student.class} -> ${targetClassId}`);
            const { error } = await supabase
                .from('students')
                .update({ class_id: targetClassId })
                .eq('id', student.id);
            
            if (error) {
                console.error(`Error syncing ${student.full_name}:`, error);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`Successfully synced ${updatedCount} students.`);
}

sync();
