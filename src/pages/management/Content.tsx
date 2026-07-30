// Content Management Page
import { ManagementLayout } from './components/ManagementLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const Content = () => {
  return (
    <ManagementLayout title="Content">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Content Management
          </CardTitle>
          <CardDescription>
            Manage website content and marketing materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Feature in Development</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              The Content management feature is currently being built.
              This will allow you to manage website content, blog posts, and marketing materials.
            </p>
          </div>
        </CardContent>
      </Card>
    </ManagementLayout>
  );
};

export default Content;
