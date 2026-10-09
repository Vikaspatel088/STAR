import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Monuments from "./pages/Monuments";
import MonumentDetail from "./pages/MonumentDetail";
import GuideProfile from "./pages/GuideProfile";
import TouristRegister from "./pages/register/TouristRegister";
import GuideRegister from "./pages/register/GuideRegister";
import OrganisationRegister from "./pages/register/OrganisationRegister";
import NotFound from "./pages/NotFound";
import Hotels from "./pages/Hotels";
import Guides from "./pages/Guides";
import Tickets from "./pages/Tickets";
import ExploreMap from "./pages/ExploreMap";
import SafetyChatPage from "./pages/SafetyChat";
import SafetyChat from "./components/chat/SafetyChat";
import AdminDashboard from "./pages/AdminDashboard";
import FootfallDashboard from "./pages/FootfallDashboard";
import { useLocation } from "react-router-dom";

const queryClient = new QueryClient();

// Component to conditionally render SafetyChat floating button
const ConditionalSafetyChat = () => {
  const location = useLocation();
  // Only show floating button when not on the chat page
  if (location.pathname === '/chat') {
    return null;
  }
  return <SafetyChat floating={true} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/monuments" element={<Monuments />} />
            <Route path="/monuments/:id" element={<MonumentDetail />} />
            <Route path="/guides/:id" element={<GuideProfile />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/hotels" element={<Hotels />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/explore-map" element={<ExploreMap />} />
            <Route path="/chat" element={<SafetyChatPage />} />
            <Route path="/register/tourist" element={<TouristRegister />} />
            <Route path="/register/tour_guide" element={<GuideRegister />} />
            <Route path="/register/organisation" element={<OrganisationRegister />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/footfall" element={<FootfallDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ConditionalSafetyChat />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
