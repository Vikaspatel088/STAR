// Monument image mappings
import AmberFort from '@/assets/monuments/Amber-fort.png';
import CityPalaceJaipur from '@/assets/monuments/City_palace_jaipur.png';
import CityPalaceUdaipur from '@/assets/monuments/City_palace_udaipur.png';
import HawaMahal from '@/assets/monuments/Hawa_mahal.png';
import JaisalmerFort from '@/assets/monuments/Jaislamer_fort.png';
import LakePalace from '@/assets/monuments/Lake_palace.png';
import MehrangarhFort from '@/assets/monuments/Mehrangarh_Fort.png';
import PatwonKiHaveli from '@/assets/monuments/Patwaon_ki_haveli.png';
import RanthamboreFort from '@/assets/monuments/Ranthambore_fort.png';
import UmaidBhawanPalace from '@/assets/monuments/Umaid_bhawan_palace.png';

// Map monument names to their image imports
const monumentImageMap: Record<string, string> = {
  'Amber Fort': AmberFort,
  'City Palace Jaipur': CityPalaceJaipur,
  'City Palace Udaipur': CityPalaceUdaipur,
  'Hawa Mahal': HawaMahal,
  'Jaisalmer Fort': JaisalmerFort,
  'Lake Palace': LakePalace,
  'Mehrangarh Fort': MehrangarhFort,
  'Patwon Ki Haveli': PatwonKiHaveli,
  'Ranthambore Fort': RanthamboreFort,
  'Umaid Bhawan Palace': UmaidBhawanPalace,
};

/**
 * Get the local image path for a monument by name
 * @param monumentName - The name of the monument
 * @returns The image path or null if not found
 */
export function getMonumentImage(monumentName: string): string | null {
  // Try exact match first
  if (monumentImageMap[monumentName]) {
    return monumentImageMap[monumentName];
  }
  
  // Try case-insensitive match
  const lowerName = monumentName.toLowerCase();
  for (const [key, value] of Object.entries(monumentImageMap)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  return null;
}

/**
 * Get the image URL for a monument, preferring local assets over database image_url
 * @param monumentName - The name of the monument
 * @param dbImageUrl - The image_url from database (optional)
 * @returns The image URL to use
 */
export function getMonumentImageUrl(monumentName: string, dbImageUrl: string | null = null): string | null {
  // Prefer local image if available
  const localImage = getMonumentImage(monumentName);
  if (localImage) {
    return localImage;
  }
  // Fallback to database image_url
  return dbImageUrl;
}
