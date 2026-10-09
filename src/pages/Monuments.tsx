import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, IndianRupee, Users, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import { getMonumentImageUrl } from '@/lib/monumentImages';
import { getAllCities, getAllCategories, type TouristPlaceCategory } from '@/data/rajasthanTouristPlaces';
import { staticMonuments } from '@/data/staticTravelData';

interface Monument {
  id: string;
  name: string;
  city: string;
  state: string;
  description: string | null;
  category: string | null;
  indian_price: number;
  foreign_price: number;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default function Monuments() {
  const [monuments, setMonuments] = useState<Monument[]>(staticMonuments);
  const [search, setSearch] = useState('');
  const [selectedMonument, setSelectedMonument] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const cities = getAllCities();
  const categories = getAllCategories();

  const filteredMonuments = monuments.filter(m => {
    const matchesSearch = !search || 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.city.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCity = selectedCity === 'all' || m.city === selectedCity;
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    
    return matchesSearch && matchesCity && matchesCategory;
  });

  const handleMonumentClick = (monument: { id: string }) => {
    setSelectedMonument(monument.id);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">Monuments of Rajasthan</h1>
              <p className="text-muted-foreground mt-1">Explore historic sites across the state</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search monuments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              </div>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full md:w-48">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-4 max-h-[680px] overflow-y-auto pr-2">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading monuments...</div>
              ) : filteredMonuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">No monuments found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                filteredMonuments.map((monument) => (
                  <motion.div
                    key={monument.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`bg-card border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedMonument === monument.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedMonument(monument.id)}
                  >
                    <div className="flex gap-4">
                      {getMonumentImageUrl(monument.name, monument.image_url) ? (
                        <img
                          src={getMonumentImageUrl(monument.name, monument.image_url)!}
                          alt={monument.name}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-lg">{monument.name}</h3>
                          {monument.category && (
                            <Badge variant="outline" className="text-xs">
                              {monument.category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {monument.city}, {monument.state}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" /> Indian: ₹{monument.indian_price}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> Foreign: ₹{monument.foreign_price}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="mt-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/monuments/${monument.id}`);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
