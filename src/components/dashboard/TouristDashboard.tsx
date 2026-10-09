import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Ticket, MapPin, QrCode, Check, Star, Trophy, TrendingUp, Calendar, Award, AlertTriangle, Clock, CheckCircle, Loader2, MapPin as MapPinIcon, Heart, MapPinOff, ShieldAlert, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

interface CheckIn {
  id: string;
  check_in_time: string;
  monuments: {
    name: string;
    city: string;
  };
}

interface VisitAnalytics {
  totalMonuments: number;
  citiesVisited: string[];
  totalSpent: number;
  favoriteCity: string | null;
  visitStreak: number;
  achievements: string[];
}

interface SOSEvent {
  id: string;
  emergency_type: string;
  status: 'pending' | 'responded' | 'resolved';
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  admin_notes: string | null;
  battery_percent: number | null;
}

export default function TouristDashboard() {
  const { user, touristProfile } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TicketWithMonument[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMonument | null>(null);
  const [scanning, setScanning] = useState(false);
  const [analytics, setAnalytics] = useState<VisitAnalytics>({
    totalMonuments: 0,
    citiesVisited: [],
    totalSpent: 0,
    favoriteCity: null,
    visitStreak: 0,
    achievements: [],
  });

  useEffect(() => {
    if (touristProfile) {
      fetchData();
    }
  }, [touristProfile]);

  const fetchData = async () => {
    if (!touristProfile) return;

    // Fetch tickets
    const { data: ticketData } = await supabase
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

    if (ticketData) setTickets(ticketData as unknown as TicketWithMonument[]);

    // Fetch check-ins
    const { data: checkInData } = await supabase
      .from('check_ins')
      .select(`
        id,
        check_in_time,
        monuments (name, city)
      `)
      .eq('tourist_id', touristProfile.id)
      .order('check_in_time', { ascending: false });

    if (checkInData) setCheckIns(checkInData as unknown as CheckIn[]);

    // Fetch SOS events
    const { data: sosData } = await supabase
      .from('sos_events')
      .select('*')
      .eq('tourist_id', touristProfile.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (sosData) setSosEvents(sosData as unknown as SOSEvent[]);

    // Calculate analytics
    const cities = new Set<string>();
    let totalSpent = 0;
    const cityCounts = new Map<string, number>();

    checkInData?.forEach((checkIn: any) => {
      if (checkIn.monuments?.city) {
        cities.add(checkIn.monuments.city);
        cityCounts.set(
          checkIn.monuments.city,
          (cityCounts.get(checkIn.monuments.city) || 0) + 1
        );
      }
    });

    ticketData?.forEach((ticket: any) => {
      totalSpent += ticket.price || 0;
    });

    const favoriteCity = cityCounts.size > 0
      ? Array.from(cityCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    // Calculate visit streak (simplified - consecutive days with check-ins)
    const sortedCheckIns = [...(checkInData || [])].sort(
      (a: any, b: any) => new Date(a.check_in_time).getTime() - new Date(b.check_in_time).getTime()
    );
    let streak = 0;
    if (sortedCheckIns.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentDate = new Date(today);
      
      for (let i = sortedCheckIns.length - 1; i >= 0; i--) {
        const checkInDate = new Date(sortedCheckIns[i].check_in_time);
        checkInDate.setHours(0, 0, 0, 0);
        
        if (checkInDate.getTime() === currentDate.getTime()) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (checkInDate.getTime() < currentDate.getTime()) {
          break;
        }
      }
    }

    // Calculate achievements
    const achievements: string[] = [];
    if (checkInData && checkInData.length >= 1) achievements.push('First Visit');
    if (checkInData && checkInData.length >= 5) achievements.push('Explorer');
    if (checkInData && checkInData.length >= 10) achievements.push('Adventurer');
    if (cities.size >= 3) achievements.push('Multi-City Traveler');
    if (touristProfile?.xp_points && touristProfile.xp_points >= 500) achievements.push('XP Master');
    if (streak >= 3) achievements.push('Dedicated Visitor');

    setAnalytics({
      totalMonuments: new Set(checkInData?.map((c: any) => c.monuments?.id).filter(Boolean)).size,
      citiesVisited: Array.from(cities),
      totalSpent,
      favoriteCity,
      visitStreak: streak,
      achievements,
    });

    setLoading(false);
  };

  const handleScanTicket = async (ticket: TicketWithMonument) => {
    if (!touristProfile || ticket.is_used) return;

    setScanning(true);

    try {
      // Get current location
      let latitude: number | null = null;
      let longitude: number | null = null;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {
        // Location not available, continue without it
      }

      // Mark ticket as used
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ is_used: true })
        .eq('id', ticket.id);

      if (ticketError) throw ticketError;

      // Create check-in record
      const { error: checkInError } = await supabase.from('check_ins').insert({
        tourist_id: touristProfile.id,
        monument_id: ticket.monuments.id,
        ticket_id: ticket.id,
        latitude,
        longitude,
      });

      if (checkInError) throw checkInError;

      // Update XP
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
      fetchData();
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

  if (!touristProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
          <div className="max-w-md mx-auto">
            <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">Welcome to STAR!</h2>
            <p className="text-muted-foreground mb-6">
              Complete your profile to unlock all features including tickets, check-ins, and rewards.
            </p>
            <Link to="/register/tourist">
              <Button size="lg">
                Complete Your Profile
              </Button>
            </Link>
            <div className="mt-8 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">Or explore without a profile:</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/monuments">
                  <Button variant="outline">
                    <MapPin className="w-4 h-4 mr-2" /> Explore Monuments
                  </Button>
                </Link>
                <Link to="/guides">
                  <Button variant="outline">
                    <Users className="w-4 h-4 mr-2" /> Find Guides
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Tourist Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, traveler!</p>
          </div>
          <Link to="/monuments">
            <Button>
              <MapPin className="w-4 h-4 mr-2" /> Explore Monuments
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tourist ID</p>
                <p className="font-mono text-sm font-semibold">{touristProfile.digital_tourist_id}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">XP Points</p>
                <p className="font-bold text-xl">{touristProfile.xp_points || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tickets</p>
                <p className="font-bold text-xl">{tickets.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-ins</p>
                <p className="font-bold text-xl">{checkIns.length}</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="sos">SOS History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tickets */}
              <div>
                <h2 className="font-display text-xl font-bold mb-4">Your Tickets</h2>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : tickets.length === 0 ? (
              <div className="bg-card border rounded-xl p-8 text-center">
                <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tickets yet.</p>
                <Link to="/monuments">
                  <Button className="mt-4" variant="outline">Buy a Ticket</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`bg-card border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                      ticket.is_used ? 'opacity-60' : ''
                    }`}
                    onClick={() => !ticket.is_used && setSelectedTicket(ticket)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{ticket.monuments.name}</h3>
                        <p className="text-sm text-muted-foreground">{ticket.monuments.city}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(ticket.visit_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{ticket.price}</p>
                        {ticket.is_used ? (
                          <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">
                            Used
                          </span>
                        ) : (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Check-in History */}
          <div>
            <h2 className="font-display text-xl font-bold mb-4">Visit History</h2>
            {checkIns.length === 0 ? (
              <div className="bg-card border rounded-xl p-8 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No visits recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {checkIns.map((checkIn) => (
                  <div key={checkIn.id} className="bg-card border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{checkIn.monuments.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(checkIn.check_in_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            </div>
          </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Monuments Visited
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics.totalMonuments}</p>
                <p className="text-sm text-muted-foreground mt-2">Unique monuments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Visit Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics.visitStreak}</p>
                <p className="text-sm text-muted-foreground mt-2">Consecutive days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Total Spent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">₹{analytics.totalSpent}</p>
                <p className="text-sm text-muted-foreground mt-2">On tickets</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cities Visited</CardTitle>
                <CardDescription>Explore different cities in Rajasthan</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.citiesVisited.length === 0 ? (
                  <p className="text-muted-foreground">No cities visited yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {analytics.citiesVisited.map(city => (
                      <Badge key={city} variant="outline" className="text-sm">
                        {city}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Favorite City</CardTitle>
                <CardDescription>Your most visited city</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.favoriteCity ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{analytics.favoriteCity}</p>
                      <p className="text-sm text-muted-foreground">Most check-ins</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No favorite city yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Your Achievements
              </CardTitle>
              <CardDescription>Unlock achievements as you explore Rajasthan</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.achievements.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No achievements unlocked yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Start exploring to earn achievements!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-4 bg-gradient-to-br from-primary/5 to-primary/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{achievement}</p>
                          <p className="text-xs text-muted-foreground">Unlocked</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Emergency SOS History
              </CardTitle>
              <CardDescription>
                View your past emergency alerts and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sosEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-2">No SOS alerts sent yet</p>
                  <p className="text-sm text-muted-foreground">
                    Use the SOS button (bottom right) if you need emergency assistance
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sosEvents.map((sos) => {
                    const emergencyType = emergencyTypes.find(t => t.value === sos.emergency_type);
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
                      <motion.div
                        key={sos.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {emergencyType && (
                              <div className={`w-10 h-10 rounded-lg ${emergencyType.color} flex items-center justify-center`}>
                                <emergencyType.icon className="w-5 h-5 text-white" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold">
                                {emergencyType?.label || sos.emergency_type}
                              </h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(sos.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(sos.status)}
                        </div>

                        {sos.latitude && sos.longitude && (
                          <div className="mb-2">
                            <a
                              href={`https://www.google.com/maps?q=${sos.latitude},${sos.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              <MapPinIcon className="w-3 h-3" />
                              View Location on Map
                            </a>
                          </div>
                        )}

                        {sos.battery_percent !== null && (
                          <p className="text-xs text-muted-foreground mb-2">
                            Battery: {sos.battery_percent}%
                          </p>
                        )}

                        {sos.admin_notes && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-sm font-medium mb-1">Response:</p>
                            <p className="text-sm text-muted-foreground">{sos.admin_notes}</p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </motion.div>

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
              <Button
                className="w-full mt-4"
                onClick={() => handleScanTicket(selectedTicket)}
                disabled={scanning}
              >
                {scanning ? 'Scanning...' : 'Simulate Scan / Check-in'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const emergencyTypes = [
  { value: 'medical', label: 'Medical Emergency', icon: Heart, color: 'bg-red-500' },
  { value: 'lost', label: "I'm Lost", icon: MapPinOff, color: 'bg-amber-500' },
  { value: 'harassment', label: 'Harassment', icon: ShieldAlert, color: 'bg-purple-500' },
  { value: 'unsafe_area', label: 'Unsafe Area', icon: AlertTriangle, color: 'bg-orange-500' },
];
