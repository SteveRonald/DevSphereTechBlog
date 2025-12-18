const { Client } = require('pg');
const fs = require('fs');

const DATABASE_URL = process.env.DATABASE_URL || 
  process.env.SUPABASE_DATABASE_URL ||
  (() => {
    try {
      const envFile = fs.readFileSync('.env', 'utf8');
      const match = envFile.match(/DATABASE_URL=(.+)/);
      return match ? match[1].trim() : null;
    } catch {
      return null;
    }
  })();

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

async function addDeviceTrackingFields() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase');

    // Add device tracking columns
    await client.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS last_device TEXT;
    `);
    console.log('✅ Added last_device column');

    await client.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS last_ip TEXT;
    `);
    console.log('✅ Added last_ip column');

    await client.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS last_signin_at TIMESTAMP WITH TIME ZONE;
    `);
    console.log('✅ Added last_signin_at column');

    console.log('\n✅ Device tracking fields added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addDeviceTrackingFields();




