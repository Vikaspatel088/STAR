/**
 * Run migrations using Supabase CLI via npx
 * This script uses npx to execute supabase commands
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runCommand(command, description) {
  try {
    console.log(`\n🔄 ${description}...`);
    const output = execSync(command, { 
      cwd: __dirname,
      stdio: 'inherit',
      encoding: 'utf-8'
    });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ Error: ${description} failed`);
    console.error(error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Running Supabase Migrations using CLI\n');
  
  // Check if project is linked
  console.log('📋 Checking Supabase project status...\n');
  
  try {
    execSync('npx supabase status', { 
      cwd: __dirname,
      stdio: 'pipe'
    });
    console.log('✅ Supabase project is linked\n');
  } catch (error) {
    console.log('⚠️  Project not linked. You need to link it first.\n');
    console.log('To link your project, run:');
    console.log('  npx supabase link --project-ref YOUR_PROJECT_REF');
    console.log('\nYou can find your project ref in:');
    console.log('  - Supabase Dashboard URL: https://supabase.com/dashboard/project/[PROJECT_REF]');
    console.log('  - Or in supabase/config.toml file\n');
    
    // Try to read project_id from config
    try {
      const fs = await import('fs');
      const configPath = join(__dirname, 'supabase', 'config.toml');
      const config = fs.readFileSync(configPath, 'utf-8');
      const match = config.match(/project_id\s*=\s*"([^"]+)"/);
      if (match) {
        console.log(`📝 Found project_id in config: ${match[1]}`);
        console.log(`\nRun: npx supabase link --project-ref ${match[1]}\n`);
      }
    } catch (e) {
      // Ignore
    }
    
    return;
  }
  
  // Run migrations
  console.log('📦 Pushing migrations to Supabase...\n');
  
  const success = await runCommand(
    'npx supabase db push',
    'Pushing database migrations'
  );
  
  if (success) {
    console.log('\n✨ Migrations completed successfully!');
  } else {
    console.log('\n❌ Migration failed. Please check the errors above.');
    process.exit(1);
  }
}

main().catch(console.error);
