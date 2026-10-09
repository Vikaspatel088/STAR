# How to Run Migrations - Two Options

You're getting an error because the Supabase CLI is not installed. Here are two ways to run the migrations:

## Option 1: Run SQL Directly in Supabase Dashboard (EASIEST) ⭐

1. **Open your Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run the SQL**
   - Open the file: `RUN_MIGRATIONS.sql` (in the project root)
   - Copy ALL the contents
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify Success**
   - You should see a success message
   - The query at the end will show statistics:
     - Total monuments: ~126
     - Total cities: ~20+
     - Total categories: 14

**That's it!** Your database is now updated with all Rajasthan tourist places.

---

## Option 2: Install Supabase CLI (For Future Use)

If you want to use the CLI for future migrations:

### Windows (PowerShell)

```powershell
# Install via Scoop (recommended)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# OR install via npm
npm install -g supabase
```

### Verify Installation

```powershell
supabase --version
```

### Link Your Project

```powershell
cd "C:\Users\amanr\OneDrive\Desktop\STAR"
supabase link --project-ref YOUR_PROJECT_REF
```

### Run Migrations

```powershell
supabase db push
```

---

## Quick Check After Migration

After running the migration, verify it worked:

```sql
-- Run this in Supabase SQL Editor
SELECT 
  COUNT(*) as total_monuments,
  COUNT(DISTINCT city) as total_cities,
  COUNT(DISTINCT category) as total_categories
FROM public.monuments;

-- Should return:
-- total_monuments: ~126
-- total_cities: ~20+
-- total_categories: 14
```

---

## Troubleshooting

### If you get "constraint already exists" error:
- The migration is idempotent (safe to run multiple times)
- Some parts may have already run - that's okay!

### If you get "duplicate key" error:
- Some monuments may already exist
- The `ON CONFLICT` clause handles this automatically
- The migration will update existing records

### If you need to start fresh:
```sql
-- WARNING: This deletes all monuments!
DELETE FROM public.monuments;
-- Then run RUN_MIGRATIONS.sql again
```

---

## Recommended: Use Option 1 (Dashboard)

For this one-time migration, **Option 1 (Dashboard)** is the easiest and fastest. You don't need to install anything!
