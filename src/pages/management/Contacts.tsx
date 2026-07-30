// Contacts Management Page
import { ManagementLayout } from './components/ManagementLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const Contacts = () => {
  return (
    <ManagementLayout title="Contacts">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Contacts Management
          </CardTitle>
          <CardDescription>
            Manage your contacts and customer relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Feature in Development</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              The Contacts management feature is currently being built. 
              This will allow you to view, add, edit, and manage your contacts.
            </p>
          </div>
        </CardContent>
      </Card>
    </ManagementLayout>
  );
};

export default Contacts;
