import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, MapPin, Ticket, Users, AlertTriangle, Award, Hotel, MessageCircle, ArrowRight, CheckCircle, Compass, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';

const features = [
  { icon: Shield, title: 'Safety First', description: 'Comprehensive safety features and emergency support for all tourists' },
  { icon: Ticket, title: 'Smart Ticketing', description: 'QR-based tickets with real-time footfall tracking' },
  { icon: AlertTriangle, title: 'SOS Emergency', description: 'One-tap emergency alerts with location sharing' },
  { icon: Users, title: 'Verified Guides', description: 'Government-verified tour guides you can trust' },
  { icon: Award, title: 'XP & Rewards', description: 'Earn points and unlock exclusive coupons' },
  { icon: Hotel, title: 'Hotel Search', description: 'Find trusted accommodations across Rajasthan' },
];

const stats = [
  { value: '10+', label: 'Heritage Sites' },
  { value: '500+', label: 'Verified Guides' },
  { value: '24/7', label: 'Safety Support' },
  { value: '100%', label: 'Privacy Safe' },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero-collage relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(52,211,153,.25),transparent_24rem)]" />
        <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl animate-float" />
        <div className="absolute inset-0 pattern-rajasthan opacity-30" />
        
        <div className="container relative z-10 mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-white/10 px-4 py-2 text-sm font-medium text-amber-100 shadow-lg backdrop-blur-xl">
              <Shield className="w-4 h-4 text-secondary" />
              <span>Government of Rajasthan Initiative · Your safety, elevated</span>
            </div>
            
            <h1 className="text-balance font-display text-5xl font-bold leading-[.98] text-white md:text-7xl lg:text-8xl">
              Rajasthan is calling.
              <span className="block bg-gradient-to-r from-amber-200 via-orange-300 to-cyan-200 bg-clip-text text-transparent">Answer beautifully.</span>
            </h1>
            
            <p className="mb-8 mt-7 max-w-2xl text-lg leading-8 text-white/75 md:text-xl">
              Discover palaces, deserts, flavours, and stories with a trusted digital companion built for confident travel.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="xl" className="group gap-2 rounded-2xl shadow-2xl shadow-amber-900/30">
                  Begin your journey
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/monuments">
                <Button variant="outline" size="xl" className="rounded-2xl border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20">
                  Explore the map
                </Button>
              </Link>
            </div>

            <div className="mt-12 grid max-w-2xl grid-cols-3 gap-3">
              {[
                { value: '126+', label: 'places to discover' },
                { value: '24/7', label: 'safety support' },
                { value: '01', label: 'beautiful companion' },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: .5 + index * .12 }}
                  className="hero-glass rounded-2xl p-4 text-left"
                >
                  <p className="font-display text-2xl font-bold text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-white/60">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-xs tracking-[.25em] text-white/50 md:flex">
          <ChevronDown className="h-4 w-4 animate-bounce" /> SCROLL TO EXPLORE
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border/50 bg-white/70 py-12 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="premium-card p-5 text-center"
              >
                <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-surface py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[.18em] text-accent">
              <Sparkles className="h-3.5 w-3.5" /> Designed around you
            </div>
            <h2 className="text-balance font-display text-3xl font-bold text-foreground md:text-5xl">
              One calm place for the whole journey
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              STAR provides comprehensive safety and assistance features designed for modern tourists.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="premium-card group relative overflow-hidden p-7"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-primary/20">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#07152f] py-24">
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="container relative mx-auto px-4 text-center">
          <Compass className="mx-auto mb-6 h-12 w-12 text-amber-300" />
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Explore Rajasthan Safely?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of tourists who travel with confidence using STAR.
          </p>
          <Link to="/auth?mode=signup">
            <Button variant="hero" size="xl">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              <span className="font-display font-bold text-lg">STAR</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 STAR - Government of Rajasthan. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
