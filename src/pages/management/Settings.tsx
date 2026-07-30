// Settings Management Page
import { ManagementLayout } from './components/ManagementLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  return (
    <ManagementLayout title="Settings">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure your CRM settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
              <SettingsIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Feature in Development</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              The Settings feature is currently being built.
              This will allow you to configure user preferences, notification settings, and system integrations.
            </p>
          </div>
        </CardContent>
      </Card>
    </ManagementLayout>
  );
};

export default Settings;
