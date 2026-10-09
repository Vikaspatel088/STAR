import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Navigation, X, Car, User, Clock, MapPin, Navigation2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface DirectionsMapProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  destinationName: string;
  onClose?: () => void;
  height?: string;
}

type TravelMode = 'driving' | 'walking';

interface RouteInfo {
  distance: string;
  duration: string;
  geometry: any;
}

export default function DirectionsMap({
  origin,
  destination,
  destinationName,
  onClose,
  height = '600px',
}: DirectionsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const routeLayerRef = useRef<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  useEffect(() => {
    fetchMapboxToken();
  }, []);

  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      if (data?.token) {
        setMapboxToken(data.token);
      } else {
        setError('Mapbox token not configured');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error fetching Mapbox token:', err);
      setError('Failed to load map configuration');
      setLoading(false);
    }
  };

  const fitBoundsToRoute = (geometry: any) => {
    if (!map.current) return;
    
    const coordinates = geometry.coordinates;
    const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
    
    map.current.fitBounds(bounds, {
      padding: { top: 150, bottom: 150, left: 150, right: 150 },
      duration: 1000,
    });
  };

  const fetchRoute = useCallback(async (profile: string) => {
    if (!mapboxToken) return;

    try {
      setLoading(true);
      setError(null);
      const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?geometries=geojson&overview=full&steps=true&access_token=${mapboxToken}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distance = (route.distance / 1000).toFixed(1); // Convert to km
        const duration = Math.round(route.duration / 60); // Convert to minutes
        
        setRouteInfo({
          distance: `${distance} km`,
          duration: `${duration} min`,
          geometry: route.geometry,
        });
        
        // Wait for map to be ready
        if (map.current) {
          if (!map.current.loaded()) {
            map.current.once('load', () => {
              if (map.current) {
                drawRoute(route.geometry);
                fitBoundsToRoute(route.geometry);
              }
            });
          } else {
            drawRoute(route.geometry);
            fitBoundsToRoute(route.geometry);
          }
        }
      } else {
        throw new Error(data.message || 'No route found');
      }
    } catch (err: any) {
      console.error('Error fetching route:', err);
      setError(err.message || 'Failed to calculate route');
    } finally {
      setLoading(false);
    }
  }, [mapboxToken, origin, destination]);

  const drawRoute = (geometry: any) => {
    if (!map.current) return;

    // Remove existing route layer if it exists
    if (routeLayerRef.current && map.current.getLayer(routeLayerRef.current)) {
      map.current.removeLayer(routeLayerRef.current);
    }
    if (routeLayerRef.current && map.current.getSource(routeLayerRef.current)) {
      map.current.removeSource(routeLayerRef.current);
    }

    const sourceId = `route-${Date.now()}`;
    routeLayerRef.current = sourceId;

    // Add route source
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: geometry,
      },
    });

    // Add route layer
    map.current.addLayer({
      id: sourceId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4,
        'line-opacity': 0.75,
      },
    });
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [origin.lng, origin.lat],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add origin marker
    const originMarker = new mapboxgl.Marker({ color: '#3b82f6' })
      .setLngLat([origin.lng, origin.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<div style="padding: 8px;"><strong>Your Location</strong></div>'))
      .addTo(map.current);

    // Add destination marker
    const destMarker = new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([destination.lng, destination.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<div style="padding: 8px;"><strong>${destinationName}</strong></div>`))
      .addTo(map.current);

    // Fetch route when map loads
    const loadHandler = () => {
      const profile = travelMode === 'driving' ? 'driving' : 'walking';
      // Small delay to ensure map is fully ready
      setTimeout(() => {
        fetchRoute(profile);
      }, 500);
    };
    
    if (map.current.loaded()) {
      loadHandler();
    } else {
      map.current.once('load', loadHandler);
    }

    return () => {
      if (routeLayerRef.current && map.current) {
        if (map.current.getLayer(routeLayerRef.current)) {
          map.current.removeLayer(routeLayerRef.current);
        }
        if (map.current.getSource(routeLayerRef.current)) {
          map.current.removeSource(routeLayerRef.current);
        }
      }
      map.current?.remove();
    };
  }, [mapboxToken, origin, destination, destinationName, travelMode, fetchRoute]);

  // Update route when travel mode changes
  useEffect(() => {
    if (!map.current || !mapboxToken) return;
    
    // Wait for map to be loaded
    if (!map.current.loaded()) {
      map.current.once('load', () => {
        const profile = travelMode === 'driving' ? 'driving' : 'walking';
        fetchRoute(profile);
      });
    } else {
      const profile = travelMode === 'driving' ? 'driving' : 'walking';
      fetchRoute(profile);
    }
  }, [travelMode, mapboxToken, fetchRoute]);

  if (error) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-xl border" style={{ height }}>
        <div className="text-center p-4">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-xl border animate-pulse" style={{ height }}>
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden border shadow-lg" style={{ height }}>
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Navigation Info Panel */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-4 right-4 z-10"
      >
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Navigation2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Directions to {destinationName}</h3>
            </div>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Route Info */}
          {routeInfo && (
            <div className="flex items-center gap-4 mb-3">
              <Badge variant="outline" className="font-semibold text-base px-3 py-1.5">
                <Clock className="w-4 h-4 mr-1.5" />
                {routeInfo.duration}
              </Badge>
              <Badge variant="outline" className="font-semibold text-base px-3 py-1.5">
                <MapPin className="w-4 h-4 mr-1.5" />
                {routeInfo.distance}
              </Badge>
            </div>
          )}

          {/* Travel Mode Selector */}
          <div className="flex gap-2">
            <Button
              variant={travelMode === 'driving' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTravelMode('driving')}
              className="flex items-center gap-2"
            >
              <Car className="w-4 h-4" />
              Driving
            </Button>
            <Button
              variant={travelMode === 'walking' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTravelMode('walking')}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Walking
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-background border rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Calculating route...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
