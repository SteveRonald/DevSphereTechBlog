/**
 * Create Course Ratings Table Script
 * 
 * This script creates the course_ratings table in Supabase.
 * 
 * Usage:
 * 1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 * 2. Run: npx tsx scripts/create-course-ratings-table.ts
 * 
 * Or manually run the SQL in database/migrations/create_course_ratings.sql
 */

import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";
import { readFileSync } from "fs";

// Try to load dotenv if available
try {
  const { config } = require("dotenv");
  config({ path: resolve(process.cwd(), ".env.local") });
  config({ path: resolve(process.cwd(), ".env") });
} catch {
  // dotenv not available, use process.env directly
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTable() {
  console.log("=".repeat(60));
  console.log("📊 CREATING COURSE RATINGS TABLE");
  console.log("=".repeat(60));

  try {
    // Read SQL from migration file
    const sqlPath = resolve(process.cwd(), "database/migrations/create_course_ratings.sql");
    let sql: string;

    try {
      sql = readFileSync(sqlPath, "utf-8");
      console.log(`\n✅ Loaded SQL from: ${sqlPath}`);
    } catch (error) {
      console.log("\n⚠️  Could not read SQL file, using inline SQL...");
      // Fallback SQL
      sql = `
-- Create course_ratings table
CREATE TABLE IF NOT EXISTS course_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_ratings_course_id ON course_ratings(course_id);
CREATE INDEX IF NOT EXISTS idx_course_ratings_user_id ON course_ratings(user_id);

-- Enable RLS
ALTER TABLE course_ratings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "Users can view all ratings"
  ON course_ratings FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert their own ratings"
  ON course_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own ratings"
  ON course_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own ratings"
  ON course_ratings FOR DELETE
  USING (auth.uid() = user_id);
      `.trim();
    }

    // Check if table already exists
    console.log("\n🔍 Checking if table exists...");
    const { data: existingTable, error: checkError } = await supabase
      .from("course_ratings")
      .select("id")
      .limit(1);

    if (existingTable !== null && !checkError) {
      console.log("✅ Table 'course_ratings' already exists!");
      console.log("\n💡 If you need to recreate it, drop it first:");
      console.log("   DROP TABLE IF EXISTS course_ratings CASCADE;");
      return;
    }

    // Try to execute SQL using Supabase REST API (if service role key is available)
    console.log("\n🚀 Attempting to create table via Supabase REST API...");
    
    try {
      // Use Supabase REST API to execute SQL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_SERVICE_ROLE_KEY || "",
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY || ""}`,
        },
        body: JSON.stringify({ sql }),
      });

      if (response.ok) {
        console.log("✅ Table created successfully via REST API!");
        return;
      } else {
        const errorData = await response.json();
        console.log("⚠️  REST API method not available, using manual method...");
        console.log(`   Error: ${errorData.message || "Unknown error"}`);
      }
    } catch (error: any) {
      console.log("⚠️  REST API method not available, using manual method...");
      console.log(`   Error: ${error.message}`);
    }

    // Fallback: Manual instructions
    console.log("\n📝 Please run the SQL manually:");
    console.log("\n" + "=".repeat(60));
    console.log("OPTION 1: Supabase Dashboard (RECOMMENDED)");
    console.log("=".repeat(60));
    console.log(`
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to SQL Editor (left sidebar)
4. Click "New Query"
5. Copy and paste the SQL below
6. Click "Run" (or press Ctrl+Enter)
    `);

    console.log("\n" + "=".repeat(60));
    console.log("OPTION 2: psql Command Line");
    console.log("=".repeat(60));
    console.log(`
# Get your connection string from Supabase Dashboard → Settings → Database
# Then run:
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres" \\
     -f database/migrations/create_course_ratings.sql
    `);

    console.log("\n" + "=".repeat(60));
    console.log("SQL TO EXECUTE:");
    console.log("=".repeat(60));
    console.log("\n" + sql);
    console.log("\n" + "=".repeat(60));

    // Try to verify table structure via RPC (if available)
    console.log("\n🔍 Attempting to verify table structure...");
    const { error: verifyError } = await supabase.rpc("exec_sql", {
      sql: "SELECT 1 FROM course_ratings LIMIT 1",
    });

    if (!verifyError) {
      console.log("✅ Table exists and is accessible!");
    } else {
      console.log("⚠️  Could not verify table (this is expected if using JS client)");
      console.log("   Please run the SQL manually in Supabase Dashboard");
    }
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.log("\n💡 Please run the SQL manually in Supabase Dashboard");
    process.exit(1);
  }
}

createTable();

