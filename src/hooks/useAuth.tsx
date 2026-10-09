import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';

interface DemoProfile {
  id: string;
  user_id: string;
  name: string;
  full_name: string;
  digital_tourist_id: string;
  xp_points: number;
  level: number;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  touristProfile: DemoProfile | null;
  guideProfile: null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DEMO_SESSION_KEY = 'star-demo-session';

function createDemoUser(email: string, fullName = 'STAR Explorer'): User {
  const id = `demo-${btoa(email).replace(/[^a-z0-9]/gi, '').slice(0, 18).toLowerCase()}`;
  return {
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    app_metadata: { provider: 'demo' },
    user_metadata: { full_name: fullName },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    identities: [],
    factors: [],
  };
}

function createDemoProfile(user: User): DemoProfile {
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'STAR Explorer';
  return {
    id: `profile-${user.id}`,
    user_id: user.id,
    name,
    full_name: name,
    digital_tourist_id: `STAR-${user.id.slice(-6).toUpperCase()}`,
    xp_points: 240,
    level: 2,
    phone: 'Not added yet',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [touristProfile, setTouristProfile] = useState<DemoProfile | null>(null);

  const activateSession = (nextUser: User) => {
    const nextSession = {
      access_token: `demo-token-${nextUser.id}`,
      refresh_token: `demo-refresh-${nextUser.id}`,
      expires_in: 60 * 60 * 24 * 30,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      token_type: 'bearer',
      user: nextUser,
    } as Session;
    setUser(nextUser);
    setSession(nextSession);
    setTouristProfile(createDemoProfile(nextUser));
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(nextUser));
  };

  useEffect(() => {
    const savedUser = localStorage.getItem(DEMO_SESSION_KEY);
    if (savedUser) {
      try {
        activateSession(JSON.parse(savedUser) as User);
      } catch {
        localStorage.removeItem(DEMO_SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  const validateCredentials = (email: string, password: string) => {
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return new Error('Please use a Gmail address for demo access.');
    }
    if (!password.trim()) {
      return new Error('Please enter any password to continue.');
    }
    return null;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const error = validateCredentials(email, password);
    if (error) return { error };
    activateSession(createDemoUser(email.toLowerCase().trim(), fullName || 'STAR Explorer'));
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const error = validateCredentials(normalizedEmail, password);
    if (error) return { error };
    activateSession(createDemoUser(normalizedEmail));
    return { error: null };
  };

  const signOut = async () => {
    localStorage.removeItem(DEMO_SESSION_KEY);
    setUser(null);
    setSession(null);
    setTouristProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      userRole: user ? 'tourist' : null,
      touristProfile,
      guideProfile: null,
      signUp,
      signIn,
      signOut,
      refreshProfile: async () => undefined,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
