// New Lead Form Page
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ManagementLayout } from '../components/ManagementLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';

const insuranceOptions = [
  { value: 'TERM_LIFE', label: 'Term Life Insurance' },
  { value: 'WHOLE_LIFE', label: 'Whole Life Insurance' },
  { value: 'MORTGAGE_PROTECTION', label: 'Mortgage Protection' },
  { value: 'CRITICAL_ILLNESS', label: 'Critical Illness' },
  { value: 'DISABILITY', label: 'Disability Insurance' },
  { value: 'TRAVEL', label: 'Travel Insurance' },
  { value: 'OTHER', label: 'Other' },
];

const NewLead = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    province: '',
    city: '',
    insurance_interest: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        navigate('/management/leads');
      } else {
        alert('Failed to create lead');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ManagementLayout title="Add New Lead">
      <Button variant="ghost" onClick={() => navigate('/management/leads')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Leads
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New Lead</CardTitle>
          <CardDescription>Enter the lead information below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance_interest">Insurance Interest *</Label>
              <select
                id="insurance_interest"
                name="insurance_interest"
                value={formData.insurance_interest}
                onChange={handleChange}
                required
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select an option</option>
                {insuranceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Notes</Label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Lead'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/management/leads')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </ManagementLayout>
  );
};

export default NewLead;
