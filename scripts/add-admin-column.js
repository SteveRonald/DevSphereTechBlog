const { Client } = require('pg');
const fs = require('fs');

// Read DATABASE_URL from environment or use the one from .env if available
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

async function addAdminColumn() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase');

    // Add is_admin column if it doesn't exist
    await client.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    `);
    console.log('✅ Added is_admin column to user_profiles');

    // Create index for faster admin lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin 
      ON user_profiles(is_admin) 
      WHERE is_admin = TRUE;
    `);
    console.log('✅ Created index on is_admin');

    console.log('\n✅ Admin column added successfully!');
    console.log('\n📝 To make a user admin, run this SQL in Supabase SQL Editor:');
    console.log('   UPDATE user_profiles SET is_admin = TRUE WHERE email = \'your-email@example.com\';');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addAdminColumn();

