import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AccessDenied = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
    <Card className="w-full max-w-md border-slate-700 bg-slate-900 text-white">
      <CardHeader className="text-center">
        <ShieldX className="mx-auto mb-3 h-12 w-12 text-amber-400" />
        <CardTitle>Management access required</CardTitle>
        <CardDescription className="text-slate-400">
          Your Supabase account is authenticated but does not have an approved Estate Nest management role.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button asChild>
          <Link to="/management/login">Return to sign in</Link>
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default AccessDenied;
