import { X, Star, MapPin, IndianRupee, Wifi, Car, UtensilsCrossed, Dumbbell, Waves, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import HotelImageCarousel from './HotelImageCarousel';
import type { HotelData } from '../map/HotelMap';
import { getHotelPrice } from '@/lib/hotelUtils';

interface HotelPopupProps {
  hotel: HotelData | null;
  onClose: () => void;
  distance?: number | null; // Distance in kilometers
  userLocation?: { lat: number; lng: number } | null;
}

const amenityIcons: Record<string, React.ReactNode> = {
  'WiFi': <Wifi className="w-4 h-4" />,
  'Parking': <Car className="w-4 h-4" />,
  'Restaurant': <UtensilsCrossed className="w-4 h-4" />,
  'Gym': <Dumbbell className="w-4 h-4" />,
  'Pool': <Waves className="w-4 h-4" />,
  'Spa': <Sparkles className="w-4 h-4" />,
};

export default function HotelPopup({ hotel, onClose, distance, userLocation }: HotelPopupProps) {
  if (!hotel) return null;

  const formatPrice = () => {
    const priceInfo = getHotelPrice(hotel);
    return priceInfo.price;
  };

  const formatDistance = () => {
    if (distance === null || distance === undefined) return null;
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)} km away`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="bg-background rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b bg-card">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold truncate">{hotel.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">
                  {hotel.address ? `${hotel.address}, ` : ''}{hotel.city}
                </span>
              </div>
              {distance !== null && distance !== undefined && (
                <div className="mt-1 text-sm text-primary font-medium">
                  📍 {formatDistance()}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content - Scrollable */}
          <div className="overflow-y-auto flex-1">
            {/* Image Carousel */}
            <div className="p-4">
              <HotelImageCarousel
                images={hotel.image_urls}
                hotelName={hotel.name}
                className="mb-4"
              />
            </div>

            {/* Hotel Details */}
            <div className="px-4 pb-4 space-y-4">
              {/* Rating and Price */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                {hotel.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-lg">{hotel.rating}</span>
                      <span className="text-muted-foreground">/ 5</span>
                    </div>
                  </div>
                )}
                {(() => {
                  const priceInfo = getHotelPrice(hotel);
                  if (!priceInfo.hasPrice) return null;
                  return (
                    <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                      <IndianRupee className="w-5 h-5" />
                      <span>{priceInfo.price}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Amenities */}
              {hotel.amenities && hotel.amenities.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {hotel.amenities.map((amenity) => (
                      <Badge
                        key={amenity}
                        variant="outline"
                        className="flex items-center gap-1.5 px-3 py-1.5"
                      >
                        {amenityIcons[amenity] || <Sparkles className="w-4 h-4" />}
                        <span>{amenity}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Info */}
              {hotel.latitude && hotel.longitude && (
                <div className="pt-2 border-t">
                  <a
                    href={`https://www.google.com/maps?q=${hotel.latitude},${hotel.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    View on Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
