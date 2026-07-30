// Leads Management Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ManagementLayout } from './components/ManagementLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const insuranceLabels: Record<string, string> = {
  TERM_LIFE: 'Term Life',
  WHOLE_LIFE: 'Whole Life',
  MORTGAGE_PROTECTION: 'Mortgage Protection',
  CRITICAL_ILLNESS: 'Critical Illness',
  DISABILITY: 'Disability',
  TRAVEL: 'Travel',
  BUSINESS: 'Business',
  SEGREGATED_FUNDS: 'Segregated Funds',
  OTHER: 'Other',
};

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  ATTEMPTED_CONTACT: 'bg-yellow-100 text-yellow-800',
  CONTACTED: 'bg-orange-100 text-orange-800',
  APPOINTMENT_BOOKED: 'bg-purple-100 text-purple-800',
  QUOTE_PREPARED: 'bg-indigo-100 text-indigo-800',
  QUOTE_PRESENTED: 'bg-cyan-100 text-cyan-800',
  APPLICATION_STARTED: 'bg-teal-100 text-teal-800',
  APPLICATION_SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDERWRITING: 'bg-violet-100 text-violet-800',
  REQUIREMENTS_PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  POLICY_ISSUED: 'bg-emerald-100 text-emerald-800',
  POLICY_DELIVERED: 'bg-green-500 text-white',
  NOT_TAKEN: 'bg-gray-100 text-gray-800',
  LOST: 'bg-red-100 text-red-800',
  FOLLOW_UP: 'bg-orange-100 text-orange-800',
};

const Leads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('/api/leads?limit=50', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setLeads(data.leads || []);
        }
      } catch (error) {
        console.error('Failed to fetch leads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.contact?.first_name?.toLowerCase().includes(searchLower) ||
      lead.contact?.last_name?.toLowerCase().includes(searchLower) ||
      lead.contact?.email?.toLowerCase().includes(searchLower) ||
      lead.contact?.phone?.includes(searchTerm)
    );
  });

  return (
    <ManagementLayout title="Leads">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/management/leads/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Leads List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Leads</CardTitle>
          <CardDescription>
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg" />
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No leads found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/management/leads/${lead.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        {lead.contact?.first_name?.[0]}{lead.contact?.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {lead.contact?.first_name} {lead.contact?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lead.contact?.email}
                        {lead.contact?.phone && ` • ${lead.contact.phone}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {insuranceLabels[lead.insurance_interest] || lead.insurance_interest}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[lead.lead_status] || 'bg-gray-100 text-gray-800'}`}>
                      {lead.lead_status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </ManagementLayout>
  );
};

export default Leads;
