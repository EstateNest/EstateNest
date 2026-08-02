import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, KeyRound, Loader2, Shield, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AuthenticationStep = 'password' | 'mfa' | 'enroll';

interface EnrollmentData {
  factorId: string;
  qrCode: string;
  secret: string;
}

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [step, setStep] = useState<AuthenticationStep>('password');
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const checkExistingSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        const payload = await response.json().catch(() => ({}));
        if (!active) return;
        if (response.ok) navigate('/management/dashboard', { replace: true });
        else if (response.status === 403) navigate('/management/access-denied', { replace: true });
        else if (payload.code === 'MFA_REQUIRED') setStep('mfa');
        else if (payload.code === 'MFA_ENROLLMENT_REQUIRED') setStep('enroll');
      } catch {
        return;
      }
    };
    void checkExistingSession();
    return () => { active = false; };
  }, [navigate]);

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await response.json();

      if (response.status === 403) {
        navigate('/management/access-denied', { replace: true });
        return;
      }
      if (response.status === 202 && data.mfaRequired) {
        setPassword('');
        setStep('mfa');
        return;
      }
      if (response.status === 202 && data.mfaEnrollmentRequired) {
        setPassword('');
        setStep('enroll');
        return;
      }
      if (!response.ok) throw new Error(data.message || 'Login failed');
      navigate('/management/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const startEnrollment = async () => {
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/mfa', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enroll' }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to start MFA enrollment');
      setEnrollment({ factorId: payload.factorId, qrCode: payload.qrCode, secret: payload.secret });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to start MFA enrollment');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMfa = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const action = step === 'enroll' ? 'confirm-enrollment' : 'verify';
      const response = await fetch('/api/auth/mfa', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, code: mfaCode, factorId: enrollment?.factorId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Authenticator verification failed');
      navigate('/management/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Authenticator verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSecondFactor = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    setStep('password');
    setEnrollment(null);
    setMfaCode('');
    setError('');
  };

  const qrCodeSource = enrollment?.qrCode.startsWith('data:')
    ? enrollment.qrCode
    : enrollment ? `data:image/svg+xml;utf8,${encodeURIComponent(enrollment.qrCode)}` : '';

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Button asChild variant="ghost" className="mb-6 min-h-11 px-3 text-slate-300 hover:bg-white/10 hover:text-white focus-visible:ring-white/70">
          <Link to="/" data-testid="management-home-link">
            <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
            Estate Nest Home
          </Link>
        </Button>

        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Estate Nest</h1>
          <p className="text-slate-400">Management Portal</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <h2 className="text-2xl font-semibold leading-none tracking-tight text-white">
              {step === 'password' ? 'Sign In' : step === 'mfa' ? 'Verify Authenticator' : 'Secure Your Account'}
            </h2>
            <CardDescription className="text-slate-400">
              {step === 'password'
                ? 'Enter your Supabase account credentials to access the management portal.'
                : step === 'mfa'
                  ? 'Enter the current six-digit code from your authenticator app.'
                  : 'Set up a TOTP authenticator before management access is granted.'}
            </CardDescription>
          </CardHeader>

          {step === 'password' ? (
            <form onSubmit={handlePasswordSubmit}>
              <CardContent className="space-y-4">
                {error && <ErrorMessage message={error} />}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input id="email" type="email" placeholder="you@estatenest.ca" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" className="h-11 border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <Input id="password" type="password" placeholder="Enter password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" className="h-11 border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-500" />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="min-h-11 w-full bg-gradient-primary hover:opacity-90" disabled={isLoading}>
                  {isLoading ? <><Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}
                </Button>
              </CardFooter>
            </form>
          ) : step === 'enroll' && !enrollment ? (
            <CardContent className="space-y-4 pb-6">
              {error && <ErrorMessage message={error} />}
              <div className="rounded-lg border border-cyan-700 bg-cyan-950/40 p-4 text-sm text-cyan-100">
                <Smartphone className="mb-2 h-5 w-5" />
                TOTP works with Google Authenticator, Microsoft Authenticator, 1Password, and compatible mobile apps. It does not require SMS.
              </div>
              <Button className="min-h-11 w-full" onClick={() => void startEnrollment()} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                Set Up Authenticator
              </Button>
              <Button variant="ghost" className="min-h-11 w-full text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => void cancelSecondFactor()}>Return to password sign-in</Button>
            </CardContent>
          ) : (
            <form onSubmit={verifyMfa}>
              <CardContent className="space-y-4">
                {error && <ErrorMessage message={error} />}
                {step === 'enroll' && enrollment && (
                  <div className="space-y-4 rounded-lg bg-white p-4 text-slate-900">
                    <img src={qrCodeSource} alt="Estate Nest authenticator QR code" className="mx-auto h-48 w-48" />
                    <div>
                      <p className="text-sm font-medium">Cannot scan on this device?</p>
                      <p className="mt-1 text-xs text-slate-600">Enter this setup key manually in your authenticator app:</p>
                      <code className="mt-2 block break-all rounded bg-slate-100 p-2 text-center text-sm" data-testid="totp-manual-secret">{enrollment.secret}</code>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="mfa-code" className="text-slate-300">Six-digit authenticator code</Label>
                  <Input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required className="h-12 border-slate-700 bg-slate-900/50 text-center text-xl tracking-[0.4em] text-white" />
                </div>
                <p className="text-xs text-slate-400">Codes refresh every 30 seconds. If one expires, enter the next code shown.</p>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button type="submit" className="min-h-11 w-full bg-gradient-primary hover:opacity-90" disabled={isLoading || mfaCode.length !== 6}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : 'Verify and Continue'}
                </Button>
                <Button type="button" variant="ghost" className="min-h-11 w-full text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => void cancelSecondFactor()}>Return to password sign-in</Button>
              </CardFooter>
            </form>
          )}
        </Card>

        <p className="mt-4 text-center text-sm text-slate-500">
          Lost password or authenticator access? <a href="mailto:hello@estatenest.ca?subject=Management%20account%20recovery" className="text-primary hover:underline">Start owner-verified recovery</a>.
        </p>
      </div>
    </div>
  );
};

function ErrorMessage({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
      <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

export default Login;
