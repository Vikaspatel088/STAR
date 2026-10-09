import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { SOSButton } from '@/components/sos/SOSButton';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { touristProfile } = useAuth();
  const location = useLocation();
  const routeTheme = location.pathname.startsWith('/hotels')
    ? 'route-hotels'
    : location.pathname.startsWith('/monuments')
      ? 'route-monuments'
      : location.pathname.startsWith('/guides')
        ? 'route-guides'
        : location.pathname.startsWith('/chat')
          ? 'route-chat'
          : location.pathname.startsWith('/dashboard')
            ? 'route-dashboard'
            : 'route-default';

  return (
    <div className="app-shell min-h-screen bg-background">
      <Navbar />
      <main className={`page-surface min-h-[calc(100vh-4rem)] pt-16 ${routeTheme}`}>
        {children}
      </main>
      {touristProfile && <SOSButton touristId={touristProfile.id} />}
    </div>
  );
}
