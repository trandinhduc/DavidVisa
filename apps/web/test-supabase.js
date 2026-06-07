const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
const url = lines.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1];
const key = lines.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1];

const supabase = createClient(url, key);

async function test() {
  console.log('Testing Supabase Connection to:', url);
  
  const { data, error } = await supabase.from('applications').select('id').limit(1);
  if (error) {
    console.error('Table Select Error:', error);
  } else {
    console.log('Table exists. Data:', data);
  }

  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error('Bucket List Error:', bucketError);
  } else {
    console.log('Buckets:', buckets.map(b => b.name));
  }
}

test();
