import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import DirectionsMap from './DirectionsMap';
import { getUserLocation } from '@/lib/distance';
import { Loader2, RefreshCw } from 'lucide-react';

interface DirectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destination: { lat: number; lng: number };
  destinationName: string;
}

export default function DirectionsDialog({
  open,
  onOpenChange,
  destination,
  destinationName,
}: DirectionsDialogProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchUserLocation();
    } else {
      // Reset state when dialog closes
      setUserLocation(null);
      setLocationError(null);
      setLoadingLocation(true);
    }
  }, [open]);

  const fetchUserLocation = async () => {
    setLoadingLocation(true);
    setLocationError(null);
    
    try {
      const location = await getUserLocation();
      if (location) {
        setUserLocation(location);
      } else {
        setLocationError('Unable to get your location. Please enable location services.');
      }
    } catch (error) {
      setLocationError('Failed to get your location. Please check your browser settings.');
    } finally {
      setLoadingLocation(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Directions to {destinationName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 relative px-6 pb-6" style={{ minHeight: '500px' }}>
          {loadingLocation ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Getting your location...</p>
              </div>
            </div>
          ) : locationError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <p className="text-destructive mb-4">{locationError}</p>
                <Button onClick={fetchUserLocation} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try again
                </Button>
              </div>
            </div>
          ) : userLocation ? (
            <DirectionsMap
              origin={userLocation}
              destination={destination}
              destinationName={destinationName}
              onClose={() => onOpenChange(false)}
              height="100%"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Preparing directions...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
