// Tasks Management Page
import { ManagementLayout } from './components/ManagementLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';

const Tasks = () => {
  return (
    <ManagementLayout title="Tasks">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Task Management
          </CardTitle>
          <CardDescription>
            Track and manage your tasks and to-dos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
              <CheckSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Feature in Development</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              The Tasks management feature is currently being built.
              This will help you track and manage your daily tasks and follow-ups.
            </p>
          </div>
        </CardContent>
      </Card>
    </ManagementLayout>
  );
};

export default Tasks;
