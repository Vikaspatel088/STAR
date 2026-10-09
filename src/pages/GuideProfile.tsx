import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Clock, Languages, BadgeCheck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';

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
  phone: string;
}

interface Monument {
  id: string;
  name: string;
  city: string;
}

export default function GuideProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, touristProfile, userRole } = useAuth();
  const { toast } = useToast();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Rating form
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [behaviourRating, setBehaviourRating] = useState(5);
  const [languageRating, setLanguageRating] = useState(5);
  const [responsibilityRating, setResponsibilityRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchGuide();
    }
  }, [id]);

  const fetchGuide = async () => {
    try {
      const { data: guideData, error: guideError } = await supabase
      .from('tour_guides')
      .select('*')
      .eq('id', id)
      .single();

      if (guideError) {
        console.error('Error fetching guide:', guideError);
        toast({
          title: 'Error',
          description: 'Failed to load guide profile. Please try again.',
          variant: 'destructive',
        });
      }

    if (guideData) setGuide(guideData);

    // Fetch monuments
      const { data: monumentData, error: monumentError } = await supabase
      .from('guide_monuments')
      .select(`
        monuments (id, name, city)
      `)
      .eq('guide_id', id);

      if (monumentError) {
        console.error('Error fetching guide monuments:', monumentError);
        // Don't show toast for monuments error as it's not critical
      }

    if (monumentData) {
      const mons = monumentData.map(d => d.monuments).filter((m): m is Monument => m !== null);
      setMonuments(mons);
    }
    } catch (err) {
      console.error('Unexpected error fetching guide:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
    setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!user || !touristProfile || !guide) {
      toast({
        title: 'Error',
        description: 'You must be logged in as a tourist to rate guides.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Insert rating
      const { error: ratingError } = await supabase.from('guide_ratings').insert({
        guide_id: guide.id,
        tourist_id: touristProfile.id,
        behaviour_rating: behaviourRating,
        language_rating: languageRating,
        responsibility_rating: responsibilityRating,
        comment: comment || null,
      });

      if (ratingError) throw ratingError;

      // Calculate new average rating
      const { data: ratings } = await supabase
        .from('guide_ratings')
        .select('behaviour_rating, language_rating, responsibility_rating')
        .eq('guide_id', guide.id);

      if (ratings && ratings.length > 0) {
        const totalRatings = ratings.length;
        const avgRating = ratings.reduce((sum, r) => {
          return sum + (r.behaviour_rating + r.language_rating + r.responsibility_rating) / 3;
        }, 0) / totalRatings;

        await supabase
          .from('tour_guides')
          .update({ avg_rating: avgRating, total_ratings: totalRatings })
          .eq('id', guide.id);
      }

      toast({
        title: 'Rating Submitted!',
        description: 'Thank you for your feedback.',
      });

      setShowRatingForm(false);
      fetchGuide();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit rating',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-6 h-6 ${
              star <= value ? 'text-secondary fill-secondary' : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!guide) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16 text-muted-foreground">Guide not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Guide Profile */}
            <div className="lg:col-span-2">
              <div className="bg-card border rounded-xl p-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {guide.avatar_url ? (
                      <img src={guide.avatar_url} alt={guide.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-muted-foreground">
                        {guide.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h1 className="font-display text-2xl font-bold">{guide.name}</h1>
                      {guide.is_verified && (
                        <BadgeCheck className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-secondary fill-secondary" />
                        {guide.avg_rating?.toFixed(1) || 'N/A'} ({guide.total_ratings || 0} reviews)
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {guide.experience_years} years experience
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Languages</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {guide.languages.map((lang) => (
                          <span key={lang} className="bg-muted px-3 py-1 rounded-full text-sm">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    {guide.bio && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">About</p>
                        <p className="mt-1">{guide.bio}</p>
                      </div>
                    )}

                    <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Hourly Rate</p>
                      <p className="text-2xl font-bold text-primary">₹{guide.hourly_rate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monuments */}
              <div className="mt-6">
                <h2 className="font-display text-lg font-bold mb-4">Assigned Monuments</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {monuments.map((monument) => (
                    <div
                      key={monument.id}
                      className="bg-card border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => navigate(`/monuments/${monument.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-semibold">{monument.name}</p>
                          <p className="text-sm text-muted-foreground">{monument.city}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Rate Guide */}
            <div>
              <div className="bg-card border rounded-xl p-6 sticky top-24">
                <h2 className="font-display text-lg font-bold mb-4">Rate This Guide</h2>
                
                {userRole !== 'tourist' || !touristProfile ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm mb-4">
                      Only registered tourists can rate guides.
                    </p>
                    <Button variant="outline" onClick={() => navigate('/auth?mode=signup')}>
                      Register as Tourist
                    </Button>
                  </div>
                ) : showRatingForm ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Behaviour</Label>
                      <StarRating value={behaviourRating} onChange={setBehaviourRating} />
                    </div>
                    <div>
                      <Label>Language Skills</Label>
                      <StarRating value={languageRating} onChange={setLanguageRating} />
                    </div>
                    <div>
                      <Label>Responsibility</Label>
                      <StarRating value={responsibilityRating} onChange={setResponsibilityRating} />
                    </div>
                    <div>
                      <Label>Comment (Optional)</Label>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowRatingForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleSubmitRating}
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting...' : 'Submit Rating'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button className="w-full" onClick={() => setShowRatingForm(true)}>
                    <Star className="w-4 h-4 mr-2" /> Write a Review
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
