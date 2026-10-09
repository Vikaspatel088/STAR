import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface Monument {
  id: string;
  name: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

interface MonumentMapProps {
  onMonumentClick?: (monument: Monument) => void;
  selectedMonumentId?: string;
  height?: string;
}

export default function MonumentMap({ onMonumentClick, selectedMonumentId, height = "500px" }: MonumentMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMapboxToken();
    fetchMonuments();
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

  const fetchMonuments = async () => {
    const { data } = await supabase
      .from('monuments')
      .select('id, name, city, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);
    
    if (data) setMonuments(data);
  };

  useEffect(() => {
    if (!mapContainer.current || monuments.length === 0 || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [74.2179, 26.9124],
      zoom: 6,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    monuments.forEach((monument) => {
      if (!monument.latitude || !monument.longitude || !map.current) return;

      const el = document.createElement('div');
      el.className = 'monument-marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23c9a227" stroke="%23ffffff" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>')`;
      el.style.backgroundSize = 'contain';
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s ease';

      if (selectedMonumentId === monument.id) {
        el.style.transform = 'scale(1.3)';
      }

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = selectedMonumentId === monument.id ? 'scale(1.3)' : 'scale(1)';
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([monument.longitude, monument.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div style="padding: 8px; font-family: sans-serif;">
              <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 4px 0;">${monument.name}</h3>
              <p style="font-size: 12px; color: #666; margin: 0;">${monument.city}</p>
            </div>`
          )
        )
        .addTo(map.current);

      el.addEventListener('click', () => {
        if (onMonumentClick) {
          onMonumentClick(monument);
        }
      });

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
    };
  }, [monuments, mapboxToken, onMonumentClick, selectedMonumentId]);

  useEffect(() => {
    if (!map.current || !selectedMonumentId) return;

    const monument = monuments.find(m => m.id === selectedMonumentId);
    if (monument?.latitude && monument?.longitude) {
      map.current.flyTo({
        center: [monument.longitude, monument.latitude],
        zoom: 12,
        essential: true,
      });
    }
  }, [selectedMonumentId, monuments]);

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
