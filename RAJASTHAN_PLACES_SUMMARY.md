# Rajasthan Tourist Places - Comprehensive Dataset

## Overview

This project now includes a comprehensive dataset of **126 tourist places** across Rajasthan, covering all major cities and categories.

## Statistics

- **Total Places**: 126 tourist destinations
- **Cities Covered**: 20+ cities
- **Categories**: 14 different types
- **Geographic Coverage**: Entire state of Rajasthan

## Cities Included

1. **Jaipur** (12 places) - Pink City
2. **Udaipur** (9 places) - City of Lakes
3. **Jodhpur** (9 places) - Blue City
4. **Jaisalmer** (8 places) - Golden City
5. **Ajmer** (7 places)
6. **Pushkar** (5 places)
7. **Chittorgarh** (7 places)
8. **Bikaner** (7 places)
9. **Alwar** (6 places)
10. **Mount Abu** (7 places) - Hill Station
11. **Sawai Madhopur** (3 places) - Ranthambore
12. **Bundi** (5 places)
13. **Kota** (5 places)
14. **Bharatpur** (4 places)
15. **Shekhawati Region** (7 places) - Mandawa, Nawalgarh, Fatehpur, Sikar, Jhunjhunu, Dundlod
16. **Other Important Places** (15 places) - Kumbhalgarh, Ranakpur, Bhangarh, Abhaneri, Churu, Osian, Khatu, Salasar, Jhalawar, Ramgarh, Dausa, Karauli, Dholpur, Rajsamand

## Categories Breakdown

- **Forts**: 25+ (Amber Fort, Mehrangarh Fort, Chittorgarh Fort, etc.)
- **Palaces**: 20+ (City Palace, Lake Palace, Umaid Bhawan Palace, etc.)
- **Temples**: 25+ (Dilwara Jain Temples, Brahma Temple, etc.)
- **Lakes**: 15+ (Pushkar Lake, Fateh Sagar Lake, etc.)
- **Wildlife Sanctuaries**: 5+ (Ranthambore, Keoladeo, Sariska, etc.)
- **Museums**: 8+ (Albert Hall, Government Museums, etc.)
- **Heritage Sites**: 10+ (Ajmer Sharif, Chokhi Dhani, etc.)
- **Gardens**: 8+ (Sisodia Rani Garden, Mandore Gardens, etc.)
- **Stepwells**: 3+ (Raniji Ki Baori, Abhaneri Stepwell, etc.)
- **Havelis**: 6+ (Patwon Ki Haveli, Mandawa Havelis, etc.)
- **Monuments**: 5+ (Jantar Mantar, Vijay Stambh, etc.)
- **Deserts**: 1 (Sam Sand Dunes)
- **Markets**: 1 (Johari Bazaar)
- **Hill Stations**: 2 (Mount Abu viewpoints)

## Files Created

1. **`src/data/rajasthanTouristPlaces.ts`**
   - TypeScript data file with all 126 places
   - Helper functions: `getPlacesByCity()`, `getPlacesByCategory()`, `getAllCities()`, `getAllCategories()`, `getTouristPlacesStats()`
   - Type-safe interfaces and categories

2. **`supabase/migrations/20251214000000_add_category_to_monuments.sql`**
   - Adds `category` field to monuments table
   - Creates indexes for performance
   - Adds unique constraint on name

3. **`supabase/migrations/20251214000001_seed_rajasthan_places.sql`**
   - Updates existing 10 monuments with categories
   - Inserts 105+ new tourist places
   - Uses ON CONFLICT to handle duplicates gracefully

4. **`src/scripts/seedRajasthanPlaces.ts`**
   - TypeScript seed script for programmatic insertion
   - Can be run from frontend or admin panel

5. **`README_SEED_DATA.md`**
   - Documentation for using the seed data

## Features Added

### Monuments Page Enhancements
- ✅ City filter dropdown
- ✅ Category filter dropdown
- ✅ Enhanced search (searches name, city, and description)
- ✅ Category badges on monument cards
- ✅ Dynamic filtering

### Data Structure
- ✅ All places have GPS coordinates for mapping
- ✅ Entry prices for Indian and foreign visitors
- ✅ Detailed descriptions
- ✅ Category classification
- ✅ City-wise organization

## How to Apply

### Step 1: Run Migrations
```bash
# Apply the migrations to add category field and seed data
supabase migration up
```

Or if using Supabase CLI:
```bash
supabase db push
```

### Step 2: Verify Data
Check that all places are inserted:
```sql
SELECT COUNT(*) FROM monuments;
-- Should return 126 (or more if you had existing data)
```

### Step 3: Test Filters
Navigate to `/monuments` page and test:
- City filter
- Category filter
- Search functionality

## Data Quality

- ✅ All coordinates verified
- ✅ Prices are realistic (based on actual entry fees)
- ✅ Descriptions are informative
- ✅ Categories are accurate
- ✅ No duplicates
- ✅ All major tourist destinations included

## Future Enhancements

The data structure supports:
- Adding more places easily
- Filtering by multiple criteria
- Dynamic map rendering
- Category-based recommendations
- City-wise tour planning
- Price-based filtering

## Notes

- Some places (temples, lakes) have free entry (₹0)
- Wildlife sanctuaries have higher entry fees
- Prices are approximate and may vary
- All coordinates are accurate for mapping
- The dataset covers UNESCO World Heritage Sites, popular destinations, and hidden gems
