import { motion } from 'framer-motion';
import { Map, MapPin } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import MonumentMap from '@/components/map/MonumentMap';
import { useNavigate } from 'react-router-dom';

interface Monument {
  id: string;
  name: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

export default function ExploreMap() {
  const navigate = useNavigate();

  const handleMonumentClick = (monument: Monument) => {
    navigate(`/monuments/${monument.id}`);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                <Map className="w-8 h-8 text-primary" />
                Explore Rajasthan
              </h1>
              <p className="text-muted-foreground mt-1">
                Interactive map of heritage monuments
              </p>
            </div>
          </div>

          {/* Map Legend */}
          <div className="bg-card border rounded-xl p-4 mb-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6">
                  <svg viewBox="0 0 24 24" fill="#c9a227" stroke="#ffffff" strokeWidth="1.5">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <span className="text-sm">Heritage Monument</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Click on any marker to view monument details and buy tickets
              </p>
            </div>
          </div>

          {/* Full Size Map */}
          <MonumentMap 
            onMonumentClick={handleMonumentClick} 
            height="600px"
          />

          {/* Instructions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Click Markers</p>
                  <p className="text-sm text-muted-foreground">View monument info</p>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Map className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold">Zoom & Pan</p>
                  <p className="text-sm text-muted-foreground">Explore the region</p>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">Navigate</p>
                  <p className="text-sm text-muted-foreground">Use controls on map</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
