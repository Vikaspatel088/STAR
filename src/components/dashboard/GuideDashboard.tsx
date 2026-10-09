import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Users, Clock, BadgeCheck, AlertCircle, DollarSign, Calendar, TrendingUp, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Rating {
  id: string;
  behaviour_rating: number;
  language_rating: number;
  responsibility_rating: number;
  comment: string | null;
  created_at: string;
}

interface Monument {
  id: string;
  name: string;
  city: string;
}

interface Booking {
  id: string;
  tourist_name: string;
  monument_name: string;
  booking_date: string;
  duration: number;
  status: string;
  total_amount: number;
}

interface Earnings {
  totalEarnings: number;
  thisMonth: number;
  thisWeek: number;
  totalBookings: number;
  completedBookings: number;
}

export default function GuideDashboard() {
  const { guideProfile } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [earnings, setEarnings] = useState<Earnings>({
    totalEarnings: 0,
    thisMonth: 0,
    thisWeek: 0,
    totalBookings: 0,
    completedBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guideProfile) {
      fetchData();
    }
  }, [guideProfile]);

  const fetchData = async () => {
    if (!guideProfile) return;

    // Fetch ratings
    const { data: ratingsData } = await supabase
      .from('guide_ratings')
      .select('*')
      .eq('guide_id', guideProfile.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (ratingsData) setRatings(ratingsData);

    // Fetch assigned monuments
    const { data: monumentData } = await supabase
      .from('guide_monuments')
      .select(`
        monuments (id, name, city)
      `)
      .eq('guide_id', guideProfile.id);

    if (monumentData) {
      const mons = monumentData.map(d => d.monuments).filter((m): m is Monument => m !== null);
      setMonuments(mons);
    }

    // Fetch bookings (simulated - in real app, this would come from a bookings table)
    // For demo, we'll simulate some booking data
    const simulatedBookings: Booking[] = [];
    setBookings(simulatedBookings);

    // Calculate earnings
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const totalEarnings = simulatedBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + b.total_amount, 0);
    
    const thisMonth = simulatedBookings
      .filter(b => b.status === 'completed' && new Date(b.booking_date) >= monthStart)
      .reduce((sum, b) => sum + b.total_amount, 0);
    
    const thisWeek = simulatedBookings
      .filter(b => b.status === 'completed' && new Date(b.booking_date) >= weekStart)
      .reduce((sum, b) => sum + b.total_amount, 0);

    setEarnings({
      totalEarnings,
      thisMonth,
      thisWeek,
      totalBookings: simulatedBookings.length,
      completedBookings: simulatedBookings.filter(b => b.status === 'completed').length,
    });

    setLoading(false);
  };

  if (!guideProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Guide Dashboard</h1>
          <p className="text-muted-foreground">Manage your guide profile</p>
        </div>

        {/* Verification Status */}
        {!guideProfile.is_verified && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-warning" />
            <div>
              <p className="font-semibold text-warning">Verification Pending</p>
              <p className="text-sm text-muted-foreground">
                Your account is pending admin verification.
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {guideProfile.is_verified ? (
                  <BadgeCheck className="w-5 h-5 text-primary" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold">
                  {guideProfile.is_verified ? 'Verified' : 'Pending'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="font-bold text-xl">
                  {guideProfile.avg_rating?.toFixed(1) || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="font-bold text-xl">{guideProfile.total_ratings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Experience</p>
                <p className="font-bold text-xl">{guideProfile.experience_years} yrs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Info */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="font-display text-xl font-bold mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold">{guideProfile.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-semibold">{guideProfile.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hourly Rate</p>
                <p className="font-semibold">₹{guideProfile.hourly_rate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Languages</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {guideProfile.languages.map((lang: string) => (
                    <span key={lang} className="text-xs bg-muted px-2 py-1 rounded">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              {guideProfile.bio && (
                <div>
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p>{guideProfile.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Monuments */}
          <div>
            <h2 className="font-display text-xl font-bold mb-4">Assigned Monuments</h2>
            {monuments.length === 0 ? (
              <div className="bg-card border rounded-xl p-8 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No monuments assigned.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {monuments.map((monument) => (
                  <div key={monument.id} className="bg-card border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{monument.name}</h3>
                        <p className="text-sm text-muted-foreground">{monument.city}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="mt-8">
          <h2 className="font-display text-xl font-bold mb-4">Recent Reviews</h2>
          {ratings.length === 0 ? (
            <div className="bg-card border rounded-xl p-8 text-center">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reviews yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ratings.map((rating) => (
                <div key={rating.id} className="bg-card border rounded-xl p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-secondary fill-secondary" />
                      <span className="font-semibold">
                        {((rating.behaviour_rating + rating.language_rating + rating.responsibility_rating) / 3).toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {rating.comment && <p className="text-sm">{rating.comment}</p>}
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span>Behaviour: {rating.behaviour_rating}/5</span>
                    <span>Language: {rating.language_rating}/5</span>
                    <span>Responsibility: {rating.responsibility_rating}/5</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Requests</CardTitle>
              <CardDescription>Manage your tour bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No booking requests yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Once verified, tourists can book your services
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{booking.tourist_name}</h3>
                          <p className="text-sm text-muted-foreground">{booking.monument_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(booking.booking_date).toLocaleDateString()} • {booking.duration} hours
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{booking.total_amount}</p>
                          <Badge variant={booking.status === 'completed' ? 'default' : 'outline'}>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">₹{earnings.totalEarnings}</p>
                <p className="text-sm text-muted-foreground mt-2">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">₹{earnings.thisMonth}</p>
                <p className="text-sm text-muted-foreground mt-2">Current month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">₹{earnings.thisWeek}</p>
                <p className="text-sm text-muted-foreground mt-2">Last 7 days</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Booking Statistics</CardTitle>
              <CardDescription>Your booking performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{earnings.totalBookings}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{earnings.completedBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </motion.div>
    </div>
  );
}
