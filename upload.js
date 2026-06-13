const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://fhlbiplybcvahbijxqrt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobGJpcGx5YmN2YWhiaWp4cXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc4NjEwMiwiZXhwIjoyMDk2MzYyMTAyfQ.HISkwFkYVHBE3dLejE3zu_3UNuI0MyCh7DD-fAHHatE'
);

async function upload() {
  try {
    const fileContent = fs.readFileSync('./apps/extension/build/chrome-mv3-prod.zip');
    const { data, error } = await supabase.storage
      .from('Extension')
      .upload('chrome-mv3-prod.zip', fileContent, {
        contentType: 'application/zip',
        upsert: true
      });
      
    if (error) {
      console.error('Upload failed:', error.message);
      process.exit(1);
    }
    console.log('Upload successful:', data);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
upload();
