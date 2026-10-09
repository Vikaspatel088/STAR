import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Heart, MapPinOff, ShieldAlert, AlertCircle, Phone, MapPin, MessageSquare, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

interface SOSButtonProps {
  touristId: string;
}

interface SOSEvent {
  id: string;
  emergency_type: string;
  status: 'pending' | 'responded' | 'resolved';
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  admin_notes: string | null;
}

const emergencyTypes = [
  { value: 'medical', label: 'Medical Emergency', icon: Heart, color: 'bg-red-500', description: 'Requires immediate medical attention' },
  { value: 'lost', label: "I'm Lost", icon: MapPinOff, color: 'bg-amber-500', description: 'Need help finding my way' },
  { value: 'harassment', label: 'Harassment', icon: ShieldAlert, color: 'bg-purple-500', description: 'Feeling unsafe or harassed' },
  { value: 'unsafe_area', label: 'Unsafe Area', icon: AlertCircle, color: 'bg-orange-500', description: 'In an unsafe location' },
];

export function SOSButton({ touristId }: SOSButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [recentSOS, setRecentSOS] = useState<SOSEvent | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { toast } = useToast();
  const { touristProfile } = useAuth();

  // Check for recent SOS events
  useEffect(() => {
    if (isOpen) {
      checkRecentSOS();
    }
  }, [isOpen, touristId]);

  // Subscribe to real-time updates for SOS status
  useEffect(() => {
    if (!touristId) return;

    const channel = supabase
      .channel(`sos-${touristId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sos_events',
          filter: `tourist_id=eq.${touristId}`,
        },
        (payload) => {
          if (payload.new) {
            setRecentSOS(payload.new as SOSEvent);
            if (payload.new.status === 'responded') {
              toast({
                title: 'Help is on the way!',
                description: 'Emergency services have been notified and are responding.',
                variant: 'default',
              });
            } else if (payload.new.status === 'resolved') {
              toast({
                title: 'SOS Resolved',
                description: 'Your emergency has been resolved. Stay safe!',
                variant: 'default',
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [touristId, toast]);

  const checkRecentSOS = async () => {
    setIsCheckingStatus(true);
    try {
      const { data } = await supabase
        .from('sos_events')
        .select('*')
        .eq('tourist_id', touristId)
        .in('status', ['pending', 'responded'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setRecentSOS(data as SOSEvent);
        if (data.latitude && data.longitude) {
          await fetchLocationAddress(data.latitude, data.longitude);
        }
      } else {
        setRecentSOS(null);
      }
    } catch (error) {
      console.error('Error checking recent SOS:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const fetchLocationAddress = async (lat: number, lng: number) => {
    try {
      // Using OpenStreetMap Nominatim API (free, no key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      if (data.display_name) {
        setLocationAddress(data.display_name);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const handleSOS = async (emergencyType: string) => {
    setIsSubmitting(true);

    try {
      // Get location with better accuracy
      let latitude: number | undefined;
      let longitude: number | undefined;
      let locationAccuracy: number | undefined;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                timeout: 10000,
                enableHighAccuracy: true,
                maximumAge: 0,
              }
            );
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          locationAccuracy = position.coords.accuracy;

          // Fetch address for the location
          if (latitude && longitude) {
            await fetchLocationAddress(latitude, longitude);
          }
        } catch (e) {
          console.log('Could not get location:', e);
        }
      }

      // Get battery level
      let batteryPercent: number | undefined;
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          batteryPercent = Math.round(battery.level * 100);
        } catch (e) {
          console.log('Could not get battery level');
        }
      }

      // Get device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      };

      const { data, error } = await supabase.from('sos_events').insert({
        tourist_id: touristId,
        emergency_type: emergencyType,
        latitude,
        longitude,
        battery_percent: batteryPercent,
        admin_notes: message ? `User message: ${message}` : null,
      }).select().single();

      if (error) throw error;

      // Store the created SOS event
      if (data) {
        setRecentSOS(data as SOSEvent);
      }

      toast({
        title: 'SOS Alert Sent!',
        description: 'Help is on the way. Stay calm and stay where you are.',
        variant: 'default',
        duration: 5000,
      });

      // Don't close immediately - show status
      setSelectedType(null);
      setMessage('');
    } catch (error) {
      console.error('Error sending SOS:', error);
      toast({
        title: 'Error sending SOS',
        description: 'Please try again or call emergency services directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Pending</Badge>;
      case 'responded':
        return <Badge variant="default" className="gap-1"><Clock className="w-3 h-3" /> Responded</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="gap-1"><CheckCircle className="w-3 h-3" /> Resolved</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      {/* SOS Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full sos-gradient shadow-glow-sos flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="absolute inset-0 rounded-full bg-destructive animate-pulse-ring" />
        <AlertTriangle className="w-8 h-8 text-destructive-foreground relative z-10" />
      </motion.button>

      {/* SOS Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-foreground/80 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-0 left-0 right-0 z-50 p-4 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full"
            >
              <div className="bg-card rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-destructive p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-destructive-foreground" />
                    <h2 className="font-display font-bold text-xl text-destructive-foreground">
                      Emergency SOS
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full hover:bg-destructive-foreground/20 transition-colors"
                  >
                    <X className="w-5 h-5 text-destructive-foreground" />
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  {/* Show recent SOS status if exists */}
                  {recentSOS && (
                    <div className="bg-muted rounded-lg p-3 mb-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <span className="font-semibold text-sm">Active SOS Alert</span>
                        </div>
                        {getStatusBadge(recentSOS.status)}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          Type: {emergencyTypes.find(t => t.value === recentSOS.emergency_type)?.label || recentSOS.emergency_type}
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(recentSOS.created_at)}
                        </p>
                        {locationAddress && (
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {locationAddress}
                          </p>
                        )}
                        {recentSOS.admin_notes && recentSOS.status !== 'pending' && (
                          <p className="mt-2 pt-2 border-t border-border">
                            <strong>Response:</strong> {recentSOS.admin_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {!selectedType ? (
                    <>
                  <p className="text-muted-foreground text-sm text-center mb-4">
                    Select the type of emergency
                  </p>

                  {emergencyTypes.map((type) => (
                    <Button
                      key={type.value}
                          onClick={() => setSelectedType(type.value)}
                          disabled={isSubmitting || (recentSOS && recentSOS.status === 'pending')}
                          className={`w-full h-16 text-left justify-start gap-4 ${type.color} hover:opacity-90`}
                    >
                      <type.icon className="w-6 h-6" />
                          <div className="flex-1 text-left">
                            <div className="font-semibold">{type.label}</div>
                            <div className="text-xs opacity-90">{type.description}</div>
                          </div>
                    </Button>
                  ))}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          {emergencyTypes.find(t => t.value === selectedType)?.label}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedType(null);
                            setMessage('');
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div>
                        <Label htmlFor="sos-message">Additional Details (Optional)</Label>
                        <Textarea
                          id="sos-message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Describe your situation or provide any additional information..."
                          className="mt-1"
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          This will help emergency responders assist you better.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedType(null);
                            setMessage('');
                          }}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          className={`flex-1 ${emergencyTypes.find(t => t.value === selectedType)?.color || 'bg-red-500'}`}
                          onClick={() => handleSOS(selectedType)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Send SOS
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border space-y-2">
                    <a href="tel:112">
                      <Button variant="outline" className="w-full gap-2">
                        <Phone className="w-5 h-5" />
                        Call Emergency Services (112)
                      </Button>
                    </a>
                    {touristProfile?.emergency_contact && (
                      <a href={`tel:${touristProfile.emergency_contact.replace(/\s/g, '')}`}>
                        <Button variant="outline" className="w-full gap-2">
                          <Phone className="w-5 h-5" />
                          Call Emergency Contact
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
