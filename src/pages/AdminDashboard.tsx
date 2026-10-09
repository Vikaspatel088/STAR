import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MapPin, Languages, Calendar, Check, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { getPendingGuides, updateGuideStatus, deleteGuide, type Guide } from '@/lib/guideStorage';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAIL = 'admin@rajasthan.gov.in';

// Case-insensitive email check
const isAdminEmail = (email: string | undefined): boolean => {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
};

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [monuments, setMonuments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && user && !isAdminEmail(user.email)) {
      toast({
        title: 'Access Denied',
        description: `Only administrators can access this page. Your email: ${user.email || 'not found'}`,
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    if (user && isAdminEmail(user.email)) {
      fetchData();
    }
  }, [user, authLoading, navigate, toast]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch pending guides from localStorage
    const pendingGuides = getPendingGuides();
    setGuides(pendingGuides);

    // Fetch monuments from Supabase for display
    const { data: monumentsData } = await supabase
      .from('monuments')
      .select('id, name');
    
    if (monumentsData) {
      const monumentsMap: Record<string, string> = {};
      monumentsData.forEach(m => {
        monumentsMap[m.id] = m.name;
      });
      setMonuments(monumentsMap);
    }

    setLoading(false);
  };

  const handleApprove = (guideId: string) => {
    const success = updateGuideStatus(guideId, 'approved', true);
    if (success) {
      toast({
        title: 'Guide Approved',
        description: 'The guide is now visible to tourists.',
      });
      fetchData(); // Refresh the list
    } else {
      toast({
        title: 'Error',
        description: 'Failed to approve guide.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = (guideId: string) => {
    const success = deleteGuide(guideId);
    if (success) {
      toast({
        title: 'Guide Rejected',
        description: 'The guide application has been removed.',
      });
      fetchData(); // Refresh the list
    } else {
      toast({
        title: 'Error',
        description: 'Failed to reject guide.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMonumentNames = (monumentIds: string[]) => {
    return monumentIds.map(id => monuments[id] || 'Unknown').join(', ');
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!user || !isAdminEmail(user.email)) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Tour Guide Verification</p>
              </div>
            </div>
            <div className="mt-4 bg-muted/50 border rounded-lg p-3 text-sm">
              <p className="font-medium text-foreground">Demo Admin Panel – Verification Workflow Simulation</p>
              <p className="text-muted-foreground mt-1">
                This is a frontend-only simulation. All data is stored in browser localStorage.
              </p>
              {user && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Logged in as: <span className="font-mono">{user.email}</span>
                </p>
              )}
            </div>
          </div>

          {/* Pending Guides List */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Pending Tour Guide Applications
              </h2>
              <Badge variant="outline">{guides.length} pending</Badge>
            </div>

            {guides.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No guides pending verification</h3>
                <p className="text-muted-foreground">
                  All tour guide applications have been processed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {guides.map((guide) => (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column - Guide Info */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{guide.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {guide.city || 'City not specified'}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Languages className="w-4 h-4" />
                            Languages
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {guide.languages.map((lang) => (
                              <Badge key={lang} variant="outline" className="text-xs">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-2">Monuments</p>
                          <p className="text-sm text-muted-foreground">
                            {getMonumentNames(guide.monuments)}
                          </p>
                        </div>
                      </div>

                      {/* Right Column - Details & Actions */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Registered: {formatDate(guide.registrationDate)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Phone</p>
                            <p className="font-medium">{guide.phone}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Experience</p>
                            <p className="font-medium">{guide.experienceYears} years</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Hourly Rate</p>
                            <p className="font-medium">₹{guide.hourlyRate}/hr</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <Badge variant="outline" className="text-xs">
                              {guide.status}
                            </Badge>
                          </div>
                        </div>

                        {guide.bio && (
                          <div>
                            <p className="text-sm font-medium mb-1">Bio</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{guide.bio}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleApprove(guide.id)}
                            className="flex-1"
                            size="sm"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(guide.id)}
                            variant="destructive"
                            className="flex-1"
                            size="sm"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

