/**
 * Seed script to populate Rajasthan tourist places into Supabase
 * Run this script to insert all tourist places into the monuments table
 */

import { supabase } from '@/integrations/supabase/client';
import { rajasthanTouristPlaces } from '@/data/rajasthanTouristPlaces';

/**
 * Seed all Rajasthan tourist places into the database
 * This will insert all places from rajasthanTouristPlaces.ts
 */
export async function seedRajasthanPlaces() {
  try {
    console.log(`Starting to seed ${rajasthanTouristPlaces.length} tourist places...`);

    // Prepare data for insertion (matching Supabase schema)
    const placesToInsert = rajasthanTouristPlaces.map(place => ({
      name: place.name,
      description: place.description,
      city: place.city,
      state: place.state,
      category: place.category,
      latitude: place.latitude,
      longitude: place.longitude,
      indian_price: place.indian_price,
      foreign_price: place.foreign_price,
      image_url: null, // Will be handled by monumentImages.ts utility
    }));

    // Insert in batches to avoid timeout
    const batchSize = 50;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < placesToInsert.length; i += batchSize) {
      const batch = placesToInsert.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('monuments')
        .upsert(batch, {
          onConflict: 'name',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        errors += batch.length;
      } else {
        inserted += data?.length || 0;
        console.log(`Inserted batch ${i / batchSize + 1}: ${data?.length || 0} places`);
      }
    }

    console.log(`\nSeeding complete!`);
    console.log(`Successfully inserted: ${inserted} places`);
    if (errors > 0) {
      console.log(`Errors: ${errors} places`);
    }

    return { inserted, errors, total: rajasthanTouristPlaces.length };
  } catch (error) {
    console.error('Error seeding places:', error);
    throw error;
  }
}

/**
 * Update existing monuments with category information
 */
export async function updateMonumentCategories() {
  try {
    console.log('Updating monument categories...');

    // Map existing monument names to categories
    const categoryMap: Record<string, string> = {
      'Hawa Mahal': 'palace',
      'Amber Fort': 'fort',
      'City Palace Jaipur': 'palace',
      'Mehrangarh Fort': 'fort',
      'Umaid Bhawan Palace': 'palace',
      'City Palace Udaipur': 'palace',
      'Lake Palace': 'palace',
      'Jaisalmer Fort': 'fort',
      'Patwon Ki Haveli': 'haveli',
      'Ranthambore Fort': 'fort',
    };

    let updated = 0;

    for (const [name, category] of Object.entries(categoryMap)) {
      const { error } = await supabase
        .from('monuments')
        .update({ category })
        .eq('name', name);

      if (error) {
        console.error(`Error updating ${name}:`, error);
      } else {
        updated++;
      }
    }

    console.log(`Updated ${updated} monuments with categories`);
    return updated;
  } catch (error) {
    console.error('Error updating categories:', error);
    throw error;
  }
}
