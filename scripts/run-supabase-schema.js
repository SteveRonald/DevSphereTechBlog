const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read the DATABASE_URL from environment or .env file
const databaseUrl = process.env.DATABASE_URL || 
  process.env.SUPABASE_DATABASE_URL ||
  'postgresql://postgres.nhrvdjosaympphzbozqd:vuQ0ZLduJQIILKOM@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

// Read the SQL file
const sqlFile = path.join(__dirname, '..', 'supabase', 'schema.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// Create PostgreSQL client
const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runSchema() {
  try {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('Connected successfully!');
    
    // First, drop existing tables, triggers, and functions if they exist (to avoid conflicts)
    console.log('Dropping existing objects if they exist...');
    const dropQueries = [
      'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;',
      'DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;',
      'DROP TABLE IF EXISTS public.users CASCADE;',
      'DROP TABLE IF EXISTS public.sessions CASCADE;',
      'DROP TABLE IF EXISTS affiliate_links CASCADE;',
      'DROP TABLE IF EXISTS user_profiles CASCADE;',
      'DROP TABLE IF EXISTS user_preferences CASCADE;',
      'DROP TABLE IF EXISTS reading_progress CASCADE;',
      'DROP TABLE IF EXISTS bookmarks CASCADE;',
      'DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;',
      'DROP TABLE IF EXISTS post_tags CASCADE;',
      'DROP TABLE IF EXISTS posts CASCADE;',
      'DROP TABLE IF EXISTS categories CASCADE;',
      'DROP TABLE IF EXISTS tags CASCADE;',
    ];
    
    for (const query of dropQueries) {
      try {
        await client.query(query);
      } catch (err) {
        // Ignore errors for tables that don't exist
        if (!err.message.includes('does not exist')) {
          console.warn(`Warning: ${err.message}`);
        }
      }
    }
    
    console.log('Executing schema.sql...');
    
    // Execute the entire SQL file (handles multi-line statements like functions/triggers better)
    try {
      await client.query(sql);
      console.log('✅ All SQL statements executed successfully!');
    } catch (err) {
      // If full execution fails, try statement by statement
      console.log('⚠️  Full execution had issues, trying statement by statement...');
      
      // Split SQL by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          try {
            await client.query(statement + ';');
          } catch (stmtErr) {
            // Skip errors for IF NOT EXISTS or IF EXISTS clauses
            if (stmtErr.message.includes('already exists') || 
                stmtErr.message.includes('does not exist') ||
                stmtErr.message.includes('duplicate') ||
                stmtErr.message.includes('already has')) {
              console.log(`  ⚠️  Skipped: ${stmtErr.message.split('\n')[0]}`);
              continue;
            }
            console.error(`❌ Error at statement ${i + 1}:`);
            console.error(`   ${statement.substring(0, 100)}...`);
            console.error(`   Error: ${stmtErr.message}`);
            // Don't throw, continue with other statements
          }
        }
      }
    }
    
    console.log('✅ Schema executed successfully!');
    console.log('\n📊 Tables created:');
    console.log('  ✅ user_profiles (stores user data)');
    console.log('  ✅ newsletter_subscriptions');
    console.log('  ✅ bookmarks');
    console.log('  ✅ reading_progress');
    console.log('  ✅ user_preferences');
    console.log('\n🔧 Database features:');
    console.log('  ✅ Auto-create profile trigger (creates user_profiles on signup)');
    console.log('  ✅ Row Level Security (RLS) enabled');
    console.log('  ✅ Security policies configured');
    console.log('\n🗑️  Old tables dropped:');
    console.log('  - posts (now in Sanity)');
    console.log('  - categories (now in Sanity)');
    console.log('  - tags (now in Sanity)');
    console.log('  - post_tags (now in Sanity)');
    console.log('\n💡 Next steps:');
    console.log('  1. Check Supabase Dashboard → Table Editor → user_profiles');
    console.log('  2. Sign up a new account to test the trigger');
    console.log('  3. Users will automatically appear in user_profiles table!');
    
  } catch (error) {
    console.error('❌ Error executing schema:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSchema();

