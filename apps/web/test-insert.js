const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
const url = lines.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1];
const key = lines.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1];

const supabase = createClient(url, key);

async function test() {
  console.log('Testing Insert...');
  const { data: dbData, error: dbError } = await supabase
      .from('applications')
      .insert({
        last_name: 'Test',
        first_name: 'User',
        email: 'test@example.com',
        arrival_date: '2026-06-07',
        status: 'raw',
      })
      .select('id, app_id')
      .single();
      
  console.log('Error:', dbError);
  console.log('Data:', dbData);
  
  if (dbData) {
      await supabase.from('applications').delete().eq('id', dbData.id);
  }
}

test();
