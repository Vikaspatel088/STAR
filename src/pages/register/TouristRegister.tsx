import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, User, Phone, Users, ArrowLeft, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateDigitalTouristId, hashIdData } from '@/lib/hash';
import { Link } from 'react-router-dom';

export default function TouristRegister() {
  const [touristType, setTouristType] = useState<'indian' | 'foreign'>('indian');
  const [idHint, setIdHint] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [tripType, setTripType] = useState<'solo' | 'group'>('solo');
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const digitalTouristId = generateDigitalTouristId(user.id, Date.now());
      const idHash = hashIdData(idHint);

      const { error } = await supabase.from('tourists').insert({
        user_id: user.id,
        digital_tourist_id: digitalTouristId,
        id_hash: idHash,
        tourist_type: touristType,
        emergency_contact: emergencyContact,
        trip_type: tripType,
      });

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Registration Complete!',
        description: `Your Digital Tourist ID: ${digitalTouristId}`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete registration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Link to="/auth" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Digital Tourist ID</h1>
            <p className="text-sm text-muted-foreground">Complete your registration</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-base font-semibold">Tourist Type</Label>
              <RadioGroup
                value={touristType}
                onValueChange={(v) => setTouristType(v as 'indian' | 'foreign')}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="indian" id="indian" />
                  <Label htmlFor="indian" className="cursor-pointer">Indian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="foreign" id="foreign" />
                  <Label htmlFor="foreign" className="cursor-pointer">Foreign</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="idHint">
                {touristType === 'indian' ? 'Aadhaar Last 4 Digits' : 'Passport Number'}
              </Label>
              <div className="relative mt-1">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="idHint"
                  type="text"
                  value={idHint}
                  onChange={(e) => setIdHint(e.target.value)}
                  placeholder={touristType === 'indian' ? 'Last 4 digits only' : 'Passport number'}
                  className="pl-10"
                  required
                  maxLength={touristType === 'indian' ? 4 : 20}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This is hashed and stored securely. We never store your actual ID.
              </p>
            </div>

            <div>
              <Label htmlFor="emergency">Emergency Contact Number</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="emergency"
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold">Trip Type</Label>
              <RadioGroup
                value={tripType}
                onValueChange={(v) => setTripType(v as 'solo' | 'group')}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="solo" id="solo" />
                  <Label htmlFor="solo" className="cursor-pointer flex items-center gap-1">
                    <User className="w-4 h-4" /> Solo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="group" id="group" />
                  <Label htmlFor="group" className="cursor-pointer flex items-center gap-1">
                    <Users className="w-4 h-4" /> Group
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Generating ID...' : 'Complete Registration'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
