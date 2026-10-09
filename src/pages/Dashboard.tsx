import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import TouristDashboard from '@/components/dashboard/TouristDashboard';
import GuideDashboard from '@/components/dashboard/GuideDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import OrganisationDashboard from '@/components/dashboard/OrganisationDashboard';
import { Layout } from '@/components/layout/Layout';

export default function Dashboard() {
  const { user, userRole, loading, touristProfile, guideProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  // Handle case where userRole is null or undefined
  if (!userRole) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16 text-muted-foreground">
            Loading user profile...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {userRole === 'admin' && <AdminDashboard />}
      {userRole === 'tourist' && <TouristDashboard />}
      {userRole === 'tour_guide' && <GuideDashboard />}
      {userRole === 'organisation' && <OrganisationDashboard />}
      {!['admin', 'tourist', 'tour_guide', 'organisation'].includes(userRole) && (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              Unknown user role: {userRole}
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact support if this issue persists.
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
}
