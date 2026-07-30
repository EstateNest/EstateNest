// Pipeline Management Page
import { ManagementLayout } from './components/ManagementLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';

const Pipeline = () => {
  return (
    <ManagementLayout title="Pipeline">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Sales Pipeline
          </CardTitle>
          <CardDescription>
            Visualize and manage your sales pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
              <GitBranch className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Feature in Development</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              The Pipeline visualization feature is currently being built.
              This will provide a Kanban-style view of your leads and their progress through the sales funnel.
            </p>
          </div>
        </CardContent>
      </Card>
    </ManagementLayout>
  );
};

export default Pipeline;
