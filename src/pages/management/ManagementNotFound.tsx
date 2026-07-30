// Management 404 Page - Keeps authenticated users inside CRM
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Home, LogOut } from 'lucide-react';

const ManagementNotFound = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    localStorage.removeItem('user');
    navigate('/management/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <span className="text-2xl font-bold text-slate-900">Estate Nest CRM</span>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-bold text-red-500">404</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The requested management page could not be found. 
            You may have clicked an outdated link or the page may be under development.
          </p>

          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/management/dashboard')}>
              <Home className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-sm text-muted-foreground mt-6">
          If you believe this is an error, please contact support at{' '}
          <a href="mailto:hello@estatenest.ca" className="text-primary hover:underline">
            hello@estatenest.ca
          </a>
        </p>
      </div>
    </div>
  );
};

export default ManagementNotFound;
