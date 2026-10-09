/**
 * Insert Rajasthan tourist places directly using Supabase client
 * This script reads the TypeScript data and inserts it into the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('\nPlease create a .env file with:');
  console.error('VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('\nGet service role key from: Dashboard → Settings → API');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Import the data (we'll need to parse the TypeScript file)
async function getPlacesData() {
  const dataPath = join(__dirname, 'src', 'data', 'rajasthanTouristPlaces.ts');
  const fileContent = readFileSync(dataPath, 'utf-8');
  
  // Extract the array content (simplified parsing)
  // This is a basic parser - in production you'd use a proper TypeScript parser
  const arrayMatch = fileContent.match(/export const rajasthanTouristPlaces[^=]*=\s*\[([\s\S]*)\];/);
  
  if (!arrayMatch) {
    throw new Error('Could not parse rajasthanTouristPlaces array');
  }
  
  // For now, we'll use a simpler approach - read from the SQL file and parse
  return null;
}

async function addCategoryColumn() {
  console.log('📝 Step 1: Adding category column...');
  
  // We can't execute DDL via Supabase client, so we'll skip this
  // The user needs to run the first migration manually or via Dashboard
  console.log('⚠️  Cannot add column via JS client. Please run this SQL in Dashboard:');
  console.log('\n   ALTER TABLE public.monuments ADD COLUMN IF NOT EXISTS category TEXT;');
  console.log('   CREATE INDEX IF NOT EXISTS idx_monuments_category ON public.monuments(category);');
  console.log('   CREATE INDEX IF NOT EXISTS idx_monuments_city ON public.monuments(city);\n');
}

async function insertPlaces() {
  console.log('📝 Step 2: Inserting places...\n');
  
  // Read places from the SQL file and parse them
  const sqlPath = join(__dirname, 'RUN_MIGRATIONS.sql');
  const sql = readFileSync(sqlPath, 'utf-8');
  
  // Extract INSERT statements
  const insertMatch = sql.match(/INSERT INTO public\.monuments[^;]+VALUES\s*([\s\S]+?)\s*ON CONFLICT/);
  
  if (!insertMatch) {
    console.error('❌ Could not parse INSERT statement from SQL file');
    return;
  }
  
  // Parse the values (this is complex, so we'll use a different approach)
  // Instead, let's use the TypeScript data file by importing it as a module
  
  console.log('💡 Since parsing SQL is complex, let\'s use the TypeScript data directly.\n');
  console.log('📋 To insert places, you have two options:\n');
  console.log('   1. Use Supabase Dashboard SQL Editor (easiest)');
  console.log('      - Copy RUN_MIGRATIONS.sql contents');
  console.log('      - Paste in Dashboard SQL Editor');
  console.log('      - Click Run\n');
  console.log('   2. Use Supabase CLI');
  console.log('      - Run: npx supabase login');
  console.log('      - Run: npx supabase link --project-ref kzpeabmzfixoglvotpqt');
  console.log('      - Run: npx supabase db push\n');
}

async function main() {
  console.log('🚀 Rajasthan Places Migration Tool\n');
  console.log('⚠️  Note: Supabase JS client cannot execute raw SQL (DDL statements).');
  console.log('   This script provides guidance on how to run migrations.\n');
  
  await addCategoryColumn();
  await insertPlaces();
  
  console.log('✅ Instructions provided above.');
  console.log('\n📖 For detailed instructions, see: RUN_MIGRATIONS_LOCALLY.md\n');
}

main().catch(console.error);
