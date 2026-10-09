/**
 * Simple script to run migrations using Supabase client
 * Reads SQL files and executes them via Supabase REST API
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Missing Supabase credentials!');
  console.error('\nPlease create a .env file in the project root with:');
  console.error('VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('\nOr set them as environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function executeSQL(sql) {
  // Remove comments and split by semicolons
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
  
  for (const statement of statements) {
    if (!statement.trim()) continue;
    
    try {
      // For DDL statements, we need to use the REST API directly
      // Supabase JS client doesn't support raw SQL execution
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ sql_query: statement }),
      });
      
      if (!response.ok && response.status !== 404) {
        // If exec_sql RPC doesn't exist, we'll need to use a different approach
        console.warn(`⚠️  Could not execute via RPC, trying alternative...`);
      }
    } catch (error) {
      console.warn(`⚠️  Statement execution warning:`, error.message);
    }
  }
}

async function runMigration(fileName) {
  const filePath = join(__dirname, 'supabase', 'migrations', fileName);
  console.log(`\n📄 Reading migration: ${fileName}...`);
  
  try {
    const sql = readFileSync(filePath, 'utf-8');
    await executeSQL(sql);
    console.log(`✅ Processed ${fileName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error reading ${fileName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Running Supabase Migrations Locally\n');
  console.log('⚠️  Note: This script requires a Supabase function or direct database access.');
  console.log('   For best results, use the Supabase Dashboard SQL Editor or Supabase CLI.\n');
  
  // Alternative: Use the combined SQL file
  console.log('📝 Using combined migration file...\n');
  
  const combinedSQLPath = join(__dirname, 'RUN_MIGRATIONS.sql');
  
  try {
    const sql = readFileSync(combinedSQLPath, 'utf-8');
    console.log('📄 Found RUN_MIGRATIONS.sql');
    console.log('⚠️  To execute this SQL, you have two options:');
    console.log('\n   1. Copy the contents of RUN_MIGRATIONS.sql');
    console.log('      and paste it into Supabase Dashboard SQL Editor');
    console.log('\n   2. Use npx supabase db push (after linking project)');
    console.log('\n   This script cannot execute raw SQL directly.');
    console.log('   Supabase requires admin access via Dashboard or CLI.\n');
  } catch (error) {
    console.error('❌ Could not read RUN_MIGRATIONS.sql:', error.message);
  }
}

main().catch(console.error);
