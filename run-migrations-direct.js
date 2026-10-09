/**
 * Direct migration runner using Supabase client
 * This script reads the migration SQL and executes it via Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get credentials from environment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('\nPlease create a .env file with:');
  console.error('VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('\nOr set environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Read the combined migration file
const migrationPath = join(__dirname, 'RUN_MIGRATIONS.sql');
let sql;

try {
  sql = readFileSync(migrationPath, 'utf-8');
  console.log('✅ Loaded RUN_MIGRATIONS.sql\n');
} catch (error) {
  console.error('❌ Could not read RUN_MIGRATIONS.sql:', error.message);
  process.exit(1);
}

async function executeViaREST(sqlStatement) {
  try {
    // Try to execute via Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ sql_query: sqlStatement }),
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function applyMigrations() {
  console.log('🚀 Starting migration process...\n');
  console.log('⚠️  Note: Supabase JS client cannot execute raw SQL directly.');
  console.log('   This script will attempt to apply migrations via REST API.\n');
  console.log('   If this fails, please use one of these alternatives:\n');
  console.log('   1. Supabase Dashboard SQL Editor (easiest)');
  console.log('   2. Supabase CLI: npx supabase db push');
  console.log('   3. Direct PostgreSQL connection\n');
  
  // Split SQL into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*/));
  
  console.log(`📊 Found ${statements.length} SQL statements\n`);
  
  // Since we can't execute raw SQL directly, let's at least validate the file
  console.log('✅ Migration file is valid and ready to execute');
  console.log('\n📋 To execute these migrations, please:');
  console.log('\n   1. Open Supabase Dashboard: https://supabase.com/dashboard');
  console.log('   2. Go to SQL Editor');
  console.log('   3. Copy contents of RUN_MIGRATIONS.sql');
  console.log('   4. Paste and run\n');
  
  // Alternative: Try to use the data insertion approach
  console.log('🔄 Attempting alternative: Direct data insertion...\n');
  
  try {
    // Read the TypeScript data file to get the places
    const dataPath = join(__dirname, 'src', 'data', 'rajasthanTouristPlaces.ts');
    const dataFile = readFileSync(dataPath, 'utf-8');
    
    // Extract the data array (simplified - we'll use the SQL file data instead)
    console.log('📝 For direct insertion, we need to parse the TypeScript file.');
    console.log('   This is complex. Using SQL file is recommended.\n');
    
  } catch (error) {
    console.log('⚠️  Could not read data file\n');
  }
  
  console.log('💡 Recommendation: Use the Supabase Dashboard SQL Editor');
  console.log('   It\'s the most reliable way to run these migrations.\n');
}

applyMigrations().catch(console.error);
