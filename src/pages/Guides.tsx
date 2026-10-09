import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Languages, Star, Search, Filter, BadgeCheck, IndianRupee } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Link } from 'react-router-dom';
import { getVerifiedGuides, type Guide } from '@/lib/guideStorage';

interface GuideDisplay {
  id: string;
  name: string;
  languages: string[];
  hourly_rate: number;
  experience_years: number;
  avg_rating: number | null;
  total_ratings: number | null;
  is_verified: boolean;
  bio: string | null;
  monuments: string[];
  city?: string;
}

interface Monument {
  id: string;
  name: string;
  city: string;
}

export default function Guides() {
  const [guides, setGuides] = useState<GuideDisplay[]>([]);
  const [filteredGuides, setFilteredGuides] = useState<GuideDisplay[]>([]);
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [guideMonuments, setGuideMonuments] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonument, setSelectedMonument] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  const [cities, setCities] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    
    // Listen for storage changes to update guides in real-time
    const handleStorageChange = () => {
      fetchData();
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes (since storage event only fires in other tabs)
    const interval = setInterval(fetchData, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    filterGuides();
  }, [guides, guideMonuments, searchTerm, selectedMonument, selectedCity, selectedLanguage]);

  const fetchData = async () => {
    // Fetch verified guides from localStorage
    const verifiedGuides = getVerifiedGuides();
    
    // Convert to display format
    const guidesData: GuideDisplay[] = verifiedGuides.map((g: Guide) => ({
      id: g.id,
      name: g.name,
      languages: g.languages,
      hourly_rate: g.hourlyRate,
      experience_years: g.experienceYears,
      avg_rating: null, // Not stored in localStorage
      total_ratings: null, // Not stored in localStorage
      is_verified: g.verified,
      bio: g.bio || null,
      monuments: g.monuments,
      city: g.city,
    }));

    // Fetch monuments from Supabase for display
    try {
      const { data: monumentsData, error: monumentsError } = await supabase
      .from('monuments')
      .select('id, name, city');

      if (monumentsError) {
        console.error('Error fetching monuments for guides:', monumentsError);
      }

    if (guidesData) {
      setGuides(guidesData);
      
      // Extract unique languages
      const allLanguages = new Set<string>();
      guidesData.forEach(g => g.languages.forEach(l => allLanguages.add(l)));
      setLanguages([...allLanguages]);
      
      // Set guide-monument mappings
      const mappings: Record<string, string[]> = {};
      guidesData.forEach(g => {
        mappings[g.id] = g.monuments;
      });
      setGuideMonuments(mappings);
    }

    if (monumentsData) {
      setMonuments(monumentsData);
      const uniqueCities = [...new Set(monumentsData.map(m => m.city))];
      // Also add cities from guides
      guidesData.forEach(g => {
        if (g.city && !uniqueCities.includes(g.city)) {
          uniqueCities.push(g.city);
        }
      });
      setCities(uniqueCities);
    }
    } catch (err) {
      console.error('Unexpected error in fetchData:', err);
    } finally {
    setLoading(false);
    }
  };

  const filterGuides = () => {
    let filtered = guides;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.languages.some(l => l.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Monument filter
    if (selectedMonument && selectedMonument !== 'all') {
      filtered = filtered.filter(g => 
        guideMonuments[g.id]?.includes(selectedMonument)
      );
    }

    // City filter
    if (selectedCity && selectedCity !== 'all') {
      const cityMonumentIds = monuments.filter(m => m.city === selectedCity).map(m => m.id);
      filtered = filtered.filter(g => 
        guideMonuments[g.id]?.some(mId => cityMonumentIds.includes(mId))
      );
    }

    // Language filter
    if (selectedLanguage && selectedLanguage !== 'all') {
      filtered = filtered.filter(g => 
        g.languages.includes(selectedLanguage)
      );
    }

    setFilteredGuides(filtered);
  };

  const getGuideMonumentNames = (guideId: string) => {
    const monumentIds = guideMonuments[guideId] || [];
    const names = monuments.filter(m => monumentIds.includes(m.id)).map(m => m.name);
    // If monument not found in Supabase, return the ID as fallback
    return names.length > 0 ? names : monumentIds;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMonument('all');
    setSelectedCity('all');
    setSelectedLanguage('all');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                Tour Guides
              </h1>
              <p className="text-muted-foreground mt-1">
                Find verified guides for your monument visits
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card border rounded-xl p-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search guides..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedMonument} onValueChange={setSelectedMonument}>
                <SelectTrigger>
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Monument" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Monuments</SelectItem>
                  {monuments.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <Languages className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {languages.map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredGuides.length} verified guides
          </p>

          {/* Guides Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border rounded-xl p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredGuides.length === 0 ? (
            <div className="bg-card border rounded-xl p-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Guides Found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuides.map((guide, index) => (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/guides/${guide.id}`}>
                    <div className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all group h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                          {guide.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                              {guide.name}
                            </h3>
                            {guide.is_verified && (
                              <BadgeCheck className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {guide.experience_years} years experience
                          </p>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 fill-secondary text-secondary" />
                        <span className="font-semibold">
                          {guide.avg_rating?.toFixed(1) || 'New'}
                        </span>
                        {guide.total_ratings && guide.total_ratings > 0 && (
                          <span className="text-sm text-muted-foreground">
                            ({guide.total_ratings} reviews)
                          </span>
                        )}
                      </div>

                      {/* Hourly Rate */}
                      <div className="flex items-center gap-2 mb-3">
                        <IndianRupee className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">₹{guide.hourly_rate}</span>
                        <span className="text-sm text-muted-foreground">/ hour</span>
                      </div>

                      {/* Languages */}
                      <div className="flex items-center gap-2 mb-3">
                        <Languages className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {guide.languages.slice(0, 3).map(lang => (
                            <Badge key={lang} variant="outline" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                          {guide.languages.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{guide.languages.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Monuments */}
                      {getGuideMonumentNames(guide.id).length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Available at:</p>
                          <div className="flex flex-wrap gap-1">
                            {getGuideMonumentNames(guide.id).slice(0, 2).map(name => (
                              <Badge key={name} className="text-xs bg-primary/10 text-primary">
                                {name}
                              </Badge>
                            ))}
                            {getGuideMonumentNames(guide.id).length > 2 && (
                              <Badge className="text-xs bg-primary/10 text-primary">
                                +{getGuideMonumentNames(guide.id).length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
