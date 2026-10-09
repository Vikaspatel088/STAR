import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, User, Phone, MapPin, ArrowLeft, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { addGuide } from '@/lib/guideStorage';

const LANGUAGES = ['Hindi', 'English', 'French', 'German', 'Spanish', 'Japanese', 'Chinese', 'Russian', 'Arabic', 'Rajasthani'];

export default function GuideRegister() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [bio, setBio] = useState('');
  const [monuments, setMonuments] = useState<{ id: string; name: string; city?: string }[]>([]);
  const [selectedMonuments, setSelectedMonuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchMonuments();
  }, [user, navigate]);

  const fetchMonuments = async () => {
    const { data } = await supabase.from('monuments').select('id, name, city').order('name');
    if (data) setMonuments(data);
  };

  const handleLanguageToggle = (lang: string) => {
    setLanguages(prev =>
      prev.includes(lang)
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  const handleMonumentToggle = (monumentId: string) => {
    setSelectedMonuments(prev =>
      prev.includes(monumentId)
        ? prev.filter(m => m !== monumentId)
        : [...prev, monumentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (languages.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one language', variant: 'destructive' });
      return;
    }

    if (selectedMonuments.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one monument', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      // Get city from monuments (use first monument's city)
      const cityMonument = monuments.find(m => selectedMonuments.includes(m.id));
      const city = cityMonument?.city || 'Unknown';

      // Store guide in localStorage with pending status
      addGuide({
        userId: user.id,
        name,
        phone,
        languages,
        hourlyRate: parseFloat(hourlyRate),
        experienceYears: parseInt(experienceYears),
        bio: bio || '',
        monuments: selectedMonuments,
        city,
      });

      // Update user role to tour_guide (keep existing Supabase call for compatibility)
      await supabase.from('user_roles').update({ role: 'tour_guide' }).eq('user_id', user.id);

      await refreshProfile();

      toast({
        title: 'Application Submitted!',
        description: 'Your account is pending admin verification.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto"
      >
        <Link to="/auth" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <MapPin className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Tour Guide Registration</h1>
            <p className="text-sm text-muted-foreground">Apply to become a verified guide</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rate">Hourly Rate (₹)</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="rate"
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="500"
                    className="pl-10"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <div className="relative mt-1">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="experience"
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="3"
                    className="pl-10"
                    required
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Languages Spoken</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageToggle(lang)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      languages.includes(lang)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Assigned Monuments</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {monuments.map(monument => (
                  <label
                    key={monument.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedMonuments.includes(monument.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Checkbox
                      checked={selectedMonuments.includes(monument.id)}
                      onCheckedChange={() => handleMonumentToggle(monument.id)}
                    />
                    <span className="text-sm">{monument.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Short Bio (Optional)</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell tourists about your experience and expertise..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="bg-secondary/50 rounded-lg p-4 text-sm">
              <p className="font-medium text-secondary-foreground">Verification Required</p>
              <p className="text-muted-foreground mt-1">
                Your account is pending admin verification. You will be notified once your profile is reviewed.
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
