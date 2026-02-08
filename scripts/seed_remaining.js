const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

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

const classesToCreate = [
    { name: 'XI TKJ 1', level: 11, nisPrefix: '111' },
    { name: 'XI TKJ 2', level: 11, nisPrefix: '112' },
    { name: 'XII TKJ 1', level: 12, nisPrefix: '123' },
    { name: 'XII TKJ 2', level: 12, nisPrefix: '124' },
];

async function seed() {
    console.log("Starting seed...");

    for (const cls of classesToCreate) {
        console.log(`Processing class: ${cls.name}`);

        // 1. Check/Create Class
        let { data: existingClass, error: findError } = await supabase
            .from('classes')
            .select('*')
            .eq('name', cls.name)
            .single();

        if (findError && findError.code !== 'PGRST116') {
            console.error(`Error finding class ${cls.name}:`, findError);
            continue;
        }

        let classId;

        if (existingClass) {
            console.log(`  Class ${cls.name} already exists. ID: ${existingClass.id}`);
            classId = existingClass.id;
        } else {
            console.log(`  Creating class ${cls.name}...`);
            const clsWithId = { 
                name: cls.name, 
                level: cls.level, 
                id: randomUUID(), 
                created_at: new Date().toISOString() 
            };
            const { data: newClass, error: createError } = await supabase
                .from('classes')
                .insert([clsWithId])
                .select()
                .single();
            
            if (createError) {
                console.error(`  Error creating class ${cls.name}:`, createError);
                continue;
            }
            classId = newClass.id;
            console.log(`  Created class ${cls.name}. ID: ${classId}`);
        }

        // 2. Link existing students (legacy string match)
        const { error: linkError } = await supabase
            .from('students')
            .update({ class_id: classId })
            .eq('class', cls.name)
            .is('class_id', null);
            
        if (linkError) {
            console.error(`  Error linking students for ${cls.name}:`, linkError);
        } else {
             // console.log(`  Linked existing students.`); // Optional log
        }

        // 3. Count existing students with this class_id
        const { count, error: countError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classId);

        if (countError) {
            console.error(`  Error counting students for ${cls.name}:`, countError);
            continue;
        }

        const currentCount = count || 0;
        console.log(`  Current student count for ${cls.name}: ${currentCount}`);

        const needed = 6 - currentCount;
        if (needed <= 0) {
            console.log(`  Enough students exist (${currentCount}). Skipping creation.`);
            continue;
        }

        console.log(`  Creating ${needed} students...`);

        const studentsToInsert = [];
        for (let i = 1; i <= needed; i++) {
            const num = currentCount + i;
            const nis = `${cls.nisPrefix}${num.toString().padStart(2, '0')}`;
            
            studentsToInsert.push({
                id: randomUUID(),
                full_name: `Siswa ${cls.name} ${num}`,
                nis: nis,
                role: 'student',
                password: '123456',
                class: cls.name,
                class_id: classId,
                first_login: true,
                created_at: new Date().toISOString()
            });
        }

        const { error: insertError } = await supabase
            .from('students')
            .insert(studentsToInsert);

        if (insertError) {
            console.error(`  Error inserting students for ${cls.name}:`, insertError);
        } else {
            console.log(`  Successfully inserted ${needed} students.`);
        }
    }

    console.log("Seed completed.");
}

seed();
