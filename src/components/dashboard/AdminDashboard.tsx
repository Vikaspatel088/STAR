import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Ticket, BadgeCheck, X, Check, BarChart3, AlertTriangle, Clock, CheckCircle, Loader2, MessageSquare, MapPin as MapPinIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Guide {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  languages: string[];
  hourly_rate: number;
  experience_years: number;
  is_verified: boolean;
  created_at: string;
}

interface FootfallData {
  monument_name: string;
  total_visitors: number;
}

interface SOSEvent {
  id: string;
  tourist_id: string;
  emergency_type: string;
  status: 'pending' | 'responded' | 'resolved';
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  battery_percent: number | null;
  admin_notes: string | null;
  resolved_at: string | null;
  tourists: {
    digital_tourist_id: string;
    emergency_contact: string | null;
  } | null;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [footfall, setFootfall] = useState<FootfallData[]>([]);
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>([]);
  const [selectedSOS, setSelectedSOS] = useState<SOSEvent | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [stats, setStats] = useState({
    totalTourists: 0,
    totalGuides: 0,
    totalTickets: 0,
    totalCheckIns: 0,
    pendingSOS: 0,
  });
  const [loading, setLoading] = useState(true);

  const getEmergencyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      medical: 'Medical Emergency',
      lost: "I'm Lost",
      harassment: 'Harassment',
      unsafe_area: 'Unsafe Area',
    };
    return types[type] || type;
  };

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime updates for check_ins and SOS events
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'check_ins' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sos_events' }, (payload) => {
        toast({
          title: 'New SOS Alert!',
          description: `Emergency type: ${getEmergencyTypeLabel(payload.new.emergency_type as string)}`,
          variant: 'destructive',
        });
        fetchData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sos_events' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const fetchData = async () => {
    // Fetch all guides
    const { data: guidesData } = await supabase
      .from('tour_guides')
      .select('*')
      .order('created_at', { ascending: false });
    if (guidesData) setGuides(guidesData);

    // Fetch stats
    const { count: touristCount } = await supabase.from('tourists').select('*', { count: 'exact', head: true });
    const { count: guideCount } = await supabase.from('tour_guides').select('*', { count: 'exact', head: true });
    const { count: ticketCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true });
    const { count: checkInCount } = await supabase.from('check_ins').select('*', { count: 'exact', head: true });

    // Fetch SOS events
    const { data: sosData } = await supabase
      .from('sos_events')
      .select(`
        *,
        tourists (digital_tourist_id, emergency_contact)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (sosData) {
      setSosEvents(sosData as unknown as SOSEvent[]);
    }

    const { count: pendingSOSCount } = await supabase
      .from('sos_events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    setStats({
      totalTourists: touristCount || 0,
      totalGuides: guideCount || 0,
      totalTickets: ticketCount || 0,
      totalCheckIns: checkInCount || 0,
      pendingSOS: pendingSOSCount || 0,
    });

    // Fetch footfall per monument
    const { data: checkIns } = await supabase
      .from('check_ins')
      .select(`
        monument_id,
        monuments (name)
      `);

    if (checkIns) {
      const footfallMap: Record<string, { name: string; count: number }> = {};
      checkIns.forEach((c: any) => {
        const name = c.monuments?.name || 'Unknown';
        if (!footfallMap[name]) footfallMap[name] = { name, count: 0 };
        footfallMap[name].count++;
      });
      
      const footfallData = Object.values(footfallMap)
        .map(f => ({ monument_name: f.name, total_visitors: f.count }))
        .sort((a, b) => b.total_visitors - a.total_visitors);
      
      setFootfall(footfallData);
    }

    setLoading(false);
  };

  const handleVerifyGuide = async (guideId: string, verify: boolean) => {
    try {
      const { error } = await supabase
        .from('tour_guides')
        .update({ is_verified: verify })
        .eq('id', guideId);

      if (error) throw error;

      toast({
        title: verify ? 'Guide Verified' : 'Verification Removed',
        description: verify ? 'The guide is now visible to tourists.' : 'The guide is no longer visible.',
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSOSStatus = async (sosId: string, status: 'responded' | 'resolved', notes?: string) => {
    setUpdatingStatus(true);
    try {
      const updateData: any = {
        status,
        admin_notes: notes || adminNotes || null,
      };

      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('sos_events')
        .update(updateData)
        .eq('id', sosId);

      if (error) throw error;

      toast({
        title: 'SOS Status Updated',
        description: `Status changed to ${status}`,
      });

      setSelectedSOS(null);
      setAdminNotes('');
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
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
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage tourism operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tourists</p>
                <p className="font-bold text-2xl">{stats.totalTourists}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tour Guides</p>
                <p className="font-bold text-2xl">{stats.totalGuides}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="font-bold text-2xl">{stats.totalTickets}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Check-ins</p>
                <p className="font-bold text-2xl">{stats.totalCheckIns}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending SOS</p>
                <p className="font-bold text-2xl">{stats.pendingSOS}</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="footfall" className="space-y-4">
          <TabsList>
            <TabsTrigger value="footfall">Footfall Analytics</TabsTrigger>
            <TabsTrigger value="guides">Guide Verification</TabsTrigger>
            <TabsTrigger value="sos">
              Emergency SOS
              {stats.pendingSOS > 0 && (
                <Badge variant="destructive" className="ml-2">{stats.pendingSOS}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="footfall">
            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold">Monument Footfall</h2>
                <Link to="/footfall">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Full Dashboard
                  </Button>
                </Link>
              </div>
              {footfall.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No check-in data yet.</p>
              ) : (
                <div className="space-y-3">
                  {footfall.slice(0, 5).map((f, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-48 font-medium truncate">{f.monument_name}</div>
                      <div className="flex-1">
                        <div className="bg-muted rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min((f.total_visitors / Math.max(...footfall.map(ff => ff.total_visitors))) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-right font-bold">{f.total_visitors}</div>
                    </div>
                  ))}
                  {footfall.length > 5 && (
                    <div className="text-center pt-4">
                      <Link to="/footfall">
                        <Button variant="ghost" size="sm">
                          View all {footfall.length} monuments →
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="guides">
            <div className="bg-card border rounded-xl p-6">
              <h2 className="font-display text-xl font-bold mb-4">Tour Guide Applications</h2>
              {guides.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No guide applications yet.</p>
              ) : (
                <div className="space-y-4">
                  {guides.map((guide) => (
                    <div key={guide.id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{guide.name}</h3>
                          {guide.is_verified && (
                            <BadgeCheck className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{guide.phone}</p>
                        <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                          <span>₹{guide.hourly_rate}/hr</span>
                          <span>{guide.experience_years} yrs exp</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {guide.languages.map((lang) => (
                            <span key={lang} className="text-xs bg-muted px-2 py-0.5 rounded">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {guide.is_verified ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyGuide(guide.id, false)}
                          >
                            <X className="w-4 h-4 mr-1" /> Revoke
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleVerifyGuide(guide.id, true)}
                          >
                            <Check className="w-4 h-4 mr-1" /> Verify
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sos">
            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Emergency SOS Events
                </h2>
                <Badge variant="outline">{sosEvents.length} total</Badge>
              </div>
              {sosEvents.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No SOS events yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sosEvents.map((sos) => (
                    <motion.div
                      key={sos.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        sos.status === 'pending' ? 'border-destructive/50 bg-destructive/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{getEmergencyTypeLabel(sos.emergency_type)}</h3>
                            {getStatusBadge(sos.status)}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(sos.created_at).toLocaleString()}
                            </p>
                            {sos.tourists && (
                              <p>Tourist ID: {sos.tourists.digital_tourist_id}</p>
                            )}
                            {sos.latitude && sos.longitude && (
                              <a
                                href={`https://www.google.com/maps?q=${sos.latitude},${sos.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                <MapPinIcon className="w-3 h-3" />
                                View Location ({sos.latitude.toFixed(6)}, {sos.longitude.toFixed(6)})
                              </a>
                            )}
                            {sos.battery_percent !== null && (
                              <p>Battery: {sos.battery_percent}%</p>
                            )}
                            {sos.tourists?.emergency_contact && (
                              <p>Emergency Contact: {sos.tourists.emergency_contact}</p>
                            )}
                          </div>
                          {sos.admin_notes && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-sm font-medium mb-1">Admin Notes:</p>
                              <p className="text-sm text-muted-foreground">{sos.admin_notes}</p>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSOS(sos);
                            setAdminNotes(sos.admin_notes || '');
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Update
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* SOS Update Dialog */}
      <Dialog open={!!selectedSOS} onOpenChange={() => {
        setSelectedSOS(null);
        setAdminNotes('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update SOS Status</DialogTitle>
            <DialogDescription>
              Update the status and add notes for this emergency alert
            </DialogDescription>
          </DialogHeader>
          {selectedSOS && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={selectedSOS.status}
                  onValueChange={(value) => {
                    setSelectedSOS({ ...selectedSOS, status: value as any });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="admin-notes">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about the response or resolution..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedSOS(null);
                    setAdminNotes('');
                  }}
                  disabled={updatingStatus}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (selectedSOS.status === 'responded' || selectedSOS.status === 'resolved') {
                      handleUpdateSOSStatus(selectedSOS.id, selectedSOS.status);
                    } else {
                      handleUpdateSOSStatus(selectedSOS.id, 'responded');
                    }
                  }}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
