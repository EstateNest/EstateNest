// Management Dashboard Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Calendar, Phone, Mail, AlertCircle, ArrowRight, LogOut, Plus } from 'lucide-react';

// Navigation Component
const ManagementNav = ({ user }: { user: any }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/management/dashboard' },
    { id: 'contacts', label: 'Contacts', path: '/management/contacts' },
    { id: 'leads', label: 'Leads', path: '/management/leads' },
    { id: 'pipeline', label: 'Pipeline', path: '/management/pipeline' },
    { id: 'appointments', label: 'Appointments', path: '/management/appointments' },
    { id: 'tasks', label: 'Tasks', path: '/management/tasks' },
    { id: 'content', label: 'Content', path: '/management/content' },
    { id: 'reports', label: 'Reports', path: '/management/reports' },
    { id: 'settings', label: 'Settings', path: '/management/settings' },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    localStorage.removeItem('user');
    navigate('/management/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Navigation */}
      <nav className="bg-slate-900 text-white border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="font-bold text-xl">Estate Nest CRM</div>
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      navigate(item.path);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-300 hover:text-white hover:bg-slate-800">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-slate-800 border-b border-slate-700 overflow-x-auto">
        <div className="flex px-4 py-2 gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                navigate(item.path);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeTab === item.id
                  ? 'bg-primary text-white'
                  : 'text-slate-300 bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate('/management/leads/new')} className="bg-gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
          <Button variant="outline" onClick={() => navigate('/management/contacts/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
          <Button variant="outline" onClick={() => navigate('/management/appointments/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Appointment
          </Button>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, description, icon: Icon, trend, color }: {
  title: string;
  value: number | string;
  description?: string;
  icon: any;
  trend?: string;
  color: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      {trend && (
        <div className="flex items-center mt-2 text-xs text-green-600">
          <TrendingUp className="w-3 h-3 mr-1" />
          {trend}
        </div>
      )}
    </CardContent>
  </Card>
);

// Lead Status Badge
const StatusBadge = ({ status }: { status: string }) => {
  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    ATTEMPTED_CONTACT: 'bg-yellow-100 text-yellow-800',
    CONTACTED: 'bg-orange-100 text-orange-800',
    APPOINTMENT_BOOKED: 'bg-purple-100 text-purple-800',
    QUOTE_PREPARED: 'bg-indigo-100 text-indigo-800',
    QUOTE_PRESENTED: 'bg-cyan-100 text-cyan-800',
    APPLICATION_STARTED: 'bg-teal-100 text-teal-800',
    APPLICATION_SUBMITTED: 'bg-blue-100 text-blue-800',
    UNDERWRITING: 'bg-violet-100 text-violet-800',
    REQUIREMENTS_PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-green-100 text-green-800',
    POLICY_ISSUED: 'bg-emerald-100 text-emerald-800',
    POLICY_DELIVERED: 'bg-green-500 text-white',
    NOT_TAKEN: 'bg-gray-100 text-gray-800',
    LOST: 'bg-red-100 text-red-800',
    FOLLOW_UP: 'bg-orange-100 text-orange-800',
  };

  const label = status.replace(/_/g, ' ');

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {label}
    </span>
  );
};

// Dashboard Page
const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [followUpLeads, setFollowUpLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (!response.ok) {
          navigate('/management/login');
          return;
        }
        const userData = await response.json();
        setUser(userData.user);
      } catch {
        navigate('/management/login');
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch stats
        const statsRes = await fetch('/api/leads/stats', { credentials: 'include' });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }

        // Fetch recent leads
        const leadsRes = await fetch('/api/leads?limit=5', { credentials: 'include' });
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          setRecentLeads(leadsData.leads || []);
        }

        // Fetch follow-up leads
        const followUpRes = await fetch('/api/leads/followup', { credentials: 'include' });
        if (followUpRes.ok) {
          const followUpData = await followUpRes.json();
          setFollowUpLeads(followUpData.leads || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const insuranceLabels: Record<string, string> = {
    TERM_LIFE: 'Term Life',
    WHOLE_LIFE: 'Whole Life',
    MORTGAGE_PROTECTION: 'Mortgage Protection',
    CRITICAL_ILLNESS: 'Critical Illness',
    DISABILITY: 'Disability',
    TRAVEL: 'Travel',
    BUSINESS: 'Business',
    SEGREGATED_FUNDS: 'Segregated Funds',
    OTHER: 'Other',
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <ManagementNav user={user} />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.firstName || user.username}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="New Leads"
            value={stats?.newLeads || 0}
            description="This week"
            icon={Users}
            trend="+12%"
            color="bg-blue-500"
          />
          <StatCard
            title="Needs Follow-up"
            value={stats?.needsFollowUp || 0}
            description="Overdue tasks"
            icon={AlertCircle}
            color="bg-orange-500"
          />
          <StatCard
            title="Today's Appointments"
            value={stats?.todaysAppointments || 0}
            description="Scheduled"
            icon={Calendar}
            color="bg-purple-500"
          />
          <StatCard
            title="Total Contacts"
            value={stats?.totalContacts || 0}
            description="In database"
            icon={Users}
            color="bg-green-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Leads</CardTitle>
                  <CardDescription>Latest leads from all sources</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/management/leads')}>
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentLeads.length > 0 ? (
                <div className="space-y-4">
                  {recentLeads.map((lead: any) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/management/leads/${lead.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {lead.contact?.first_name?.[0]}{lead.contact?.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {lead.contact?.first_name} {lead.contact?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {insuranceLabels[lead.insurance_interest] || lead.insurance_interest}
                            {lead.contact?.province && ` • ${lead.contact.province}`}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={lead.lead_status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No leads yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Follow-up Required */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Follow-up Required</CardTitle>
                  <CardDescription>Leads that need your attention</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {followUpLeads.length > 0 ? (
                <div className="space-y-4">
                  {followUpLeads.slice(0, 5).map((lead: any) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Phone className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {lead.contact?.first_name} {lead.contact?.last_name}
                          </p>
                          <p className="text-sm text-orange-600">
                            {lead.next_follow_up_at && new Date(lead.next_follow_up_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Contact</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No follow-ups needed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Overview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pipeline Overview</CardTitle>
            <CardDescription>Lead distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {stats?.pipelineStatus && Object.entries(stats.pipelineStatus).map(([status, count]) => (
                <div key={status} className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold">{count as number}</div>
                  <StatusBadge status={status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
