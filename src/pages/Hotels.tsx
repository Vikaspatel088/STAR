import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hotel, MapPin, Star, Filter, Search, Map as MapIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/components/layout/Layout';
import HotelMap, { type HotelData } from '@/components/map/HotelMap';
import HotelPopup from '@/components/hotels/HotelPopup';
import { calculateDistance, getUserLocation } from '@/lib/distance';
import { normalizeHotel, normalizeHotelImages, getHotelPrice } from '@/lib/hotelUtils';
import { staticHotels } from '@/data/staticTravelData';

interface HotelDataExtended extends HotelData {
  image_urls?: string[] | null;
  price_per_night?: number | null;
}

export default function Hotels() {
  const [hotels, setHotels] = useState<HotelDataExtended[]>(staticHotels);
  const [filteredHotels, setFilteredHotels] = useState<HotelDataExtended[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [cities] = useState<string[]>([...new Set(staticHotels.map((hotel) => hotel.city))]);
  const [selectedHotel, setSelectedHotel] = useState<HotelDataExtended | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    getUserLocation().then(setUserLocation);
  }, []);

  useEffect(() => {
    filterHotels();
  }, [hotels, searchTerm, selectedCity]);

  const handleHotelClick = (hotel: HotelData) => {
    setSelectedHotel(hotel as HotelDataExtended);
  };

  const getHotelDistance = (hotel: HotelDataExtended): number | null => {
    if (!userLocation || !hotel.latitude || !hotel.longitude) {
      return null;
    }
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      hotel.latitude,
      hotel.longitude
    );
  };

  const filterHotels = () => {
    if (!hotels || hotels.length === 0) {
      setFilteredHotels([]);
      return;
    }

    let filtered = hotels;

    if (searchTerm) {
      filtered = filtered.filter(h => 
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCity && selectedCity !== 'all') {
      filtered = filtered.filter(h => h.city === selectedCity);
    }

    setFilteredHotels(filtered);
  };

  const getPriceColor = (range: string | null) => {
    if (!range) return 'bg-muted';
    const count = (range.match(/₹/g) || []).length;
    if (count >= 4) return 'bg-secondary text-secondary-foreground';
    if (count >= 3) return 'bg-primary text-primary-foreground';
    return 'bg-muted';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                <Hotel className="w-8 h-8 text-primary" />
                Hotels in Rajasthan
              </h1>
              <p className="text-muted-foreground mt-1">
                Find luxury accommodations near heritage sites
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2"
              >
                <Hotel className="w-4 h-4" />
                List
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                onClick={() => setViewMode('map')}
                className="flex items-center gap-2"
              >
                <MapIcon className="w-4 h-4" />
                Map
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card border rounded-xl p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search hotels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredHotels.length} hotels
          </p>

          {/* View Content */}
          {viewMode === 'list' ? (
            <>
          {/* Hotels Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="bg-card border rounded-xl p-12 text-center">
              <Hotel className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Hotels Found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map((hotel, index) => (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
                  onClick={() => setSelectedHotel(hotel)}
                >
                  {/* Hotel Image */}
                  {(() => {
                    const images = normalizeHotelImages(hotel);
                    return images.length > 0 && images[0] ? (
                    <div className="h-40 relative overflow-hidden">
                      <img
                        src={images[0]}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden h-40 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center absolute inset-0">
                        <Hotel className="w-16 h-16 text-primary/40" />
                      </div>
                    </div>
                    ) : (
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Hotel className="w-16 h-16 text-primary/40" />
                  </div>
                    );
                  })()}

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {hotel.name}
                      </h3>
                      {(() => {
                        const priceInfo = getHotelPrice(hotel);
                        if (!priceInfo.hasPrice) return null;
                        return (
                          <Badge className={hotel.price_range ? getPriceColor(hotel.price_range) : 'bg-primary text-primary-foreground'}>
                            {priceInfo.price}
                          </Badge>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{hotel.city}</span>
                      {hotel.address && (
                        <span className="text-sm truncate">• {hotel.address}</span>
                      )}
                    </div>

                    {hotel.rating && (
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="w-4 h-4 fill-secondary text-secondary" />
                        <span className="font-semibold">{hotel.rating}</span>
                        <span className="text-sm text-muted-foreground">/ 5</span>
                      </div>
                    )}

                    {hotel.amenities && hotel.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {hotel.amenities.slice(0, 4).map((amenity) => (
                          <Badge key={amenity} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {hotel.amenities.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{hotel.amenities.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
            </>
          ) : (
            <div className="bg-card border rounded-xl overflow-hidden">
              <HotelMap
                onHotelClick={handleHotelClick}
                selectedHotelId={selectedHotel?.id}
                height="600px"
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Hotel Popup */}
      {selectedHotel && (
        <HotelPopup
          hotel={selectedHotel}
          onClose={() => setSelectedHotel(null)}
          distance={getHotelDistance(selectedHotel)}
          userLocation={userLocation}
        />
      )}
    </Layout>
  );
}
