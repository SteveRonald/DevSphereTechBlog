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

async function addUnsubscribeFields() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase');

    // Add unsubscribe_reason column if it doesn't exist
    await client.query(`
      ALTER TABLE newsletter_subscriptions 
      ADD COLUMN IF NOT EXISTS unsubscribe_reason TEXT;
    `);
    console.log('✅ Added unsubscribe_reason column');

    // Add unsubscribed_at column if it doesn't exist
    await client.query(`
      ALTER TABLE newsletter_subscriptions 
      ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP WITH TIME ZONE;
    `);
    console.log('✅ Added unsubscribed_at column');

    console.log('\n✅ Unsubscribe fields added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addUnsubscribeFields();

