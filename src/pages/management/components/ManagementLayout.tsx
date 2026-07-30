// Management Layout Component
import { useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Shield } from 'lucide-react';

interface ManagementLayoutProps {
  children: ReactNode;
  title: string;
}

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

export const ManagementLayout = ({ children, title }: ManagementLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
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
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    localStorage.removeItem('user');
    navigate('/management/login');
  };

  const getActiveTab = () => {
    const currentPath = location.pathname;
    const matchingItem = navItems.find(item => currentPath.startsWith(item.path));
    return matchingItem?.id || 'dashboard';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Navigation */}
      <nav className="bg-slate-900 text-white border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <div className="font-bold text-xl">Estate Nest CRM</div>
              </div>
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      getActiveTab() === item.id
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
              <span className="text-sm text-slate-400">{user?.email || 'kanwar@estatenest.ca'}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout} 
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
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
              onClick={() => navigate(item.path)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                getActiveTab() === item.id
                  ? 'bg-primary text-white'
                  : 'text-slate-300 bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
};

export default ManagementLayout;
