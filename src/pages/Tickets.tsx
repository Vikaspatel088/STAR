import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Calendar, MapPin, QrCode, Check, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Layout } from '@/components/layout/Layout';
import { Link, Navigate } from 'react-router-dom';

interface TicketWithMonument {
  id: string;
  qr_code: string;
  visit_date: string;
  ticket_type: string;
  price: number;
  is_used: boolean;
  created_at: string;
  monuments: {
    id: string;
    name: string;
    city: string;
  };
}

export default function Tickets() {
  const { user, touristProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TicketWithMonument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMonument | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (touristProfile) {
      fetchTickets();
    }
  }, [touristProfile]);

  const fetchTickets = async () => {
    if (!touristProfile) return;

    try {
      const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        qr_code,
        visit_date,
        ticket_type,
        price,
        is_used,
        created_at,
        monuments (id, name, city)
      `)
      .eq('tourist_id', touristProfile.id)
      .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching tickets:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tickets. Please try again.',
          variant: 'destructive',
        });
      }
    if (data) setTickets(data as unknown as TicketWithMonument[]);
    } catch (err) {
      console.error('Unexpected error fetching tickets:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
    setLoading(false);
    }
  };

  const handleScanTicket = async (ticket: TicketWithMonument) => {
    if (!touristProfile || ticket.is_used) return;

    setScanning(true);

    try {
      let latitude: number | null = null;
      let longitude: number | null = null;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {
        // Location not available
      }

      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ is_used: true })
        .eq('id', ticket.id);

      if (ticketError) throw ticketError;

      const { error: checkInError } = await supabase.from('check_ins').insert({
        tourist_id: touristProfile.id,
        monument_id: ticket.monuments.id,
        ticket_id: ticket.id,
        latitude,
        longitude,
      });

      if (checkInError) throw checkInError;

      const newXP = (touristProfile.xp_points || 0) + 50;
      await supabase
        .from('tourists')
        .update({ xp_points: newXP })
        .eq('id', touristProfile.id);

      toast({
        title: 'Check-in Successful!',
        description: `+50 XP earned! Welcome to ${ticket.monuments.name}`,
      });

      setSelectedTicket(null);
      fetchTickets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to scan ticket',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!touristProfile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-card border rounded-xl p-12 text-center">
            <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Complete Your Profile</h2>
            <p className="text-muted-foreground mb-6">
              Register as a tourist to view and purchase tickets
            </p>
            <Link to="/register/tourist">
              <Button>Complete Registration</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const usedTickets = tickets.filter(t => t.is_used);
  const activeTickets = tickets.filter(t => !t.is_used);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                <Ticket className="w-8 h-8 text-primary" />
                My Tickets
              </h1>
              <p className="text-muted-foreground mt-1">
                View and manage your monument tickets
              </p>
            </div>
            <Link to="/monuments">
              <Button>
                <MapPin className="w-4 h-4 mr-2" /> Buy New Ticket
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card border rounded-xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Tickets</p>
                  <p className="font-bold text-2xl">{tickets.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Tickets</p>
                  <p className="font-bold text-2xl">{activeTickets.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Used Tickets</p>
                  <p className="font-bold text-2xl">{usedTickets.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tickets List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card border rounded-xl p-6 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-muted" />
                    <div className="flex-1">
                      <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-card border rounded-xl p-12 text-center">
              <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Tickets Yet</h3>
              <p className="text-muted-foreground mb-6">
                Purchase your first ticket to explore Rajasthan's heritage
              </p>
              <Link to="/monuments">
                <Button>Explore Monuments</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-card border rounded-xl p-6 ${
                    ticket.is_used ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div 
                      className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                        ticket.is_used ? 'bg-success/20' : 'bg-primary/10'
                      }`}
                    >
                      {ticket.is_used ? (
                        <Check className="w-8 h-8 text-success" />
                      ) : (
                        <Ticket className="w-8 h-8 text-primary" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{ticket.monuments.name}</h3>
                        <Badge variant={ticket.is_used ? 'secondary' : 'default'}>
                          {ticket.is_used ? 'Used' : 'Active'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {ticket.monuments.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(ticket.visit_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Hash className="w-4 h-4" />
                          {ticket.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{ticket.price}</p>
                        <p className="text-xs text-muted-foreground capitalize">{ticket.ticket_type}</p>
                      </div>
                      
                      {!ticket.is_used && (
                        <Button
                          variant="outline"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          View QR
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* QR Code Text */}
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      QR: {ticket.qr_code}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Ticket QR Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ticket QR Code</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="py-4 text-center">
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <QRCodeSVG value={selectedTicket.qr_code} size={200} />
              </div>
              <p className="font-semibold text-lg">{selectedTicket.monuments.name}</p>
              <p className="text-muted-foreground">{selectedTicket.monuments.city}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Valid: {new Date(selectedTicket.visit_date).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                ID: {selectedTicket.id.slice(0, 8)}
              </p>
              <Button
                className="w-full mt-4"
                onClick={() => handleScanTicket(selectedTicket)}
                disabled={scanning}
              >
                {scanning ? 'Processing...' : 'Simulate Check-in'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
