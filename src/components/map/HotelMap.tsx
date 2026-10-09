import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Hotel } from 'lucide-react';
import { normalizeHotelImages } from '@/lib/hotelUtils';

export interface HotelData {
  id: string;
  name: string;
  city: string;
  address: string | null;
  rating: number | null;
  price_range: string | null;
  price_per_night: number | null;
  amenities: string[] | null;
  image_urls: string[] | null;
  latitude: number | null;
  longitude: number | null;
}

interface HotelMapProps {
  onHotelClick?: (hotel: HotelData) => void;
  selectedHotelId?: string;
  height?: string;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
}

export default function HotelMap({ 
  onHotelClick, 
  selectedHotelId, 
  height = "500px",
  centerLat,
  centerLng,
  zoom = 6
}: HotelMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMapboxToken();
    fetchHotels();
  }, []);

  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      if (data?.token) {
        setMapboxToken(data.token);
      } else {
        setError('Mapbox token not configured');
      }
    } catch (err: any) {
      console.error('Error fetching Mapbox token:', err);
      setError('Failed to load map configuration');
    }
  };

  const fetchHotels = async () => {
    const { data } = await supabase
      .from('hotels')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);
    
    if (data) {
      // Normalize data to handle both old and new schema
      const normalizedHotels = data.map((hotel: any) => ({
        ...hotel,
        image_urls: normalizeHotelImages(hotel),
      })) as HotelData[];
      
      setHotels(normalizedHotels);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || hotels.length === 0 || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const defaultCenter: [number, number] = centerLng && centerLat 
      ? [centerLng, centerLat]
      : [74.2179, 26.9124]; // Default to Rajasthan center

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: defaultCenter,
      zoom: zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    hotels.forEach((hotel) => {
      if (!hotel.latitude || !hotel.longitude || !map.current) return;

      const el = document.createElement('div');
      el.className = 'hotel-marker';
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ef4444" stroke="%23ffffff" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>')`;
      el.style.backgroundSize = 'contain';
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s ease';
      el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';

      if (selectedHotelId === hotel.id) {
        el.style.transform = 'scale(1.3)';
        el.style.zIndex = '1000';
      }

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = selectedHotelId === hotel.id ? 'scale(1.3)' : 'scale(1)';
      });

      // Create popup with basic info
      const popupContent = document.createElement('div');
      popupContent.style.padding = '8px';
      popupContent.style.fontFamily = 'sans-serif';
      popupContent.style.minWidth = '150px';
      
      let html = `<div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${hotel.name}</div>`;
      html += `<div style="font-size: 12px; color: #666; margin-bottom: 4px;">${hotel.city}</div>`;
      
      if (hotel.rating) {
        html += `<div style="font-size: 12px; color: #f59e0b; margin-top: 4px;">⭐ ${hotel.rating}/5</div>`;
      }
      
      if (hotel.price_per_night) {
        html += `<div style="font-size: 12px; color: #10b981; margin-top: 2px;">₹${hotel.price_per_night}/night</div>`;
      } else if (hotel.price_range) {
        html += `<div style="font-size: 12px; color: #10b981; margin-top: 2px;">${hotel.price_range}</div>`;
      }
      
      popupContent.innerHTML = html;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([hotel.longitude, hotel.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, maxWidth: '200px' })
            .setDOMContent(popupContent)
        )
        .addTo(map.current);

      el.addEventListener('click', () => {
        if (onHotelClick) {
          onHotelClick(hotel);
        }
      });

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
    };
  }, [hotels, mapboxToken, onHotelClick, selectedHotelId, centerLat, centerLng, zoom]);

  useEffect(() => {
    if (!map.current || !selectedHotelId) return;

    const hotel = hotels.find(h => h.id === selectedHotelId);
    if (hotel?.latitude && hotel?.longitude) {
      map.current.flyTo({
        center: [hotel.longitude, hotel.latitude],
        zoom: 14,
        essential: true,
      });
    }
  }, [selectedHotelId, hotels]);

  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-xl border"
        style={{ height }}
      >
        <div className="text-center p-4">
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">Please configure MAPBOX_PUBLIC_TOKEN in settings</p>
        </div>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-xl border animate-pulse"
        style={{ height }}
      >
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden border shadow-lg" style={{ height }}>
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
}
