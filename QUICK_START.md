# Quick Start - Run Migrations Locally

## The Simplest Way (2 Steps)

### Step 1: Login to Supabase CLI

Open PowerShell and run:

```powershell
cd "C:\Users\amanr\OneDrive\Desktop\STAR"
npx supabase login
```

This will open your browser. Complete the login.

### Step 2: Push Migrations

```powershell
npx supabase link --project-ref kzpeabmzfixoglvotpqt
npx supabase db push
```

**Done!** Your migrations are now applied.

---

## Alternative: Use Dashboard (No CLI needed)

1. Go to: https://supabase.com/dashboard/project/kzpeabmzfixoglvotpqt/sql/new
2. Open `RUN_MIGRATIONS.sql` file
3. Copy all contents
4. Paste in SQL Editor
5. Click "Run"

---

## What Gets Applied?

- ✅ Adds `category` column to monuments table
- ✅ Creates indexes for better performance
- ✅ Updates existing 10 monuments with categories
- ✅ Inserts 105+ new tourist places
- ✅ Total: ~126 monuments across Rajasthan

---

## Verify Success

After migration, run this in SQL Editor:

```sql
SELECT 
  COUNT(*) as total,
  COUNT(DISTINCT city) as cities,
  COUNT(DISTINCT category) as categories
FROM monuments;
```

Expected: ~126 monuments, ~20 cities, 14 categories
