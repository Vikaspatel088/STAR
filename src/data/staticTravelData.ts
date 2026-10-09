import { rajasthanTouristPlaces, type TouristPlace } from './rajasthanTouristPlaces';

const webImages = {
  fort: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=80',
  palace: 'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=900&q=80',
  lake: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=900&q=80',
  temple: 'https://images.unsplash.com/photo-1532664189809-02133fee698d?auto=format&fit=crop&w=900&q=80',
  heritage: 'https://images.unsplash.com/photo-1532664189809-02133fee698d?auto=format&fit=crop&w=900&q=80',
};

const monumentImages: Record<string, string> = {
  'Amber Fort': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=80',
  'Hawa Mahal': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=80',
  'City Palace Jaipur': 'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=900&q=80',
  'City Palace Udaipur': 'https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=900&q=80',
  'Jaisalmer Fort': 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=900&q=80',
  'Mehrangarh Fort': 'https://images.unsplash.com/photo-1532664189809-02133fee698d?auto=format&fit=crop&w=900&q=80',
};

export interface StaticMonument {
  id: string;
  name: string;
  city: string;
  state: string;
  description: string;
  category: string;
  indian_price: number;
  foreign_price: number;
  image_url: string;
  latitude: number;
  longitude: number;
}

export const staticMonuments: StaticMonument[] = rajasthanTouristPlaces
  .slice(0, 24)
  .map((place: TouristPlace, index) => ({
    id: `static-monument-${index + 1}`,
    ...place,
    image_url: monumentImages[place.name] ?? webImages[place.category as keyof typeof webImages] ?? webImages.heritage,
  }));

export interface StaticHotel {
  id: string;
  name: string;
  city: string;
  address: string;
  rating: number;
  price_range: string;
  price_per_night: number;
  amenities: string[];
  image_urls: string[];
  latitude: number;
  longitude: number;
}

export const staticHotels: StaticHotel[] = [
  ['Rambagh Palace', 'Jaipur', 'Bhawani Singh Road', 4.9, 18500, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80'],
  ['The Leela Palace Udaipur', 'Udaipur', 'Lake Pichola', 4.8, 22000, 'https://images.unsplash.com/photo-1582610116397-edb318620f90?auto=format&fit=crop&w=900&q=80'],
  ['Umaid Bhawan Palace', 'Jodhpur', 'Circuit House Road', 4.9, 19500, 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80'],
  ['Suryagarh Jaisalmer', 'Jaisalmer', 'Kanoi Sam Road', 4.7, 12500, 'https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=900&q=80'],
  ['Ananta Spa & Resorts', 'Pushkar', 'Leela Sevri Road', 4.5, 8500, 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80'],
  ['Alsisar Haveli', 'Jaipur', 'Sansar Chandra Road', 4.4, 5500, 'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=900&q=80'],
].map(([name, city, address, rating, price, image], index) => ({
  id: `static-hotel-${index + 1}`,
  name: name as string,
  city: city as string,
  address: address as string,
  rating: rating as number,
  price_range: '₹₹₹',
  price_per_night: price as number,
  amenities: ['WiFi', 'Parking', 'Restaurant', 'Pool'],
  image_urls: [image as string],
  latitude: 26.9 + index * 0.12,
  longitude: 75.8 + index * 0.15,
}));
