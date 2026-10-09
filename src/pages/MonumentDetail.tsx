import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ArrowLeft, IndianRupee, Users, Star, Clock, Languages, BadgeCheck, Ticket, Navigation2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import MonumentMap from '@/components/map/MonumentMap';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { generateQRCode } from '@/lib/hash';
import { getMonumentImageUrl } from '@/lib/monumentImages';
import DirectionsDialog from '@/components/map/DirectionsDialog';

interface Monument {
  id: string;
  name: string;
  city: string;
  state: string;
  description: string | null;
  category: string | null;
  indian_price: number;
  foreign_price: number;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Guide {
  id: string;
  name: string;
  languages: string[];
  hourly_rate: number;
  experience_years: number;
  avg_rating: number | null;
  total_ratings: number | null;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

export default function MonumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, touristProfile, userRole } = useAuth();
  const { toast } = useToast();
  const [monument, setMonument] = useState<Monument | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyTicketOpen, setBuyTicketOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMonument();
      fetchGuides();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id, fetchMonument and fetchGuides are stable

  const fetchMonument = async () => {
    try {
      const { data, error } = await supabase
      .from('monuments')
      .select('*')
      .eq('id', id)
      .single();
      if (error) {
        console.error('Error fetching monument:', error);
        toast({
          title: 'Error',
          description: 'Failed to load monument details. Please try again.',
          variant: 'destructive',
        });
      }
    if (data) setMonument(data);
    } catch (err) {
      console.error('Unexpected error fetching monument:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
    setLoading(false);
    }
  };

  const fetchGuides = async () => {
    try {
    // Get verified guides for this monument
      const { data, error } = await supabase
      .from('guide_monuments')
      .select(`
        guide_id,
        tour_guides (
          id,
          name,
          languages,
          hourly_rate,
          experience_years,
          avg_rating,
          total_ratings,
          bio,
          avatar_url,
          is_verified
        )
      `)
      .eq('monument_id', id);
    
      if (error) {
        console.error('Error fetching guides:', error);
        // Don't show toast for guides error as it's not critical
      }
      
    if (data) {
      const verifiedGuides = data
        .map(d => d.tour_guides)
        .filter((g): g is Guide => g !== null && g.is_verified);
      setGuides(verifiedGuides);
      }
    } catch (err) {
      console.error('Unexpected error fetching guides:', err);
    }
  };

  const handleBuyTicket = async () => {
    if (!user || !touristProfile || !monument) {
      toast({
        title: 'Login Required',
        description: 'Please register as a tourist to buy tickets.',
        variant: 'destructive',
      });
      navigate('/auth?mode=signup');
      return;
    }

    setPurchasing(true);

    try {
      const ticketType = touristProfile.tourist_type;
      const price = ticketType === 'indian' ? monument.indian_price : monument.foreign_price;
      const visitDate = new Date().toISOString().split('T')[0];
      const ticketId = crypto.randomUUID();
      const qrCode = generateQRCode(ticketId, monument.id, visitDate);

      const { error } = await supabase.from('tickets').insert({
        tourist_id: touristProfile.id,
        monument_id: monument.id,
        ticket_type: ticketType,
        price,
        qr_code: qrCode,
        visit_date: visitDate,
      });

      if (error) throw error;

      toast({
        title: 'Ticket Purchased!',
        description: 'Your ticket has been added to your dashboard.',
      });

      setBuyTicketOpen(false);
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to purchase ticket',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!monument) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16 text-muted-foreground">Monument not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            variant="ghost"
            onClick={() => navigate('/monuments')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Monuments
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Monument Info */}
            <div>
              {getMonumentImageUrl(monument.name, monument.image_url) ? (
                <img
                  src={getMonumentImageUrl(monument.name, monument.image_url)!}
                  alt={monument.name}
                  className="w-full h-64 rounded-xl object-cover mb-6"
                />
              ) : (
                <div className="w-full h-64 rounded-xl bg-muted flex items-center justify-center mb-6">
                  <MapPin className="w-16 h-16 text-muted-foreground" />
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
              <h1 className="font-display text-3xl font-bold">{monument.name}</h1>
                {monument.category && (
                  <Badge variant="outline" className="text-sm">
                    {monument.category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground flex items-center gap-1 mt-2">
                <MapPin className="w-4 h-4" /> {monument.city}, {monument.state}
              </p>

              {monument.description && (
                <p className="mt-4 text-foreground/80">{monument.description}</p>
              )}

              <div className="flex gap-6 mt-6">
                <div className="bg-card border rounded-lg p-4 flex-1">
                  <p className="text-sm text-muted-foreground">Indian Visitors</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    <IndianRupee className="w-5 h-5" /> {monument.indian_price}
                  </p>
                </div>
                <div className="bg-card border rounded-lg p-4 flex-1">
                  <p className="text-sm text-muted-foreground">Foreign Visitors</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    <Users className="w-5 h-5" /> ₹{monument.foreign_price}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button size="lg" className="flex-1" onClick={() => setBuyTicketOpen(true)}>
                  <Ticket className="w-4 h-4 mr-2" /> Buy Ticket
                </Button>
                {monument.latitude && monument.longitude && (
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setDirectionsOpen(true)}
                  >
                    <Navigation2 className="w-4 h-4 mr-2" /> Show Directions
                  </Button>
                )}
              </div>

              {/* Map */}
              <div className="h-64 mt-6">
                <MonumentMap selectedMonumentId={monument.id} />
              </div>
            </div>

            {/* Right: Tour Guides */}
            <div>
              <h2 className="font-display text-xl font-bold mb-4">Verified Tour Guides</h2>
              
              {guides.length === 0 ? (
                <div className="bg-card border rounded-xl p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No verified guides available for this monument yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {guides.map((guide) => (
                    <div key={guide.id} className="bg-card border rounded-xl p-4">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {guide.avatar_url ? (
                            <img src={guide.avatar_url} alt={guide.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Users className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{guide.name}</h3>
                            {guide.is_verified && (
                              <BadgeCheck className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-secondary" />
                              {guide.avg_rating?.toFixed(1) || 'N/A'} ({guide.total_ratings || 0})
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {guide.experience_years} yrs
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            <Languages className="w-3 h-3 text-muted-foreground" />
                            {guide.languages.map((lang, i) => (
                              <span key={lang} className="text-xs bg-muted px-2 py-0.5 rounded">
                                {lang}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span className="font-semibold text-primary">₹{guide.hourly_rate}/hr</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/guides/${guide.id}`)}
                            >
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Buy Ticket Dialog */}
        <Dialog open={buyTicketOpen} onOpenChange={setBuyTicketOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buy Ticket for {monument.name}</DialogTitle>
              <DialogDescription>
                Purchase a digital ticket for your visit
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {touristProfile ? (
                <>
                  <div className="bg-muted rounded-lg p-4 mb-4">
                    <p className="text-sm text-muted-foreground">Ticket Type</p>
                    <p className="font-semibold capitalize">{touristProfile.tourist_type} Visitor</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4 mb-4">
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="text-2xl font-bold">
                      ₹{touristProfile.tourist_type === 'indian' ? monument.indian_price : monument.foreign_price}
                    </p>
                  </div>
                  <Button className="w-full" onClick={handleBuyTicket} disabled={purchasing}>
                    {purchasing ? 'Processing...' : 'Confirm Purchase'}
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    You need to register as a tourist first.
                  </p>
                  <Button onClick={() => navigate('/auth?mode=signup')}>
                    Register Now
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Directions Dialog - Only render when needed */}
        {directionsOpen && monument.latitude && monument.longitude && (
          <DirectionsDialog
            open={directionsOpen}
            onOpenChange={setDirectionsOpen}
            destination={{ lat: monument.latitude, lng: monument.longitude }}
            destinationName={monument.name}
          />
        )}
      </div>
    </Layout>
  );
}
