-- Add category field to monuments table
ALTER TABLE public.monuments 
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN (
  'fort', 
  'palace', 
  'monument', 
  'temple', 
  'lake', 
  'wildlife_sanctuary', 
  'desert', 
  'museum', 
  'heritage_site', 
  'garden', 
  'stepwell', 
  'haveli', 
  'market', 
  'hill_station'
));

-- Add unique constraint on name to prevent duplicates
-- Note: This will fail if duplicates already exist, so handle them first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'monuments_name_unique'
  ) THEN
    ALTER TABLE public.monuments 
    ADD CONSTRAINT monuments_name_unique UNIQUE (name);
  END IF;
END $$;

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_monuments_category ON public.monuments(category);

-- Create index on city for faster filtering
CREATE INDEX IF NOT EXISTS idx_monuments_city ON public.monuments(city);
