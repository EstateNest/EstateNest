// Management Login Page
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { Shield, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const checkExistingSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (active && response.ok) navigate('/management/dashboard', { replace: true });
        if (active && response.status === 403) navigate('/management/access-denied', { replace: true });
      } catch {
        return;
      }
    };
    void checkExistingSession();
    return () => { active = false; };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.status === 403) {
        navigate('/management/access-denied', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      navigate('/management/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Button
          asChild
          variant="ghost"
          className="mb-6 min-h-11 px-3 text-slate-300 hover:bg-white/10 hover:text-white focus-visible:ring-white/70"
        >
          <Link to="/" data-testid="management-home-link">
            <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
            Estate Nest Home
          </Link>
        </Button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Estate Nest</h1>
          <p className="text-slate-400">Management Portal</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <h2 className="text-2xl font-semibold leading-none tracking-tight text-white">Sign In</h2>
            <CardDescription className="text-slate-400">
              Enter your credentials to access the management portal
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div role="alert" className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <AlertCircle aria-hidden="true" className="w-4 h-4" />
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@estatenest.ca"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="h-11 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="min-h-11 w-full bg-gradient-primary hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 aria-hidden="true" className="mr-2 w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-slate-500 text-sm mt-4">
          Need help? Contact <a href="mailto:hello@estatenest.ca" className="text-primary hover:underline">hello@estatenest.ca</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
