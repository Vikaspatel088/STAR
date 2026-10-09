import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff, Globe2, Lock,
  Mail, MapPin, Shield, Sparkles, Star, User, Users, Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type RoleType = 'tourist' | 'tour_guide' | 'organisation';

const highlights = [
  { icon: Shield, text: 'Trusted travel safety, wherever you go' },
  { icon: MapPin, text: 'Discover Rajasthan like a local' },
  { icon: Sparkles, text: 'One beautiful space for every journey' },
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin',
  );
  const [selectedRole, setSelectedRole] = useState<RoleType>('tourist');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && mode === 'signin') navigate('/dashboard');
  }, [user, mode, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const result = mode === 'signup'
      ? await signUp(email, password, fullName)
      : await signIn(email, password);

    if (result.error) {
      toast({ title: 'Almost there', description: result.error.message, variant: 'destructive' });
    } else if (mode === 'signup') {
      const route = selectedRole === 'tour_guide' ? 'tour_guide' : selectedRole;
      toast({ title: 'Your STAR pass is ready ✨', description: 'Welcome to safer, smarter travel.' });
      navigate(`/register/${route}`);
    } else {
      toast({ title: 'Welcome back, explorer ✨', description: 'Your Rajasthan dashboard is ready.' });
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const roleOptions = [
    { value: 'tourist', label: 'Tourist', icon: User },
    { value: 'tour_guide', label: 'Guide', icon: MapPin },
    { value: 'organisation', label: 'Organisation', icon: Briefcase },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#07152f] text-white lg:grid lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden overflow-hidden lg:flex">
        <img
          src="https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1800&q=85"
          alt="Golden Rajasthan architecture"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#07152f_4%,rgba(7,21,47,.72)_48%,rgba(13,65,92,.35))]" />
        <div className="absolute -left-32 top-16 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-amber-400/20 blur-3xl animate-float" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          <Link to="/" className="flex w-fit items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 shadow-2xl ring-1 ring-white/30 backdrop-blur-xl">
              <Shield className="h-6 w-6 text-amber-300" />
            </span>
            <span>
              <strong className="block font-display text-xl tracking-[.2em]">STAR</strong>
              <small className="text-white/60">Tourism Safety</small>
            </span>
          </Link>

          <div className="max-w-xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-amber-200 backdrop-blur-md">
                <Globe2 className="h-4 w-4" /> Rajasthan, reimagined
              </div>
              <h1 className="font-display text-6xl font-bold leading-[.98] xl:text-7xl">
                Your journey deserves a <span className="text-amber-300">safety net.</span>
              </h1>
              <p className="mt-7 max-w-lg text-lg leading-8 text-white/70">
                A smarter way to explore royal cities, hidden gems, and unforgettable stories across Rajasthan.
              </p>
              <div className="mt-10 space-y-4">
                {highlights.map(({ icon: Icon, text }, index) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: .25 + index * .12 }}
                    className="flex items-center gap-3 text-sm text-white/80"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300/15 text-cyan-200">
                      <Icon className="h-4 w-4" />
                    </span>
                    {text}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/50">
            <Star className="h-4 w-4 fill-amber-300 text-amber-300" /> Built for curious people who travel with confidence
          </div>
        </div>
      </section>

      <section className="pattern-dots relative flex min-h-screen items-center justify-center bg-[#f8fafc] px-5 py-10 text-slate-900 sm:px-10">
        <div className="absolute right-10 top-10 h-48 w-48 rounded-full bg-cyan-200/40 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 24, scale: .98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: .5 }}
          className="relative w-full max-w-md"
        >
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <div className="mb-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#07152f] shadow-xl shadow-cyan-900/20">
              <Shield className="h-7 w-7 text-amber-300" />
            </div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[.2em] text-cyan-700">Welcome to STAR</p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-slate-950">
              {mode === 'signup' ? 'Start your story.' : 'Welcome back.'}
            </h2>
            <p className="mt-3 leading-6 text-slate-500">
              {mode === 'signup' ? 'Create your free demo pass in seconds.' : 'Your next Rajasthan memory is waiting.'}
            </p>
          </div>

          <div className="mb-6 flex rounded-xl bg-slate-200/70 p-1">
            {(['signin', 'signup'] as const).map((tab) => (
              <button key={tab} type="button" onClick={() => setMode(tab)} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${mode === tab ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
                {tab === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white bg-white/85 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-8">
            {mode === 'signup' && (
              <>
                <div>
                  <Label htmlFor="fullName">Your name</Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Aarav Sharma" className="h-12 rounded-xl bg-slate-50 pl-10" required />
                  </div>
                </div>
                <div>
                  <Label>I'm joining as</Label>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {roleOptions.map(({ value, label, icon: Icon }) => (
                      <button key={value} type="button" onClick={() => setSelectedRole(value as RoleType)} className={`rounded-xl border p-3 text-center transition-all ${selectedRole === value ? 'border-cyan-600 bg-cyan-50 text-cyan-800 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-cyan-300'}`}>
                        <Icon className="mx-auto mb-1 h-4 w-4" /><span className="text-xs font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Gmail address</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" className="h-12 rounded-xl bg-slate-50 pl-10" required />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between"><Label htmlFor="password">Password</Label><span className="text-xs text-slate-400">Any password works</span></div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter anything memorable" className="h-12 rounded-xl bg-slate-50 pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="group h-12 w-full rounded-xl bg-[#07152f] text-white shadow-xl shadow-cyan-900/20 transition-all hover:-translate-y-0.5 hover:bg-cyan-800">
              {loading ? 'Preparing your STAR pass...' : mode === 'signup' ? 'Create my STAR pass' : 'Enter STAR'} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <div className="flex items-center justify-center gap-2 pt-1 text-xs text-slate-400"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Demo mode · no email verification required</div>
          </form>
        </motion.div>
      </section>
    </main>
  );
}
