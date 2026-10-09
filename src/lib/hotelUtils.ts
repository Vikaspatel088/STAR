/**
 * Utility functions for hotel data normalization
 * Handles backward compatibility between old and new schema
 */

export interface HotelDataRaw {
  id: string;
  name: string;
  city: string;
  address?: string | null;
  rating?: number | null;
  price_range?: string | null;
  price_per_night?: number | null;
  amenities?: string[] | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Normalize hotel data to ensure image_urls is always an array
 * Handles both old schema (image_url) and new schema (image_urls)
 */
export function normalizeHotelImages(hotel: HotelDataRaw): string[] {
  // If image_urls exists and has items, use it
  if (hotel.image_urls && Array.isArray(hotel.image_urls) && hotel.image_urls.length > 0) {
    return hotel.image_urls.filter(Boolean); // Remove any null/empty values
  }
  
  // Fallback to single image_url if it exists
  if (hotel.image_url) {
    return [hotel.image_url];
  }
  
  // No images available
  return [];
}

/**
 * Get the best available price display for a hotel
 */
export function getHotelPrice(hotel: HotelDataRaw): {
  price: string;
  hasPrice: boolean;
} {
  if (hotel.price_per_night) {
    return {
      price: `₹${hotel.price_per_night.toLocaleString('en-IN')}/night`,
      hasPrice: true,
    };
  }
  
  if (hotel.price_range) {
    return {
      price: hotel.price_range,
      hasPrice: true,
    };
  }
  
  return {
    price: 'Price not available',
    hasPrice: false,
  };
}

/**
 * Normalize a hotel object to ensure all fields are properly formatted
 */
export function normalizeHotel(hotel: HotelDataRaw) {
  return {
    ...hotel,
    image_urls: normalizeHotelImages(hotel),
  };
}
