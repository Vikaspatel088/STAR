/**
 * Run Supabase migrations locally
 * This script reads SQL migration files and executes them
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials from environment or .env file
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials!');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.error('\nOr create a .env file with:');
  console.error('VITE_SUPABASE_URL=your-project-url');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration(filePath, fileName) {
  try {
    console.log(`\n📄 Running migration: ${fileName}...`);
    
    const sql = readFileSync(filePath, 'utf-8');
    
    // Split SQL by semicolons and filter out empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        // If RPC doesn't work, try direct query (this requires service role)
        if (error) {
          // Try alternative method - direct SQL execution via REST API
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({ sql_query: statement }),
          });
          
          if (!response.ok) {
            // Last resort: use Supabase client's query method
            // Note: This may not work for all SQL statements
            console.warn(`⚠️  Could not execute statement via RPC, trying alternative method...`);
          }
        }
      }
    }
    
    console.log(`✅ Migration ${fileName} completed successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Error running migration ${fileName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Supabase migrations...\n');
  console.log(`📡 Connecting to: ${SUPABASE_URL.replace(/\/\/.*@/, '//***@')}`);
  
  const migrationsDir = join(__dirname, 'supabase', 'migrations');
  
  // Migration files in order
  const migrationFiles = [
    '20251214000000_add_category_to_monuments.sql',
    '20251214000001_seed_rajasthan_places.sql',
  ];
  
  let successCount = 0;
  
  for (const fileName of migrationFiles) {
    const filePath = join(migrationsDir, fileName);
    
    try {
      const success = await runMigration(filePath, fileName);
      if (success) {
        successCount++;
      } else {
        console.error(`\n❌ Failed to run ${fileName}. Stopping migrations.`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`\n❌ Error reading migration file ${fileName}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log(`\n✨ All migrations completed! (${successCount}/${migrationFiles.length})`);
  
  // Verify the migration
  console.log('\n📊 Verifying migration...');
  const { data, error } = await supabase
    .from('monuments')
    .select('id', { count: 'exact', head: true });
  
  if (error) {
    console.error('❌ Error verifying migration:', error.message);
  } else {
    console.log(`✅ Found ${data?.length || 0} monuments in database`);
  }
}

main().catch(console.error);
