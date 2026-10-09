# Rajasthan Tourist Places - Seed Data

This project includes a comprehensive dataset of tourist places across Rajasthan, organized by city and category.

## Data Structure

The tourist places data is stored in:
- **TypeScript Data File**: `src/data/rajasthanTouristPlaces.ts` - Reusable constants for frontend
- **SQL Migration**: `supabase/migrations/20251214000001_seed_rajasthan_places.sql` - Database seed script

## Categories Covered

The dataset includes places from all major categories:
- **Forts** (Amber Fort, Mehrangarh Fort, Chittorgarh Fort, etc.)
- **Palaces** (City Palace, Lake Palace, Umaid Bhawan Palace, etc.)
- **Monuments** (Jantar Mantar, Vijay Stambh, etc.)
- **Temples** (Dilwara Jain Temples, Brahma Temple, etc.)
- **Lakes** (Pushkar Lake, Fateh Sagar Lake, etc.)
- **Wildlife Sanctuaries** (Ranthambore, Keoladeo, Sariska, etc.)
- **Deserts** (Sam Sand Dunes)
- **Museums** (Albert Hall, Government Museums, etc.)
- **Heritage Sites** (Ajmer Sharif, Chokhi Dhani, etc.)
- **Gardens** (Sisodia Rani Garden, Mandore Gardens, etc.)
- **Stepwells** (Raniji Ki Baori, Abhaneri Stepwell, etc.)
- **Havelis** (Patwon Ki Haveli, Mandawa Havelis, etc.)
- **Markets** (Johari Bazaar)
- **Hill Stations** (Mount Abu)

## Cities Covered

The dataset includes places from major cities:
- Jaipur (Pink City)
- Udaipur (City of Lakes)
- Jodhpur (Blue City)
- Jaisalmer (Golden City)
- Ajmer
- Pushkar
- Chittorgarh
- Bikaner
- Alwar
- Mount Abu
- Sawai Madhopur (Ranthambore)
- Bundi
- Kota
- Bharatpur
- Shekhawati Region (Mandawa, Nawalgarh, Fatehpur, Sikar, Jhunjhunu)
- Other important places (Kumbhalgarh, Ranakpur, Bhangarh, etc.)

## How to Use

### Option 1: Run SQL Migration (Recommended)

1. Apply the migration to add category field:
   ```bash
   supabase migration up
   ```

2. The seed migration will automatically insert all places when you run migrations.

### Option 2: Use TypeScript Seed Script

1. Import and run the seed function:
   ```typescript
   import { seedRajasthanPlaces } from '@/scripts/seedRajasthanPlaces';
   
   // In your component or script
   await seedRajasthanPlaces();
   ```

### Option 3: Use Data in Frontend

Import the data constants directly:
```typescript
import { 
  rajasthanTouristPlaces, 
  getPlacesByCity, 
  getPlacesByCategory,
  getAllCities,
  getAllCategories 
} from '@/data/rajasthanTouristPlaces';

// Get all places in Jaipur
const jaipurPlaces = getPlacesByCity('Jaipur');

// Get all forts
const forts = getPlacesByCategory('fort');

// Get all cities
const cities = getAllCities();
```

## Statistics

- **Total Places**: 100+ tourist places
- **Cities**: 20+ cities covered
- **Categories**: 14 different categories
- **Coverage**: All major tourist destinations in Rajasthan

## Data Fields

Each place includes:
- `name`: Name of the tourist place
- `description`: Detailed description
- `city`: City where it's located
- `state`: State (Rajasthan)
- `category`: Type of place (fort, palace, temple, etc.)
- `latitude`: GPS latitude
- `longitude`: GPS longitude
- `indian_price`: Entry fee for Indian visitors (₹)
- `foreign_price`: Entry fee for foreign visitors (₹)

## Notes

- Prices are approximate and may vary
- Some places (temples, lakes) have free entry (₹0)
- Coordinates are accurate for mapping purposes
- The data is designed to be dynamically rendered on maps and lists
- All data is stored in a structured format suitable for Supabase
