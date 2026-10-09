import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  ArrowLeft,
  Filter,
  AlertCircle,
  TrendingDown,
  Activity,
  Download,
  Database
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { generateRealisticFootfallData } from '@/lib/generateFootfallData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MonumentFootfall {
  monument_id: string;
  monument_name: string;
  city: string;
  total_visitors: number;
  today_visitors: number;
  avg_daily_visitors: number;
  crowd_level: 'Low' | 'Medium' | 'High';
  peak_hour: number | null;
  least_busy_hour: number | null;
  hourly_distribution: number[];
  domestic_count: number;
  foreign_count: number;
}

interface HourlyData {
  hour: number;
  visitors: number;
}

interface DailyTrend {
  date: string;
  visitors: number;
}

interface OverallStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  activeMonuments: number;
}

const ADMIN_EMAIL = 'admin@rajasthan.gov.in';

const isAdminEmail = (email: string | undefined): boolean => {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
};

export default function FootfallDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = isAdminEmail(user?.email);
  const [monumentFootfall, setMonumentFootfall] = useState<MonumentFootfall[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    activeMonuments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'custom'>('7d');
  const [selectedMonument, setSelectedMonument] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedMonumentDetails, setSelectedMonumentDetails] = useState<MonumentFootfall | null>(null);
  const [hourlyTrend, setHourlyTrend] = useState<HourlyData[]>([]);
  const [dailyTrend, setDailyTrend] = useState<DailyTrend[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [allMonuments, setAllMonuments] = useState<Array<{ id: string; name: string; city: string }>>([]);
  const [generatingData, setGeneratingData] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    // Check if user is admin
    if (!authLoading && user && !isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can access the Footfall Dashboard.',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }
    
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, authLoading, navigate, dateRange, selectedMonument, customStartDate, customEndDate, isAdmin, toast]);

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    if (dateRange === 'today') {
      return { start: today, end: now };
    } else if (dateRange === '7d') {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      return { start, end: now };
    } else if (dateRange === '30d') {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      return { start, end: now };
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      return {
        start: new Date(customStartDate),
        end: new Date(customEndDate + 'T23:59:59'),
      };
    }
    // Default to 7 days
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    return { start, end: now };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching footfall data...');
      const { start, end } = getDateRange();
      const startISO = start.toISOString();
      const endISO = end.toISOString();
      console.log('Date range:', startISO, 'to', endISO);

      // Fetch all check-ins with monument and ticket data
      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select(`
          id,
          check_in_time,
          monument_id,
          ticket_id,
          monuments (
            id,
            name,
            city
          ),
          tickets (
            ticket_type
          )
        `)
        .gte('check_in_time', startISO)
        .lte('check_in_time', endISO)
        .order('check_in_time', { ascending: false });

      if (checkInsError) {
        console.error('Error fetching check-ins:', checkInsError);
        toast({
          title: 'Error',
          description: `Failed to fetch check-in data: ${checkInsError.message}`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Fetch all monuments
      const { data: monuments, error: monumentsError } = await supabase
        .from('monuments')
        .select('id, name, city')
        .order('name');

      if (monumentsError) {
        console.error('Error fetching monuments:', monumentsError);
        toast({
          title: 'Error',
          description: `Failed to fetch monuments: ${monumentsError.message}`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (!monuments || monuments.length === 0) {
        toast({
          title: 'No Monuments',
          description: 'No monuments found in the database',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Store all monuments for filter dropdown
      setAllMonuments(monuments);

      // Handle case when checkIns is empty array (no data)
      if (!checkIns || checkIns.length === 0) {
        console.log('No check-ins found for the selected period');
        // Still show monuments with zero visitors
        const emptyFootfall: MonumentFootfall[] = monuments.map(monument => ({
          monument_id: monument.id,
          monument_name: monument.name,
          city: monument.city,
          total_visitors: 0,
          today_visitors: 0,
          avg_daily_visitors: 0,
          crowd_level: 'Low',
          peak_hour: null,
          least_busy_hour: null,
          hourly_distribution: new Array(24).fill(0),
          domestic_count: 0,
          foreign_count: 0,
        }));
        
        setMonumentFootfall(emptyFootfall);
        setOverallStats({
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          activeMonuments: 0,
        });
        setLoading(false);
        return;
      }

      console.log(`Found ${checkIns.length} check-ins`);

      // Calculate overall stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setDate(today.getDate() - 30);

      const todayCount = checkIns.filter((c: any) => new Date(c.check_in_time) >= today).length;
      const weekCount = checkIns.filter((c: any) => new Date(c.check_in_time) >= weekAgo).length;
      const monthCount = checkIns.filter((c: any) => new Date(c.check_in_time) >= monthAgo).length;
      const activeMonumentIds = new Set(checkIns.map((c: any) => c.monument_id));
      
      setOverallStats({
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount,
        activeMonuments: activeMonumentIds.size,
      });

      // Process monument-wise footfall
      const monumentMap = new Map<string, MonumentFootfall>();
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      // Initialize all monuments
      monuments.forEach(monument => {
        monumentMap.set(monument.id, {
          monument_id: monument.id,
          monument_name: monument.name,
          city: monument.city,
          total_visitors: 0,
          today_visitors: 0,
          avg_daily_visitors: 0,
          crowd_level: 'Low',
          peak_hour: null,
          least_busy_hour: null,
          hourly_distribution: new Array(24).fill(0),
          domestic_count: 0,
          foreign_count: 0,
        });
      });

      // Process check-ins
      checkIns.forEach((checkIn: any) => {
        const monument = checkIn.monuments;
        if (!monument) return;

        const stats = monumentMap.get(monument.id);
        if (!stats) return;

        const checkInTime = new Date(checkIn.check_in_time);
        const hour = checkInTime.getHours();

        stats.total_visitors++;
        stats.hourly_distribution[hour]++;

        if (checkInTime >= todayDate) {
          stats.today_visitors++;
        }

        // Count domestic vs foreign
        const ticketType = checkIn.tickets?.ticket_type;
        if (ticketType === 'indian') {
          stats.domestic_count++;
        } else if (ticketType === 'foreign') {
          stats.foreign_count++;
        }
      });

      // Calculate averages and peak hours
      const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      
      monumentMap.forEach((stats, monumentId) => {
        stats.avg_daily_visitors = Math.round((stats.total_visitors / daysDiff) * 10) / 10;

        // Find peak hour and least busy hour
        let maxVisitors = 0;
        let minVisitors = Infinity;
        let peakHour = null;
        let leastBusyHour = null;

        stats.hourly_distribution.forEach((count, hour) => {
          if (count > maxVisitors) {
            maxVisitors = count;
            peakHour = hour;
          }
          if (count < minVisitors && count > 0) {
            minVisitors = count;
            leastBusyHour = hour;
          }
        });

        stats.peak_hour = peakHour;
        stats.least_busy_hour = leastBusyHour;
      });

      // Calculate crowd levels
      const allVisitors = Array.from(monumentMap.values()).map(m => m.total_visitors);
      allVisitors.sort((a, b) => a - b);
      
      if (allVisitors.length > 0) {
        const lowThreshold = allVisitors[Math.floor(allVisitors.length * 0.3)];
        const highThreshold = allVisitors[Math.floor(allVisitors.length * 0.7)];

        monumentMap.forEach((stats) => {
          if (stats.total_visitors <= lowThreshold) {
            stats.crowd_level = 'Low';
          } else if (stats.total_visitors >= highThreshold) {
            stats.crowd_level = 'High';
          } else {
            stats.crowd_level = 'Medium';
          }
        });
      }

      let footfallData = Array.from(monumentMap.values());

      // Filter by selected monument
      if (selectedMonument !== 'all') {
        footfallData = footfallData.filter(m => m.monument_id === selectedMonument);
      }

      // Sort by total visitors
      footfallData.sort((a, b) => b.total_visitors - a.total_visitors);
      setMonumentFootfall(footfallData);

      // If a monument is selected, fetch detailed trends
      if (selectedMonument !== 'all' && footfallData.length > 0) {
        fetchMonumentTrends(selectedMonument, footfallData[0]);
      }

    } catch (error: any) {
      console.error('Error fetching footfall data:', error);
      toast({
        title: 'Error Loading Data',
        description: error?.message || 'Failed to load footfall data. Please try again.',
        variant: 'destructive',
      });
      // Still show monuments even if check-ins fail
      if (allMonuments.length > 0) {
        const emptyFootfall: MonumentFootfall[] = allMonuments.map(monument => ({
          monument_id: monument.id,
          monument_name: monument.name,
          city: monument.city,
          total_visitors: 0,
          today_visitors: 0,
          avg_daily_visitors: 0,
          crowd_level: 'Low',
          peak_hour: null,
          least_busy_hour: null,
          hourly_distribution: new Array(24).fill(0),
          domestic_count: 0,
          foreign_count: 0,
        }));
        setMonumentFootfall(emptyFootfall);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMonumentTrends = async (monumentId: string, monumentData: MonumentFootfall) => {
    setSelectedMonumentDetails(monumentData);

    const { start, end } = getDateRange();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch today's hourly data
    const { data: todayCheckIns } = await supabase
      .from('check_ins')
      .select('check_in_time')
      .eq('monument_id', monumentId)
      .gte('check_in_time', today.toISOString())
      .lte('check_in_time', new Date().toISOString());

    const hourlyData: HourlyData[] = new Array(24).fill(0).map((_, hour) => ({
      hour,
      visitors: 0,
    }));

    todayCheckIns?.forEach((checkIn: any) => {
      const hour = new Date(checkIn.check_in_time).getHours();
      hourlyData[hour].visitors++;
    });

    setHourlyTrend(hourlyData);

    // Fetch last 7 days daily data
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const { data: weekCheckIns } = await supabase
      .from('check_ins')
      .select('check_in_time')
      .eq('monument_id', monumentId)
      .gte('check_in_time', sevenDaysAgo.toISOString())
      .lte('check_in_time', new Date().toISOString());

    const dailyMap = new Map<string, number>();
    weekCheckIns?.forEach((checkIn: any) => {
      const date = new Date(checkIn.check_in_time).toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });

    const dailyData: DailyTrend[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData.push({
        date: dateStr,
        visitors: dailyMap.get(dateStr) || 0,
      });
    }

    setDailyTrend(dailyData);

    // Generate insights
    const generatedInsights: string[] = [];
    
    const peakHour = monumentData.peak_hour;
    if (peakHour !== null) {
      const peakEnd = (peakHour + 1) % 24;
      generatedInsights.push(`Highest crowd observed between ${peakHour}:00 - ${peakEnd}:00`);
    }

    const leastBusyHour = monumentData.least_busy_hour;
    if (leastBusyHour !== null) {
      generatedInsights.push(`Low footfall observed at ${leastBusyHour}:00`);
    }

    if (monumentData.avg_daily_visitors > 0) {
      generatedInsights.push(`Average daily visitors: ${monumentData.avg_daily_visitors}`);
    }

    if (monumentData.crowd_level === 'High') {
      generatedInsights.push('High footfall detected - consider crowd management measures');
    } else if (monumentData.crowd_level === 'Low') {
      generatedInsights.push('Low footfall - promotion recommended');
    }

    setInsights(generatedInsights);
  };

  const getCrowdLevelColor = (level: string) => {
    switch (level) {
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'default';
      case 'Low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getUnderUtilizedMonuments = () => {
    if (monumentFootfall.length === 0) return [];

    const avgVisitors = monumentFootfall.reduce((sum, m) => sum + m.total_visitors, 0) / monumentFootfall.length;
    
    return monumentFootfall
      .filter(m => m.total_visitors < avgVisitors)
      .map(m => ({
        ...m,
        belowAverage: ((avgVisitors - m.total_visitors) / avgVisitors * 100).toFixed(1),
      }))
      .sort((a, b) => parseFloat(b.belowAverage) - parseFloat(a.belowAverage));
  };

  const handleExportToExcel = () => {
    if (monumentFootfall.length === 0) {
      toast({
        title: 'No Data',
        description: 'No data available to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Prepare data for export
      const exportData = monumentFootfall.map(monument => ({
        'Monument Name': monument.monument_name,
        'City': monument.city,
        'Total Visitors': monument.total_visitors,
        "Today's Visitors": monument.today_visitors,
        'Average Daily Visitors': monument.avg_daily_visitors,
        'Crowd Level': monument.crowd_level,
        'Peak Hour': monument.peak_hour !== null ? formatHour(monument.peak_hour) : 'N/A',
        'Least Busy Hour': monument.least_busy_hour !== null ? formatHour(monument.least_busy_hour) : 'N/A',
        'Domestic Visitors': monument.domestic_count,
        'Foreign Visitors': monument.foreign_count,
        'Total Domestic + Foreign': monument.domestic_count + monument.foreign_count,
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 25 }, // Monument Name
        { wch: 15 }, // City
        { wch: 15 }, // Total Visitors
        { wch: 18 }, // Today's Visitors
        { wch: 22 }, // Average Daily Visitors
        { wch: 12 }, // Crowd Level
        { wch: 12 }, // Peak Hour
        { wch: 16 }, // Least Busy Hour
        { wch: 18 }, // Domestic Visitors
        { wch: 18 }, // Foreign Visitors
        { wch: 25 }, // Total
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Footfall Data');

      // Add summary sheet
      const summaryData = [
        { Metric: 'Total Visitors Today', Value: overallStats.today },
        { Metric: 'Total Visitors This Week', Value: overallStats.thisWeek },
        { Metric: 'Total Visitors This Month', Value: overallStats.thisMonth },
        { Metric: 'Active Monuments', Value: overallStats.activeMonuments },
        { Metric: 'Date Range', Value: dateRange },
        { Metric: 'Export Date', Value: new Date().toLocaleString() },
      ];
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

      // Generate filename
      const { start, end } = getDateRange();
      const filename = `Footfall_Analytics_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);

      toast({
        title: 'Export Successful',
        description: `Footfall data exported to ${filename}`,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export data to Excel',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateData = async () => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can generate data',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingData(true);
    try {
      const count = await generateRealisticFootfallData();
      toast({
        title: 'Data Generated',
        description: `Successfully generated ${count} check-ins`,
      });
      // Refresh data after generation
      setTimeout(() => {
        fetchData();
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate data',
        variant: 'destructive',
      });
    } finally {
      setGeneratingData(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Please log in to view footfall data</p>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Access Denied</p>
            <p className="text-sm text-muted-foreground mb-4">Only administrators can access the Footfall Dashboard.</p>
            <Link to="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const underUtilized = getUnderUtilizedMonuments();
  const maxHourlyVisitors = hourlyTrend.length > 0 ? Math.max(...hourlyTrend.map(h => h.visitors), 1) : 1;
  const maxDailyVisitors = dailyTrend.length > 0 ? Math.max(...dailyTrend.map(d => d.visitors), 1) : 1;

  // Always render something, even if loading
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-8">
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-2 bg-muted rounded text-xs">
                Debug: Loading={loading.toString()}, User={user?.email || 'none'}, 
                Monuments={allMonuments.length}, Footfall={monumentFootfall.length}
              </div>
            )}
            <div className="flex items-center gap-4 mb-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Footfall Analytics Dashboard</h1>
                <p className="text-muted-foreground">Real-time tourism intelligence for government authorities</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <Label>Date Range</Label>
                  <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
                    <SelectTrigger>
                      <Calendar className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {dateRange === 'custom' && (
                  <>
                    <div className="flex-1 min-w-[150px]">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="flex-1 min-w-[200px]">
                  <Label>Filter Monument</Label>
                  <Select value={selectedMonument} onValueChange={setSelectedMonument}>
                    <SelectTrigger>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="All Monuments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Monuments</SelectItem>
                      {allMonuments.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} - {m.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={fetchData}>
                  <Activity className="w-4 h-4 mr-2" />
                  Refresh
                </Button>

                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleExportToExcel}
                      disabled={monumentFootfall.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGenerateData}
                      disabled={generatingData}
                    >
                      <Database className="w-4 h-4 mr-2" />
                      {generatingData ? 'Generating...' : 'Generate Data'}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loading indicator */}
          {loading && (
            <div className="text-center py-8 mb-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground mt-2">Loading footfall data...</p>
            </div>
          )}

          {/* 1. Overall Footfall Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Visitors Today</CardDescription>
                <CardTitle className="text-3xl">{overallStats.today.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-1" />
                  <span>Real-time count</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Visitors This Week</CardDescription>
                <CardTitle className="text-3xl">{overallStats.thisWeek.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Last 7 days</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Visitors This Month</CardDescription>
                <CardTitle className="text-3xl">{overallStats.thisMonth.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>Last 30 days</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Monuments</CardDescription>
                <CardTitle className="text-3xl">{overallStats.activeMonuments}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>With check-ins</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="monuments" className="space-y-4">
            <TabsList>
              <TabsTrigger value="monuments">Monument Footfall</TabsTrigger>
              <TabsTrigger value="trends">Crowd Trends</TabsTrigger>
              <TabsTrigger value="underutilized">Under-Utilized</TabsTrigger>
            </TabsList>

            {/* 2. Monument-wise Footfall Table */}
            <TabsContent value="monuments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monument-Wise Footfall Analysis</CardTitle>
                  <CardDescription>Detailed visitor statistics for each monument</CardDescription>
                </CardHeader>
                <CardContent>
                  {monumentFootfall.length === 0 && !loading ? (
                    <div className="text-center py-12">
                      <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground mb-2">No monuments found in database.</p>
                      <p className="text-sm text-muted-foreground">Please add monuments to the database first.</p>
                    </div>
                  ) : monumentFootfall.length > 0 && monumentFootfall.every(m => m.total_visitors === 0) && !loading ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground mb-2">No visitor data available for the selected period.</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {isAdmin ? (
                          <>
                            Click the "Generate Data" button above to create realistic footfall data, or wait for tourists to check in at monuments.
                          </>
                        ) : (
                          'No check-ins have been recorded yet.'
                        )}
                      </p>
                      {isAdmin && (
                        <Button onClick={handleGenerateData} disabled={generatingData}>
                          <Database className="w-4 h-4 mr-2" />
                          {generatingData ? 'Generating...' : 'Generate Sample Data'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Monument Name</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead>Total Visitors</TableHead>
                            <TableHead>Today's Visitors</TableHead>
                            <TableHead>Avg Daily Visitors</TableHead>
                            <TableHead>Crowd Level</TableHead>
                            <TableHead>Peak Hour</TableHead>
                            <TableHead>Domestic / Foreign</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monumentFootfall.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                {loading ? 'Loading monuments...' : 'No monuments available'}
                              </TableCell>
                            </TableRow>
                          ) : (
                            monumentFootfall.map((monument) => (
                              <TableRow
                                key={monument.monument_id}
                                className={`cursor-pointer hover:bg-muted/50 ${monument.total_visitors === 0 ? 'opacity-60' : ''}`}
                                onClick={() => {
                                  if (monument.total_visitors > 0) {
                                    setSelectedMonument(monument.monument_id);
                                    fetchMonumentTrends(monument.monument_id, monument);
                                  }
                                }}
                              >
                                <TableCell className="font-medium">{monument.monument_name}</TableCell>
                                <TableCell>{monument.city}</TableCell>
                                <TableCell className="font-semibold">{monument.total_visitors}</TableCell>
                                <TableCell>{monument.today_visitors}</TableCell>
                                <TableCell>{monument.avg_daily_visitors}</TableCell>
                                <TableCell>
                                  <Badge variant={getCrowdLevelColor(monument.crowd_level) as any}>
                                    {monument.crowd_level}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {monument.peak_hour !== null ? formatHour(monument.peak_hour) : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <span className="text-blue-600">{monument.domestic_count}</span>
                                    {' / '}
                                    <span className="text-green-600">{monument.foreign_count}</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3. Peak Hours & Trends */}
            <TabsContent value="trends" className="space-y-4">
              {selectedMonumentDetails ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Peak Hours Analysis - {selectedMonumentDetails.monument_name}</CardTitle>
                      <CardDescription>Hourly visitor distribution for today</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {hourlyTrend.every(h => h.visitors === 0) ? (
                        <div className="text-center py-8">
                          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                          <p className="text-muted-foreground">No check-ins recorded for today</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {hourlyTrend.map((data) => (
                          <div key={data.hour} className="flex items-center gap-4">
                            <div className="w-20 text-sm font-medium">{formatHour(data.hour)}</div>
                            <div className="flex-1">
                              <div className="bg-muted rounded-full h-6 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    data.hour === selectedMonumentDetails.peak_hour
                                      ? 'bg-primary'
                                      : data.hour === selectedMonumentDetails.least_busy_hour
                                      ? 'bg-muted-foreground/30'
                                      : 'bg-primary/60'
                                  }`}
                                  style={{
                                    width: `${(data.visitors / Math.max(maxHourlyVisitors, 1)) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="w-16 text-right font-semibold">{data.visitors}</div>
                            {data.hour === selectedMonumentDetails.peak_hour && (
                              <Badge variant="default">Peak</Badge>
                            )}
                            {data.hour === selectedMonumentDetails.least_busy_hour && (
                              <Badge variant="secondary">Least Busy</Badge>
                            )}
                          </div>
                        ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Trend - Last 7 Days</CardTitle>
                      <CardDescription>Visitor count over the past week</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dailyTrend.every(d => d.visitors === 0) ? (
                        <div className="text-center py-8">
                          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                          <p className="text-muted-foreground">No check-ins recorded in the last 7 days</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {dailyTrend.map((data) => (
                          <div key={data.date} className="flex items-center gap-4">
                            <div className="w-32 text-sm font-medium">
                              {new Date(data.date).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="flex-1">
                              <div className="bg-muted rounded-full h-6 overflow-hidden">
                                <div
                                  className="bg-primary h-full rounded-full transition-all"
                                  style={{
                                    width: `${(data.visitors / Math.max(maxDailyVisitors, 1)) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="w-16 text-right font-semibold">{data.visitors}</div>
                          </div>
                        ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Auto-Generated Insights</CardTitle>
                      <CardDescription>Key observations for {selectedMonumentDetails.monument_name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {insights.length === 0 ? (
                        <p className="text-muted-foreground">No insights available</p>
                      ) : (
                        <ul className="space-y-2">
                          {insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 mt-1 text-primary" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>

                  {/* Domestic vs Foreign */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Domestic vs Foreign Footfall</CardTitle>
                      <CardDescription>Visitor type distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedMonumentDetails.domestic_count === 0 && selectedMonumentDetails.foreign_count === 0 ? (
                        <p className="text-muted-foreground">Data not available</p>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-blue-600 rounded"></div>
                              <span>Indian Tourists</span>
                            </div>
                            <span className="font-semibold">{selectedMonumentDetails.domestic_count}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-green-600 rounded"></div>
                              <span>Foreign Tourists</span>
                            </div>
                            <span className="font-semibold">{selectedMonumentDetails.foreign_count}</span>
                          </div>
                          <div className="bg-muted rounded-full h-4 overflow-hidden">
                            <div className="flex h-full">
                              <div
                                className="bg-blue-600"
                                style={{
                                  width: `${
                                    ((selectedMonumentDetails.domestic_count /
                                      (selectedMonumentDetails.domestic_count +
                                        selectedMonumentDetails.foreign_count)) *
                                      100) || 0
                                  }%`,
                                }}
                              />
                              <div
                                className="bg-green-600"
                                style={{
                                  width: `${
                                    ((selectedMonumentDetails.foreign_count /
                                      (selectedMonumentDetails.domestic_count +
                                        selectedMonumentDetails.foreign_count)) *
                                      100) || 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Select a monument from the table to view detailed trends</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 6. Under-Utilized Monuments */}
            <TabsContent value="underutilized" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Under-Utilized Monuments</CardTitle>
                  <CardDescription>Monuments with footfall below state average</CardDescription>
                </CardHeader>
                <CardContent>
                  {underUtilized.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingDown className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">All monuments are performing well</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {underUtilized.map((monument) => (
                        <div key={monument.monument_id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{monument.monument_name}</h3>
                              <p className="text-sm text-muted-foreground">{monument.city}</p>
                            </div>
                            <Badge variant="outline" className="text-destructive">
                              {monument.belowAverage}% below average
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Visitors</p>
                              <p className="font-semibold">{monument.total_visitors}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Average Daily</p>
                              <p className="font-semibold">{monument.avg_daily_visitors}</p>
                            </div>
                          </div>
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium">Suggested Action:</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {parseFloat(monument.belowAverage) > 50
                                ? 'Infrastructure review needed - Consider promotional campaigns and accessibility improvements'
                                : 'Promotion recommended - Increase visibility through marketing channels'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
}
