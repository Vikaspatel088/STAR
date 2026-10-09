-- Extend hotels table to support multiple images and price per night
-- Add image_urls array column (for multiple images)
ALTER TABLE public.hotels 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add price_per_night column
ALTER TABLE public.hotels 
ADD COLUMN IF NOT EXISTS price_per_night DECIMAL(10, 2);

-- Migrate existing image_url to image_urls array if it exists
UPDATE public.hotels 
SET image_urls = ARRAY[image_url]::TEXT[]
WHERE image_url IS NOT NULL 
  AND image_url != ''
  AND (image_urls IS NULL OR array_length(image_urls, 1) IS NULL);

-- Create index on city for faster filtering
CREATE INDEX IF NOT EXISTS idx_hotels_city ON public.hotels(city);

-- Create index on rating for sorting
CREATE INDEX IF NOT EXISTS idx_hotels_rating ON public.hotels(rating);
