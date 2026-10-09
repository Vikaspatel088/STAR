import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, MapPin, Ticket, Calendar, Plus, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Organisation {
  id: string;
  organisation_id: string;
  name: string;
  organisation_type: string;
  contact_person: string;
  contact_number: string;
  created_at: string;
}

interface GroupBooking {
  id: string;
  monument_name: string;
  visit_date: string;
  group_size: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'completed';
  created_at: string;
}

interface Monument {
  id: string;
  name: string;
  city: string;
  indian_price: number;
  foreign_price: number;
}

export default function OrganisationDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<GroupBooking[]>([]);
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    monument_id: '',
    visit_date: '',
    group_size: '',
    ticket_type: 'indian',
  });

  useEffect(() => {
    if (user) {
      fetchOrganisation();
      fetchMonuments();
      fetchBookings();
    }
  }, [user]);

  const fetchOrganisation = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('organisations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) setOrganisation(data);
    setLoading(false);
  };

  const fetchMonuments = async () => {
    const { data } = await supabase
      .from('monuments')
      .select('id, name, city, indian_price, foreign_price')
      .order('name');
    
    if (data) setMonuments(data);
  };

  const fetchBookings = async () => {
    // In a real app, this would fetch from a group_bookings table
    // For demo, we'll use localStorage
    const stored = localStorage.getItem(`org_bookings_${user?.id}`);
    if (stored) {
      setBookings(JSON.parse(stored));
    }
  };

  const handleCreateBooking = async () => {
    if (!organisation || !bookingForm.monument_id || !bookingForm.visit_date || !bookingForm.group_size) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    const monument = monuments.find(m => m.id === bookingForm.monument_id);
    if (!monument) return;

    const price = bookingForm.ticket_type === 'indian' ? monument.indian_price : monument.foreign_price;
    const totalAmount = parseFloat(price) * parseInt(bookingForm.group_size);

    const newBooking: GroupBooking = {
      id: `booking_${Date.now()}`,
      monument_name: monument.name,
      visit_date: bookingForm.visit_date,
      group_size: parseInt(bookingForm.group_size),
      total_amount: totalAmount,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const updatedBookings = [...bookings, newBooking];
    setBookings(updatedBookings);
    localStorage.setItem(`org_bookings_${user?.id}`, JSON.stringify(updatedBookings));

    toast({
      title: 'Booking Created',
      description: `Group booking for ${monument.name} created successfully`,
    });

    setShowBookingDialog(false);
    setBookingForm({
      monument_id: '',
      visit_date: '',
      group_size: '',
      ticket_type: 'indian',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!organisation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Organisation profile not found.</p>
          <Link to="/register/organisation">
            <Button>Complete Registration</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Organisation Dashboard</h1>
            <p className="text-muted-foreground">Manage group tourism activities</p>
          </div>
          <Link to="/monuments">
            <Button>
              <MapPin className="w-4 h-4 mr-2" /> Explore Monuments
            </Button>
          </Link>
        </div>

        {/* Organisation Info Card */}
        <div className="bg-card border rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">{organisation.name}</h2>
              <p className="text-muted-foreground">{organisation.organisation_type}</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Organisation ID</p>
                  <p className="font-mono font-semibold">{organisation.organisation_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-semibold">{organisation.contact_person}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Number</p>
                  <p className="font-semibold">{organisation.contact_number}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">Group Bookings</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Group Bookings</h2>
              <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Booking
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Group Booking</DialogTitle>
                    <DialogDescription>
                      Book tickets for your entire group
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="monument">Monument</Label>
                      <Select
                        value={bookingForm.monument_id}
                        onValueChange={(value) => setBookingForm({ ...bookingForm, monument_id: value })}
                      >
                        <SelectTrigger id="monument">
                          <SelectValue placeholder="Select monument" />
                        </SelectTrigger>
                        <SelectContent>
                          {monuments.map(monument => (
                            <SelectItem key={monument.id} value={monument.id}>
                              {monument.name} - {monument.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="visit_date">Visit Date</Label>
                      <Input
                        id="visit_date"
                        type="date"
                        value={bookingForm.visit_date}
                        onChange={(e) => setBookingForm({ ...bookingForm, visit_date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="group_size">Group Size</Label>
                      <Input
                        id="group_size"
                        type="number"
                        min="1"
                        value={bookingForm.group_size}
                        onChange={(e) => setBookingForm({ ...bookingForm, group_size: e.target.value })}
                        placeholder="Number of people"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ticket_type">Ticket Type</Label>
                      <Select
                        value={bookingForm.ticket_type}
                        onValueChange={(value) => setBookingForm({ ...bookingForm, ticket_type: value })}
                      >
                        <SelectTrigger id="ticket_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="indian">Indian</SelectItem>
                          <SelectItem value="foreign">Foreign</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {bookingForm.monument_id && bookingForm.group_size && (
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Estimated Total</p>
                        <p className="text-2xl font-bold">
                          ₹{(() => {
                            const monument = monuments.find(m => m.id === bookingForm.monument_id);
                            if (!monument) return '0';
                            const price = bookingForm.ticket_type === 'indian' ? monument.indian_price : monument.foreign_price;
                            return (parseFloat(price) * parseInt(bookingForm.group_size || '0')).toLocaleString();
                          })()}
                        </p>
                      </div>
                    )}
                    <Button onClick={handleCreateBooking} className="w-full">
                      Create Booking
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {bookings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-2">No group bookings yet</p>
                  <p className="text-sm text-muted-foreground">Create your first group booking to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{booking.monument_name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(booking.visit_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {booking.group_size} people
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">₹{booking.total_amount.toLocaleString()}</p>
                          <Badge variant={booking.status === 'confirmed' ? 'default' : 'outline'} className="mt-2">
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{bookings.length}</p>
                  <p className="text-sm text-muted-foreground mt-2">All time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {bookings.reduce((sum, b) => sum + b.group_size, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Total people booked</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Spent</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    ₹{bookings.reduce((sum, b) => sum + b.total_amount, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">All bookings</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
