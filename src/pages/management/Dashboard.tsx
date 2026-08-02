import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  Archive,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Workflow,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  type Contact,
  type Advisor,
  type DashboardResponse,
  type Lead,
  type ManagementUser,
  contactName,
  advisorName,
  crmRequest,
  formatDate,
  formatLabel,
  insuranceInterests,
  leadSources,
  leadStatuses,
  leadOutcomeStatuses,
} from './crm';
import {
  AdvisorDetailPage,
  AdvisorsPage,
  CommunicationsPage,
  CompliancePage,
  CommissionsPage,
  NotificationsPage,
  OperationsAccessNotice,
  ReportsOperationsPage,
  LifecycleDialog,
} from './ManagementOperations';

const navItems = [
  { label: 'Dashboard', path: '/management/dashboard', icon: LayoutDashboard },
  { label: 'Leads', path: '/management/leads', icon: Activity },
  { label: 'Clients', path: '/management/contacts', icon: Users },
  { label: 'Pipeline', path: '/management/pipeline', icon: Workflow },
  { label: 'Advisors', path: '/management/advisors', icon: UserPlus },
  { label: 'Compliance', path: '/management/compliance', icon: ShieldCheck },
  { label: 'Commissions', path: '/management/commissions', icon: BarChart3 },
  { label: 'Email', path: '/management/email', icon: Mail },
  { label: 'Notifications', path: '/management/notifications', icon: AlertCircle },
  { label: 'Appointments', path: '/management/appointments', icon: CalendarDays },
  { label: 'Tasks', path: '/management/tasks', icon: ClipboardList },
  { label: 'Content', path: '/management/content', icon: FileText },
  { label: 'Reports', path: '/management/reports', icon: BarChart3 },
  { label: 'Settings', path: '/management/settings', icon: Settings },
];

const inputClassName = 'bg-white';
const selectClassName = 'flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

function statusClass(status: string): string {
  if (['POLICY_ISSUED', 'POLICY_DELIVERED', 'APPROVED', 'COMPLETED', 'PUBLISHED'].includes(status)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (['LOST', 'NOT_TAKEN', 'CANCELLED', 'REJECTED'].includes(status)) {
    return 'border-red-200 bg-red-50 text-red-700';
  }
  if (['FOLLOW_UP', 'ATTEMPTED_CONTACT', 'REQUIREMENTS_PENDING', 'URGENT'].includes(status)) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  if (['UNDERWRITING', 'APPLICATION_SUBMITTED', 'APPOINTMENT_BOOKED'].includes(status)) {
    return 'border-violet-200 bg-violet-50 text-violet-700';
  }
  return 'border-blue-200 bg-blue-50 text-blue-700';
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={statusClass(status)}>{formatLabel(status)}</Badge>;
}

function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

function LoadingPanel({ label = 'Loading management data...' }: { label?: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-56 items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        {label}
      </CardContent>
    </Card>
  );
}

function ErrorPanel({ message, retry }: { message: string; retry: () => void }) {
  return (
    <Card className="border-red-200">
      <CardContent className="flex min-h-48 flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-9 w-9 text-red-500" />
        <div>
          <p className="font-semibold text-slate-900">Unable to load this section</p>
          <p className="mt-1 text-sm text-slate-600">{message}</p>
        </div>
        <Button variant="outline" onClick={retry}>Try again</Button>
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50 px-6 text-center">
      <Users className="mb-3 h-10 w-10 text-slate-300" />
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon, color }: {
  title: string;
  value: string | number;
  description: string;
  icon: typeof Users;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <div className={`rounded-2xl p-3 text-white ${color}`}><Icon className="h-6 w-6" /></div>
      </CardContent>
    </Card>
  );
}

function DashboardHome({ user }: { user: ManagementUser }) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await crmRequest<DashboardResponse>('dashboard'));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <LoadingPanel />;
  if (error || !data) return <ErrorPanel message={error || 'No dashboard data returned'} retry={load} />;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.firstName || user.username}. Here is today's Canadian insurance pipeline.`}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="New leads" value={data.stats.newLeads} description="Created in the last 7 days" icon={UserPlus} color="bg-blue-600" />
        <StatCard title="Follow-ups due" value={data.stats.needsFollowUp} description="Require advisor attention" icon={AlertCircle} color="bg-amber-500" />
        <StatCard title="Today's appointments" value={data.stats.todaysAppointments} description="Scheduled consultations" icon={CalendarDays} color="bg-violet-600" />
        <StatCard title="Conversion rate" value={`${data.stats.conversionRate}%`} description={`${data.stats.completedLeads} issued or delivered`} icon={CheckCircle2} color="bg-emerald-600" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent leads</CardTitle>
              <CardDescription>Latest quote requests and manually added prospects</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild><Link to="/management/leads">View all</Link></Button>
          </CardHeader>
          <CardContent>
            {data.recentLeads.length ? (
              <div className="space-y-3">
                {data.recentLeads.map((lead) => (
                  <Link key={lead.id} to={`/management/leads/${lead.id}`} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{contactName(lead.contact)}</p>
                      <p className="truncate text-sm text-slate-500">{formatLabel(lead.insurance_interest)} · {formatLabel(lead.source)}</p>
                    </div>
                    <StatusBadge status={lead.lead_status} />
                  </Link>
                ))}
              </div>
            ) : <EmptyPanel title="No leads yet" description="Submitted quote forms and manually added leads will appear here." />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow-up queue</CardTitle>
            <CardDescription>Overdue and currently due follow-up dates</CardDescription>
          </CardHeader>
          <CardContent>
            {data.followUpLeads.length ? (
              <div className="space-y-3">
                {data.followUpLeads.slice(0, 6).map((lead) => (
                  <Link key={lead.id} to={`/management/leads/${lead.id}`} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">{contactName(lead.contact)}</p>
                      <p className="text-sm text-amber-700">Due {formatDate(lead.next_follow_up_at, true)}</p>
                    </div>
                    <Phone className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            ) : <EmptyPanel title="Follow-up queue is clear" description="Leads with a due follow-up date will appear here." />}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pipeline snapshot</CardTitle>
          <CardDescription>Current leads grouped by stage</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {Object.entries(data.stats.pipelineStatus).map(([status, count]) => (
            <div key={status} className="rounded-lg border bg-slate-50 p-4">
              <p className="text-2xl font-bold text-slate-950">{count}</p>
              <p className="mt-1 text-xs font-medium text-slate-600">{formatLabel(status)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

interface LeadFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  province: string;
  insuranceInterest: string;
  source: string;
  notes: string;
  nextFollowUpAt: string;
}

const emptyLeadForm: LeadFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  province: '',
  insuranceInterest: 'TERM_LIFE',
  source: 'DIRECT',
  notes: '',
  nextFollowUpAt: '',
};

function LeadFormDialog({ open, onOpenChange, onCreated }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<LeadFormState>(emptyLeadForm);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await crmRequest('leads', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          nextFollowUpAt: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : null,
        }),
      });
      toast({ title: 'Lead added', description: `${form.firstName} ${form.lastName} is now in the pipeline.` });
      setForm(emptyLeadForm);
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast({ title: 'Could not add lead', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add a lead</DialogTitle>
            <DialogDescription>Create a prospect and place them in the Estate Nest pipeline.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="lead-first-name">First name</Label><Input id="lead-first-name" required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="lead-last-name">Last name</Label><Input id="lead-last-name" required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="lead-email">Email</Label><Input id="lead-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="lead-phone">Phone</Label><Input id="lead-phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="lead-province">Province</Label><Input id="lead-province" value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="lead-follow-up">First follow-up</Label><Input id="lead-follow-up" type="datetime-local" value={form.nextFollowUpAt} onChange={(event) => setForm({ ...form, nextFollowUpAt: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="lead-interest">Insurance interest</Label><select id="lead-interest" className={selectClassName} value={form.insuranceInterest} onChange={(event) => setForm({ ...form, insuranceInterest: event.target.value })}>{insuranceInterests.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="lead-source">Source</Label><select id="lead-source" className={selectClassName} value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>{leadSources.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="lead-notes">Notes</Label><Textarea id="lead-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Needs, family context, preferred contact time..." /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add lead</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LeadOutcomeDialog({ lead, nextStatus, onOpenChange, onUpdated }: {
  lead: Lead | null;
  nextStatus: string;
  onOpenChange: (open: boolean) => void;
  onUpdated: (lead: Lead) => void;
}) {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [reason, setReason] = useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [assignedAdvisorId, setAssignedAdvisorId] = useState('');
  const [futureContactConsent, setFutureContactConsent] = useState('UNKNOWN');
  const [stageNotes, setStageNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!lead) return;
    void crmRequest<{ advisors: Advisor[] }>('advisors').then((response) => setAdvisors(response.advisors || [])).catch(() => setAdvisors([]));
  }, [lead]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!lead) return;
    setSaving(true);
    try {
      const response = await crmRequest<{ lead: Lead }>('leads', {
        method: 'PATCH',
        params: { id: lead.id },
        body: JSON.stringify({
          leadStatus: nextStatus,
          reason,
          nextFollowUpAt: new Date(nextFollowUpAt).toISOString(),
          assignedAdvisorId,
          futureContactConsent,
          stageNotes,
        }),
      });
      onUpdated(response.lead);
      toast({ title: 'Outcome recorded', description: `${contactName(lead.contact)} moved to ${formatLabel(nextStatus)} with an audited follow-up record.` });
      onOpenChange(false);
    } catch (requestError) {
      toast({ title: 'Could not record outcome', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return <Dialog open={Boolean(lead)} onOpenChange={onOpenChange}><DialogContent><form onSubmit={submit}><DialogHeader><DialogTitle>Record {formatLabel(nextStatus)}</DialogTitle><DialogDescription>Reason, follow-up, assigned advisor, consent, notes, timestamp, and user are required and audited.</DialogDescription></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label htmlFor="outcome-reason">Reason</Label><Textarea id="outcome-reason" required value={reason} onChange={(event) => setReason(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="outcome-follow-up">Next follow-up</Label><Input id="outcome-follow-up" required type="datetime-local" value={nextFollowUpAt} onChange={(event) => setNextFollowUpAt(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="outcome-advisor">Assigned advisor</Label><select id="outcome-advisor" required className={selectClassName} value={assignedAdvisorId} onChange={(event) => setAssignedAdvisorId(event.target.value)}><option value="">Select advisor</option>{advisors.map((advisor) => <option key={advisor.id} value={advisor.id}>{advisorName(advisor)} · {advisor.email || advisor.phone || 'No contact'}</option>)}</select></div><div className="space-y-2"><Label htmlFor="outcome-consent">Future-contact consent</Label><select id="outcome-consent" className={selectClassName} value={futureContactConsent} onChange={(event) => setFutureContactConsent(event.target.value)}><option value="CONSENTED">Consented</option><option value="DECLINED">Declined</option><option value="UNKNOWN">Unknown / confirm before contact</option></select></div><div className="space-y-2"><Label htmlFor="outcome-notes">Outcome notes</Label><Textarea id="outcome-notes" required value={stageNotes} onChange={(event) => setStageNotes(event.target.value)} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={saving || !reason.trim() || !nextFollowUpAt || !assignedAdvisorId || !stageNotes.trim()}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save outcome</Button></DialogFooter></form></DialogContent></Dialog>;
}

function LeadsPage({ createOpen = false }: { createOpen?: boolean }) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [open, setOpen] = useState(createOpen);
  const [outcome, setOutcome] = useState<{ lead: Lead; status: string } | null>(null);
  const [lifecycle, setLifecycle] = useState<{ lead: Lead; mode: 'archive' | 'restore' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [active, archived] = await Promise.all([
        crmRequest<{ leads: Lead[] }>('leads', { params: { limit: 500 } }),
        crmRequest<{ leads: Lead[] }>('leads', { params: { limit: 500, archived: 'true' } }),
      ]);
      setLeads([...(active.leads || []), ...(archived.leads || [])]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setOpen(createOpen); }, [createOpen]);

  const filteredLeads = useMemo(() => {
    const query = search.toLowerCase().trim();
    return leads.filter((lead) => {
      const matchesStatus = status === 'ALL' || lead.lead_status === status;
      const searchable = `${contactName(lead.contact)} ${lead.contact?.email || ''} ${lead.contact?.phone || ''} ${lead.insurance_interest} ${lead.source}`.toLowerCase();
      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [leads, search, status]);

  const updateStatus = async (lead: Lead, nextStatus: string) => {
    if (nextStatus === 'ARCHIVED') {
      setLifecycle({ lead, mode: 'archive' });
      return;
    }
    if (leadOutcomeStatuses.includes(nextStatus as typeof leadOutcomeStatuses[number])) {
      setOutcome({ lead, status: nextStatus });
      return;
    }
    const previousStatus = lead.lead_status;
    setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, lead_status: nextStatus } : item));
    try {
      await crmRequest('leads', { method: 'PATCH', params: { id: lead.id }, body: JSON.stringify({ leadStatus: nextStatus }) });
      toast({ title: 'Pipeline updated', description: `${contactName(lead.contact)} moved to ${formatLabel(nextStatus)}.` });
    } catch (requestError) {
      setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, lead_status: previousStatus } : item));
      toast({ title: 'Could not update lead', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const lifecycleAction = async (reason: string) => {
    if (!lifecycle) return;
    try {
      if (lifecycle.mode === 'archive') {
        await crmRequest('leads', { method: 'DELETE', params: { id: lifecycle.lead.id }, body: JSON.stringify({ reason }) });
      } else {
        await crmRequest('leads', { method: 'PATCH', params: { id: lifecycle.lead.id }, body: JSON.stringify({ action: 'RESTORE', reason, restoreStage: 'PROSPECT' }) });
      }
      toast({ title: lifecycle.mode === 'archive' ? 'Lead archived' : 'Lead restored' });
      await load();
    } catch (requestError) {
      toast({ title: `Could not ${lifecycle.mode} lead`, description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' });
      throw requestError;
    }
  };

  const closeDialog = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && createOpen) navigate('/management/leads', { replace: true });
  };

  if (loading) return <LoadingPanel label="Loading leads..." />;
  if (error) return <ErrorPanel message={error} retry={load} />;

  return (
    <>
      <PageHeader title="Leads" description={`${leads.filter((lead) => !lead.archived_at).length} active prospects plus ${leads.filter((lead) => lead.archived_at).length} preserved archived records.`} action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Add lead</Button>} />
      <Card>
        <CardHeader>
          <div className="grid gap-3 md:grid-cols-[1fr_240px]">
            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input aria-label="Search leads" className="pl-9" placeholder="Search name, email, phone, product, or source" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <select aria-label="Filter by lead status" className={selectClassName} value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All pipeline stages</option>{leadStatuses.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLeads.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Prospect</TableHead><TableHead>Insurance</TableHead><TableHead>Source</TableHead><TableHead>Stage</TableHead><TableHead>Created</TableHead><TableHead className="w-12"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer" onClick={() => navigate(`/management/leads/${lead.id}`)}>
                    <TableCell><p className="font-medium text-slate-900">{contactName(lead.contact)}</p><p className="text-xs text-slate-500">{lead.contact?.email || lead.contact?.phone || 'No contact method'}</p></TableCell>
                    <TableCell>{formatLabel(lead.insurance_interest)}</TableCell>
                    <TableCell>{formatLabel(lead.source)}</TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}><select aria-label={`Pipeline stage for ${contactName(lead.contact)}`} disabled={Boolean(lead.archived_at)} className="h-9 max-w-52 rounded-md border bg-white px-2 text-xs disabled:bg-slate-100" value={lead.lead_status} onChange={(event) => void updateStatus(lead, event.target.value)}>{leadStatuses.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></TableCell>
                    <TableCell>{formatDate(lead.created_at)}</TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}><Button aria-label={`${lead.archived_at ? 'Restore' : 'Archive'} lead for ${contactName(lead.contact)}`} variant="ghost" size="icon" onClick={() => setLifecycle({ lead, mode: lead.archived_at ? 'restore' : 'archive' })}>{lead.archived_at ? <RotateCcw className="h-4 w-4 text-emerald-600" /> : <Archive className="h-4 w-4 text-slate-500" />}</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <EmptyPanel title="No matching leads" description="Change the search or status filter, or add a new prospect." />}
        </CardContent>
      </Card>
      <LeadFormDialog open={open} onOpenChange={closeDialog} onCreated={load} />
      <LeadOutcomeDialog lead={outcome?.lead || null} nextStatus={outcome?.status || ''} onOpenChange={(nextOpen) => { if (!nextOpen) setOutcome(null); }} onUpdated={(updated) => setLeads((current) => current.map((lead) => lead.id === updated.id ? updated : lead))} />
      {lifecycle && <LifecycleDialog open onOpenChange={(nextOpen) => { if (!nextOpen) setLifecycle(null); }} mode={lifecycle.mode} recordLabel={`lead for ${contactName(lifecycle.lead.contact)}`} onConfirm={lifecycleAction} />}
    </>
  );
}

function LeadDetailPage() {
  const { leadId = '' } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [outcomeStatus, setOutcomeStatus] = useState('');
  const [lifecycleOpen, setLifecycleOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await crmRequest<{ lead: Lead }>('leads', { params: { id: leadId } });
      setLead(response.lead);
      setNotes(response.lead.notes || '');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { void load(); }, [load]);

  const save = async (changes: Record<string, unknown>) => {
    if (!lead) return;
    setSaving(true);
    try {
      const response = await crmRequest<{ lead: Lead }>('leads', { method: 'PATCH', params: { id: lead.id }, body: JSON.stringify(changes) });
      setLead(response.lead);
      toast({ title: 'Lead updated' });
    } catch (requestError) {
      toast({ title: 'Could not update lead', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const lifecycleAction = async (reason: string) => {
    if (!lead) return;
    try {
      if (lead.archived_at) {
        await crmRequest('leads', { method: 'PATCH', params: { id: lead.id }, body: JSON.stringify({ action: 'RESTORE', reason, restoreStage: 'PROSPECT' }) });
        await load();
      } else {
        await crmRequest('leads', { method: 'DELETE', params: { id: lead.id }, body: JSON.stringify({ reason }) });
        navigate('/management/leads');
      }
    } catch (requestError) {
      toast({ title: `Could not ${lead.archived_at ? 'restore' : 'archive'} lead`, description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' });
      throw requestError;
    }
  };

  const requestStatusChange = (nextStatus: string) => {
    if (nextStatus === 'ARCHIVED') {
      setLifecycleOpen(true);
    } else if (leadOutcomeStatuses.includes(nextStatus as typeof leadOutcomeStatuses[number])) {
      setOutcomeStatus(nextStatus);
    } else {
      void save({ leadStatus: nextStatus });
    }
  };

  if (loading) return <LoadingPanel label="Loading lead..." />;
  if (error || !lead) return <ErrorPanel message={error || 'Lead not found'} retry={load} />;

  return (
    <>
      <div className="mb-5"><Button variant="ghost" asChild><Link to="/management/leads"><ArrowLeft className="mr-2 h-4 w-4" />Back to leads</Link></Button></div>
      <PageHeader title={contactName(lead.contact)} description={`${lead.public_id || 'Lead'} · ${formatLabel(lead.insurance_interest)} from ${formatLabel(lead.source)}`} action={<Button variant="outline" onClick={() => setLifecycleOpen(true)}>{lead.archived_at ? <RotateCcw className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}{lead.archived_at ? 'Restore lead' : 'Archive lead'}</Button>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Pipeline details</CardTitle><CardDescription>Update the stage and follow-up information.</CardDescription></CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="detail-stage">Pipeline stage</Label><select id="detail-stage" disabled={Boolean(lead.archived_at)} className={selectClassName} value={lead.lead_status} onChange={(event) => requestStatusChange(event.target.value)}>{leadStatuses.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="detail-follow-up">Next follow-up</Label><Input id="detail-follow-up" type="datetime-local" onChange={(event) => void save({ nextFollowUpAt: event.target.value ? new Date(event.target.value).toISOString() : null })} /></div>
            <div className="space-y-2"><Label htmlFor="detail-last-contact">Last contact</Label><Input id="detail-last-contact" type="datetime-local" onChange={(event) => void save({ lastContactAt: event.target.value ? new Date(event.target.value).toISOString() : null })} /></div>
            <div className="rounded-lg border bg-slate-50 p-3 text-sm"><p className="text-slate-500">Assigned advisor</p><p>{lead.assigned_advisor_id ? 'Assigned in CRM' : 'Not assigned'}</p></div>
            {lead.outcome_reason && <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:col-span-2"><p className="font-medium text-amber-900">Outcome details</p><p className="text-sm text-amber-800">{lead.outcome_reason}</p><p className="text-xs text-amber-700">Consent: {formatLabel(lead.future_contact_consent)} · {lead.stage_notes}</p></div>}
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="detail-notes">Advisor notes</Label><Textarea id="detail-notes" rows={7} value={notes} onChange={(event) => setNotes(event.target.value)} /><Button disabled={saving} onClick={() => void save({ notes })}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save notes</Button></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Contact</CardTitle><CardDescription>Prospect communication details</CardDescription></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div><p className="text-slate-500">Email</p>{lead.contact?.email ? <a className="font-medium text-primary underline" href={`mailto:${lead.contact.email}`}>{lead.contact.email}</a> : <p>Not provided</p>}</div>
            <div><p className="text-slate-500">Phone</p>{lead.contact?.phone ? <a className="font-medium text-primary underline" href={`tel:${lead.contact.phone}`}>{lead.contact.phone}</a> : <p>Not provided</p>}</div>
            <div><p className="text-slate-500">Location</p><p>{[lead.contact?.city, lead.contact?.province].filter(Boolean).join(', ') || 'Not provided'}</p></div>
            <div><p className="text-slate-500">Created</p><p>{formatDate(lead.created_at, true)}</p></div>
            {lead.contact_id && <Button variant="outline" className="w-full" asChild><Link to={`/management/contacts/${lead.contact_id}`}>Open contact record</Link></Button>}
          </CardContent>
        </Card>
      </div>
      <LeadOutcomeDialog lead={outcomeStatus ? lead : null} nextStatus={outcomeStatus} onOpenChange={(nextOpen) => { if (!nextOpen) setOutcomeStatus(''); }} onUpdated={(updated) => { setLead(updated); setOutcomeStatus(''); }} />
      <LifecycleDialog open={lifecycleOpen} onOpenChange={setLifecycleOpen} mode={lead.archived_at ? 'restore' : 'archive'} recordLabel={`lead for ${contactName(lead.contact)}`} onConfirm={lifecycleAction} />
    </>
  );
}

interface ContactFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  province: string;
  city: string;
  postalCode: string;
  leadSource: string;
  nextFollowUpAt: string;
  preferredContactMethod: string;
}

const emptyContactForm: ContactFormState = { firstName: '', lastName: '', email: '', phone: '', alternatePhone: '', address: '', province: '', city: '', postalCode: '', leadSource: 'DIRECT', nextFollowUpAt: '', preferredContactMethod: 'EITHER' };

function ContactFormDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: () => void }) {
  const [form, setForm] = useState<ContactFormState>(emptyContactForm);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await crmRequest('contacts', { method: 'POST', body: JSON.stringify({ ...form, nextFollowUpAt: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : null }) });
      toast({ title: 'Contact added', description: `${form.firstName} ${form.lastName} is now in the CRM.` });
      setForm(emptyContactForm);
      onOpenChange(false);
      onCreated();
    } catch (requestError) {
      toast({ title: 'Could not add contact', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit}>
          <DialogHeader><DialogTitle>Add a contact</DialogTitle><DialogDescription>Create a client or prospect contact record.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-5 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="contact-first-name">First name</Label><Input id="contact-first-name" required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="contact-last-name">Last name</Label><Input id="contact-last-name" required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="contact-email">Email</Label><Input id="contact-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="contact-phone">Phone</Label><Input id="contact-phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="contact-alt-phone">Alternate phone</Label><Input id="contact-alt-phone" value={form.alternatePhone} onChange={(event) => setForm({ ...form, alternatePhone: event.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="contact-address">Address</Label><Input id="contact-address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="contact-city">City</Label><Input id="contact-city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="contact-province">Province</Label><Input id="contact-province" value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="contact-postal">Postal code</Label><Input id="contact-postal" value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="contact-source">Lead source</Label><select id="contact-source" className={selectClassName} value={form.leadSource} onChange={(event) => setForm({ ...form, leadSource: event.target.value })}>{leadSources.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="contact-follow-up">Next follow-up</Label><Input id="contact-follow-up" type="datetime-local" value={form.nextFollowUpAt} onChange={(event) => setForm({ ...form, nextFollowUpAt: event.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="contact-method">Preferred contact method</Label><select id="contact-method" className={selectClassName} value={form.preferredContactMethod} onChange={(event) => setForm({ ...form, preferredContactMethod: event.target.value })}><option value="EITHER">Phone or email</option><option value="PHONE">Phone</option><option value="EMAIL">Email</option><option value="TEXT">Text message</option></select></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add contact</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContactsPage({ createOpen = false }: { createOpen?: boolean }) {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(createOpen);
  const [lifecycle, setLifecycle] = useState<{ contact: Contact; mode: 'archive' | 'restore' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [active, archived] = await Promise.all([
        crmRequest<{ contacts: Contact[] }>('contacts', { params: { limit: 500 } }),
        crmRequest<{ contacts: Contact[] }>('contacts', { params: { limit: 500, archived: 'true' } }),
      ]);
      setContacts([...(active.contacts || []), ...(archived.contacts || [])]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setOpen(createOpen); }, [createOpen]);

  const filteredContacts = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return contacts;
    return contacts.filter((contact) => `${contactName(contact)} ${contact.email || ''} ${contact.phone || ''} ${contact.city || ''} ${contact.province || ''}`.toLowerCase().includes(query));
  }, [contacts, search]);

  const lifecycleAction = async (reason: string) => {
    if (!lifecycle) return;
    try {
      if (lifecycle.mode === 'archive') await crmRequest('contacts', { method: 'DELETE', params: { id: lifecycle.contact.id }, body: JSON.stringify({ reason }) });
      else await crmRequest('contacts', { method: 'PATCH', params: { id: lifecycle.contact.id }, body: JSON.stringify({ action: 'RESTORE', reason }) });
      toast({ title: lifecycle.mode === 'archive' ? 'Client record archived' : 'Client record restored' });
      await load();
    } catch (requestError) {
      toast({ title: `Could not ${lifecycle.mode} client record`, description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' });
      throw requestError;
    }
  };

  const closeDialog = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && createOpen) navigate('/management/contacts', { replace: true });
  };

  if (loading) return <LoadingPanel label="Loading contacts..." />;
  if (error) return <ErrorPanel message={error} retry={load} />;

  return (
    <>
      <PageHeader title="Clients" description={`${contacts.filter((contact) => !contact.archived_at).length} active client/prospect records and ${contacts.filter((contact) => contact.archived_at).length} archived records.`} action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Add client</Button>} />
      <Card>
        <CardHeader><div className="relative max-w-xl"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" placeholder="Search name, email, phone, or location" value={search} onChange={(event) => setSearch(event.target.value)} /></div></CardHeader>
        <CardContent>
          {filteredContacts.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Location</TableHead><TableHead>Added</TableHead><TableHead className="w-12"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id} className="cursor-pointer" onClick={() => navigate(`/management/contacts/${contact.id}`)}>
                    <TableCell className="font-medium">{contactName(contact)}{contact.archived_at && <Badge variant="outline" className="ml-2">Archived</Badge>}</TableCell>
                    <TableCell>{contact.email || '—'}</TableCell>
                    <TableCell>{contact.phone || '—'}</TableCell>
                    <TableCell>{[contact.city, contact.province].filter(Boolean).join(', ') || '—'}</TableCell>
                    <TableCell>{formatDate(contact.created_at)}</TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}><Button aria-label={`${contact.archived_at ? 'Restore' : 'Archive'} ${contactName(contact)}`} variant="ghost" size="icon" onClick={() => setLifecycle({ contact, mode: contact.archived_at ? 'restore' : 'archive' })}>{contact.archived_at ? <RotateCcw className="h-4 w-4 text-emerald-600" /> : <Archive className="h-4 w-4 text-slate-500" />}</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <EmptyPanel title="No matching contacts" description="Change the search or create a new contact record." />}
        </CardContent>
      </Card>
      <ContactFormDialog open={open} onOpenChange={closeDialog} onCreated={load} />
      {lifecycle && <LifecycleDialog open onOpenChange={(nextOpen) => { if (!nextOpen) setLifecycle(null); }} mode={lifecycle.mode} recordLabel={contactName(lifecycle.contact)} onConfirm={lifecycleAction} />}
    </>
  );
}

function ContactDetailPage() {
  const { contactId = '' } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [lifecycleOpen, setLifecycleOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await crmRequest<{ contact: Contact }>('contacts', { params: { id: contactId } });
      setContact(response.contact);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => { void load(); }, [load]);

  const lifecycleAction = async (reason: string) => {
    if (!contact) return;
    if (contact.archived_at) {
      await crmRequest('contacts', { method: 'PATCH', params: { id: contact.id }, body: JSON.stringify({ action: 'RESTORE', reason }) });
      await load();
    } else {
      await crmRequest('contacts', { method: 'DELETE', params: { id: contact.id }, body: JSON.stringify({ reason }) });
      navigate('/management/contacts');
    }
  };

  if (loading) return <LoadingPanel label="Loading contact..." />;
  if (error || !contact) return <ErrorPanel message={error || 'Contact not found'} retry={load} />;

  return (
    <>
      <div className="mb-5"><Button variant="ghost" asChild><Link to="/management/contacts"><ArrowLeft className="mr-2 h-4 w-4" />Back to contacts</Link></Button></div>
      <PageHeader title={contactName(contact)} description="Client and prospect contact record" action={<Button variant="outline" onClick={() => setLifecycleOpen(true)}>{contact.archived_at ? <RotateCcw className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}{contact.archived_at ? 'Restore client' : 'Archive client'}</Button>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Contact details</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 text-slate-400" /><div><p className="text-slate-500">Email</p>{contact.email ? <a className="font-medium text-primary underline" href={`mailto:${contact.email}`}>{contact.email}</a> : <p>Not provided</p>}</div></div>
            <div className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 text-slate-400" /><div><p className="text-slate-500">Phone</p>{contact.phone ? <a className="font-medium text-primary underline" href={`tel:${contact.phone}`}>{contact.phone}</a> : <p>Not provided</p>}</div></div>
            <div><p className="text-slate-500">Alternate phone</p><p>{contact.alternate_phone || 'Not provided'}</p></div>
            <div><p className="text-slate-500">Address</p><p>{[contact.address, contact.city, contact.province, contact.postal_code].filter(Boolean).join(', ') || 'Not provided'}</p></div>
            <div><p className="text-slate-500">Lead source</p><p>{formatLabel(contact.lead_source)}</p></div>
            <div><p className="text-slate-500">Last contact</p><p>{formatDate(contact.last_contact_at)}</p></div>
            <div><p className="text-slate-500">Next follow-up</p><p>{formatDate(contact.next_follow_up_at)}</p></div>
            <div><p className="text-slate-500">Preferred method</p><p>{formatLabel(contact.preferred_contact_method)}</p></div>
            <div><p className="text-slate-500">Marketing consent</p><p>{contact.marketing_consent ? 'Granted' : 'Not granted'}</p></div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Associated leads</CardTitle><CardDescription>Insurance opportunities linked to this contact</CardDescription></CardHeader>
          <CardContent>
            {contact.leads?.length ? <div className="space-y-3">{contact.leads.map((lead) => <Link key={lead.id} to={`/management/leads/${lead.id}`} className="flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50"><div><p className="font-medium">{formatLabel(lead.insurance_interest)}</p><p className="text-sm text-slate-500">Created {formatDate(lead.created_at)}</p></div><StatusBadge status={lead.lead_status} /></Link>)}</div> : <EmptyPanel title="No associated leads" description="Create a lead and select this contact to connect an insurance opportunity." />}
          </CardContent>
        </Card>
      </div>
      <LifecycleDialog open={lifecycleOpen} onOpenChange={setLifecycleOpen} mode={contact.archived_at ? 'restore' : 'archive'} recordLabel={contactName(contact)} onConfirm={lifecycleAction} />
    </>
  );
}

const pipelineStages = leadStatuses.filter((stage) => stage !== 'ARCHIVED');

function PipelinePage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await crmRequest<{ leads: Lead[] }>('leads', { params: { limit: 500 } });
      setLeads(response.leads || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const move = async (lead: Lead, leadStatus: string) => {
    if (leadOutcomeStatuses.includes(leadStatus as typeof leadOutcomeStatuses[number])) {
      toast({ title: 'Additional outcome details required', description: 'Complete reason, follow-up, advisor, consent, and notes on the lead record.' });
      navigate(`/management/leads/${lead.id}`);
      return;
    }
    setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, lead_status: leadStatus } : item));
    try {
      await crmRequest('leads', { method: 'PATCH', params: { id: lead.id }, body: JSON.stringify({ leadStatus }) });
    } catch (requestError) {
      toast({ title: 'Could not move lead', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' });
      void load();
    }
  };

  if (loading) return <LoadingPanel label="Building pipeline..." />;
  if (error) return <ErrorPanel message={error} retry={load} />;

  return (
    <>
      <PageHeader title="Pipeline" description="Move prospects through the advisory process while keeping a complete status trail." action={<Button asChild><Link to="/management/leads/new"><Plus className="mr-2 h-4 w-4" />Add lead</Link></Button>} />
      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4">
          {pipelineStages.map((stage) => {
            const stageLeads = leads.filter((lead) => lead.lead_status === stage);
            return (
              <section key={stage} className="w-72 shrink-0 rounded-xl border bg-slate-100/80 p-3" aria-labelledby={`pipeline-${stage}`}>
                <div className="mb-3 flex items-center justify-between"><h2 id={`pipeline-${stage}`} className="text-sm font-semibold text-slate-800">{formatLabel(stage)}</h2><Badge variant="secondary">{stageLeads.length}</Badge></div>
                <div className="space-y-3">
                  {stageLeads.map((lead) => (
                    <Card key={lead.id} className="bg-white">
                      <CardContent className="p-4">
                        <Link to={`/management/leads/${lead.id}`} className="font-medium text-slate-900 hover:underline">{contactName(lead.contact)}</Link>
                        <p className="mt-1 text-xs text-slate-500">{formatLabel(lead.insurance_interest)}</p>
                        <select aria-label={`Move ${contactName(lead.contact)}`} className="mt-3 h-8 w-full rounded-md border bg-white px-2 text-xs" value={lead.lead_status} onChange={(event) => void move(lead, event.target.value)}>{leadStatuses.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select>
                      </CardContent>
                    </Card>
                  ))}
                  {!stageLeads.length && <p className="rounded-lg border border-dashed bg-white/70 px-3 py-6 text-center text-xs text-slate-400">No leads in this stage</p>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}

type OperationsResource = 'tasks' | 'appointments' | 'content';

interface OperationItem {
  id: string;
  status: string;
  title?: string;
  description?: string | null;
  priority?: string;
  due_date?: string | null;
  appointment_date?: string | null;
  duration_minutes?: number;
  meeting_type?: string;
  body?: string | null;
  content_type?: string;
  created_at?: string;
  lead?: Lead | null;
}

function OperationsPage({ resource, createOpen = false }: { resource: OperationsResource; createOpen?: boolean }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<OperationItem[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [open, setOpen] = useState(createOpen);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    title: '', description: '', leadId: '', dueDate: '', priority: 'MEDIUM', appointmentDate: '', durationMinutes: '30', meetingType: 'PHONE', meetingLink: '', notes: '', contentType: 'SOCIAL_POST', body: '',
  });
  const titles = {
    tasks: ['Tasks', 'Advisor follow-ups and internal action items.'],
    appointments: ['Appointments', 'Consultations connected to active insurance leads.'],
    content: ['Content', 'Compliance-aware drafts for social, email, blogs, and landing pages.'],
  } as const;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [collection, leadResponse] = await Promise.all([
        crmRequest<{ items: OperationItem[] }>(resource),
        resource === 'content' ? Promise.resolve({ leads: [] as Lead[] }) : crmRequest<{ leads: Lead[] }>('leads', { params: { limit: 500 } }),
      ]);
      setItems(collection.items || []);
      setLeads(leadResponse.leads || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setOpen(createOpen); }, [createOpen]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = resource === 'tasks'
        ? { title: form.title, description: form.description, leadId: form.leadId || null, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null, priority: form.priority }
        : resource === 'appointments'
          ? { leadId: form.leadId, appointmentDate: form.appointmentDate ? new Date(form.appointmentDate).toISOString() : '', durationMinutes: Number(form.durationMinutes), meetingType: form.meetingType, meetingLink: form.meetingLink, notes: form.notes }
          : { title: form.title, body: form.body, contentType: form.contentType, sourceAgent: 'MANUAL' };
      await crmRequest(resource, { method: 'POST', body: JSON.stringify(payload) });
      toast({ title: `${titles[resource][0].slice(0, -1)} added` });
      setOpen(false);
      if (createOpen) navigate(`/management/${resource}`, { replace: true });
      setForm({ title: '', description: '', leadId: '', dueDate: '', priority: 'MEDIUM', appointmentDate: '', durationMinutes: '30', meetingType: 'PHONE', meetingLink: '', notes: '', contentType: 'SOCIAL_POST', body: '' });
      await load();
    } catch (requestError) {
      toast({ title: `Could not add ${titles[resource][0].toLowerCase().slice(0, -1)}`, description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (item: OperationItem, status: string) => {
    try {
      await crmRequest(resource, { method: 'PATCH', params: { id: item.id }, body: JSON.stringify({ status }) });
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status } : entry));
    } catch (requestError) {
      toast({ title: 'Could not update item', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const remove = async (item: OperationItem) => {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    try {
      await crmRequest(resource, { method: 'DELETE', params: { id: item.id } });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (requestError) {
      toast({ title: 'Could not delete item', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const statusOptions = resource === 'tasks' ? ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] : resource === 'appointments' ? ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] : ['AI_GENERATED', 'APPROVED', 'PUBLISHED'];

  if (loading) return <LoadingPanel label={`Loading ${resource}...`} />;
  if (error) return <ErrorPanel message={error} retry={load} />;

  return (
    <>
      <PageHeader title={titles[resource][0]} description={titles[resource][1]} action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Add {titles[resource][0].toLowerCase().slice(0, -1)}</Button>} />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const linkedContact = item.lead?.contact;
          const title = resource === 'tasks' ? item.title : resource === 'appointments' ? contactName(linkedContact) : item.title;
          const detail = resource === 'tasks' ? item.description : resource === 'appointments' ? `${formatLabel(item.lead?.insurance_interest)} · ${formatDate(item.appointment_date, true)}` : item.body;
          return (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3"><div><CardTitle className="text-lg">{title}</CardTitle><CardDescription className="mt-2 line-clamp-2">{detail || 'No additional details'}</CardDescription></div><Button aria-label="Delete item" variant="ghost" size="icon" onClick={() => void remove(item)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>
              </CardHeader>
              <CardContent className="space-y-3">
                {resource === 'tasks' && <p className="text-sm text-slate-500">Due {formatDate(item.due_date, true)} · {formatLabel(item.priority)}</p>}
                {resource === 'appointments' && <p className="text-sm text-slate-500">{formatLabel(item.meeting_type)} · {item.duration_minutes} minutes</p>}
                {resource === 'content' && <p className="text-sm text-slate-500">{formatLabel(item.content_type)} · {formatDate(item.created_at)}</p>}
                <select aria-label={`Status for ${title}`} className={selectClassName} value={item.status} onChange={(event) => void updateStatus(item, event.target.value)}>{statusOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {!items.length && <Card><CardContent className="pt-6"><EmptyPanel title={`No ${resource} yet`} description={`Add the first ${titles[resource][0].toLowerCase().slice(0, -1)} to begin using this workflow.`} /></CardContent></Card>}

      <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen && createOpen) navigate(`/management/${resource}`, { replace: true }); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <form onSubmit={create}>
            <DialogHeader><DialogTitle>Add {titles[resource][0].toLowerCase().slice(0, -1)}</DialogTitle><DialogDescription>{titles[resource][1]}</DialogDescription></DialogHeader>
            <div className="space-y-4 py-5">
              {resource === 'tasks' && <><div className="space-y-2"><Label htmlFor="task-title">Title</Label><Input id="task-title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="task-description">Description</Label><Textarea id="task-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="task-lead">Related lead</Label><select id="task-lead" className={selectClassName} value={form.leadId} onChange={(event) => setForm({ ...form, leadId: event.target.value })}><option value="">No related lead</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{contactName(lead.contact)} — {formatLabel(lead.insurance_interest)}</option>)}</select></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="task-due">Due date</Label><Input id="task-due" type="datetime-local" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="task-priority">Priority</Label><select id="task-priority" className={selectClassName} value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></div></div></>}
              {resource === 'appointments' && <><div className="space-y-2"><Label htmlFor="appointment-lead">Lead</Label><select id="appointment-lead" required className={selectClassName} value={form.leadId} onChange={(event) => setForm({ ...form, leadId: event.target.value })}><option value="">Select a lead</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{contactName(lead.contact)} — {formatLabel(lead.insurance_interest)}</option>)}</select></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="appointment-date">Date and time</Label><Input id="appointment-date" required type="datetime-local" value={form.appointmentDate} onChange={(event) => setForm({ ...form, appointmentDate: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="appointment-duration">Duration</Label><Input id="appointment-duration" type="number" min="15" max="240" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} /></div></div><div className="space-y-2"><Label htmlFor="appointment-type">Meeting type</Label><select id="appointment-type" className={selectClassName} value={form.meetingType} onChange={(event) => setForm({ ...form, meetingType: event.target.value })}><option value="PHONE">Phone</option><option value="VIDEO">Video</option><option value="IN_PERSON">In person</option></select></div><div className="space-y-2"><Label htmlFor="appointment-link">Meeting link</Label><Input id="appointment-link" type="url" value={form.meetingLink} onChange={(event) => setForm({ ...form, meetingLink: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="appointment-notes">Notes</Label><Textarea id="appointment-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div></>}
              {resource === 'content' && <><div className="space-y-2"><Label htmlFor="content-title">Title</Label><Input id="content-title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="content-type">Content type</Label><select id="content-type" className={selectClassName} value={form.contentType} onChange={(event) => setForm({ ...form, contentType: event.target.value })}><option value="SOCIAL_POST">Social post</option><option value="BLOG_POST">Blog post</option><option value="EMAIL_CAMPAIGN">Email campaign</option><option value="LANDING_PAGE">Landing page</option><option value="AD_COPY">Ad copy</option></select></div><div className="space-y-2"><Label htmlFor="content-body">Draft</Label><Textarea id="content-body" rows={10} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></div></>}
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface IntegrationsResponse {
  integrations: Record<string, boolean>;
  user: { role: string; environmentManagedPassword: boolean };
}

interface MfaStatusResponse {
  currentLevel: string | null;
  nextLevel: string | null;
  totpEnrolled: boolean;
  factors: Array<{ id: string; friendlyName: string; status: string; createdAt: string }>;
  passkeyAvailable: boolean;
  passkeyStatus: string;
}

function SettingsPage({ user }: { user: ManagementUser }) {
  const [data, setData] = useState<IntegrationsResponse | null>(null);
  const [mfa, setMfa] = useState<MfaStatusResponse | null>(null);
  const [defaultBcc, setDefaultBcc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [integrationResponse, settingsResponse, mfaResponse] = await Promise.all([
        crmRequest<IntegrationsResponse>('integrations'),
        crmRequest<{ email: { defaultBcc: string[] } }>('management-settings'),
        fetch('/api/auth/mfa', { credentials: 'include' }),
      ]);
      if (!mfaResponse.ok) throw new Error('Unable to verify MFA status');
      setData(integrationResponse);
      setDefaultBcc(settingsResponse.email.defaultBcc.join(', '));
      setMfa(await mfaResponse.json());
    }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unknown error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/auth/reset-password', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(passwords) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Password update failed');
      setPasswords({ currentPassword: '', newPassword: '' });
      toast({ title: 'Password updated' });
    } catch (requestError) {
      toast({ title: 'Could not update password', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const saveDefaultBcc = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await crmRequest<{ email: { defaultBcc: string[] } }>('management-settings', { method: 'PATCH', body: JSON.stringify({ defaultBcc }) });
      setDefaultBcc(response.email.defaultBcc.join(', '));
      toast({ title: 'Default BCC updated', description: 'Client, advisor, compliance, commission, and report composers now use this central setting.' });
    } catch (requestError) {
      toast({ title: 'Could not update default BCC', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingPanel label="Checking integrations..." />;
  if (error || !data) return <ErrorPanel message={error || 'No settings data returned'} retry={load} />;

  return (
    <>
      <PageHeader title="Settings" description="Security, integrations, and management account status." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Integration health</CardTitle><CardDescription>Configuration status only; secret values are never shown.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {Object.entries(data.integrations).map(([name, connected]) => <div key={name} className="flex items-center justify-between rounded-lg border p-3"><span className="text-sm font-medium">{formatLabel(name.replace(/([a-z])([A-Z])/g, '$1_$2'))}</span>{connected ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-slate-300" />}</div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Management account</CardTitle><CardDescription>{user.email} · {formatLabel(user.role)}</CardDescription></CardHeader>
          <CardContent>
            {data.user.environmentManagedPassword ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">This account password is managed privately in Vercel environment variables.</div> : (
              <form className="space-y-4" onSubmit={changePassword}>
                <div className="space-y-2"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={12} required value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} /><p className="text-xs text-slate-500">Use at least 12 characters and a password not used elsewhere.</p></div>
                <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update password</Button>
              </form>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Authenticator security</CardTitle><CardDescription>Supabase first factor plus TOTP assurance level</CardDescription></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-lg border p-3"><span>Current session</span><Badge className={mfa?.currentLevel === 'aal2' ? 'bg-emerald-600' : 'bg-amber-600'}>{(mfa?.currentLevel || 'unknown').toUpperCase()}</Badge></div>
            <div className="flex items-center justify-between rounded-lg border p-3"><span>TOTP authenticator</span>{mfa?.totpEnrolled ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-red-500" />}</div>
            {mfa?.factors.map((factor) => <div key={factor.id} className="rounded-lg border bg-slate-50 p-3"><p className="font-medium">{factor.friendlyName}</p><p className="text-xs text-slate-500">{formatLabel(factor.status)} · enrolled {formatDate(factor.createdAt)}</p></div>)}
            <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-cyan-900"><p className="font-medium">Passkey audit</p><p className="mt-1 text-xs">{mfa?.passkeyStatus || 'Passkey status unavailable.'} Browser biometric/password-manager prompts are not Estate Nest MFA.</p></div>
            <p className="text-xs text-slate-500">Lost-device recovery requires owner identity verification and protected factor removal in Supabase. It never bypasses MFA.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Central email controls</CardTitle><CardDescription>One visible default BCC for every management email module</CardDescription></CardHeader>
          <CardContent><form className="space-y-4" onSubmit={saveDefaultBcc}><div className="space-y-2"><Label htmlFor="default-bcc">Default BCC addresses</Label><Input id="default-bcc" value={defaultBcc} onChange={(event) => setDefaultBcc(event.target.value)} placeholder="kanwar@estatenest.ca" /><p className="text-xs text-slate-500">Separate multiple approved addresses with commas. This is configuration, not a secret.</p></div><Button type="submit" disabled={saving}>Save email setting</Button></form></CardContent>
        </Card>
      </div>
    </>
  );
}

function ManagementNotFound() {
  return (
    <Card>
      <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
        <ShieldCheck className="mb-4 h-12 w-12 text-slate-300" />
        <h1 className="text-2xl font-bold">Management page not found</h1>
        <p className="mt-2 max-w-md text-slate-500">This address is not part of the management portal. Your session is still active.</p>
        <Button className="mt-5" asChild><Link to="/management/dashboard">Return to dashboard</Link></Button>
      </CardContent>
    </Card>
  );
}

function ManagementRoutes({ user }: { user: ManagementUser }) {
  const hasPrivilegedOperationsAccess = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role.toUpperCase());
  const privilegedElement = (element: React.ReactNode) => hasPrivilegedOperationsAccess ? element : <Navigate to="/management/access-denied" replace />;
  return (
    <><OperationsAccessNotice role={user.role} /><Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardHome user={user} />} />
      <Route path="leads" element={<LeadsPage />} />
      <Route path="leads/new" element={<LeadsPage createOpen />} />
      <Route path="leads/:leadId" element={<LeadDetailPage />} />
      <Route path="contacts" element={<ContactsPage />} />
      <Route path="contacts/new" element={<ContactsPage createOpen />} />
      <Route path="contacts/:contactId" element={<ContactDetailPage />} />
      <Route path="pipeline" element={<PipelinePage />} />
      <Route path="advisors" element={<AdvisorsPage />} />
      <Route path="advisors/:advisorId" element={<AdvisorDetailPage />} />
      <Route path="compliance" element={privilegedElement(<CompliancePage />)} />
      <Route path="commissions" element={privilegedElement(<CommissionsPage />)} />
      <Route path="email" element={<CommunicationsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="appointments" element={<OperationsPage resource="appointments" />} />
      <Route path="appointments/new" element={<OperationsPage resource="appointments" createOpen />} />
      <Route path="tasks" element={<OperationsPage resource="tasks" />} />
      <Route path="content" element={<OperationsPage resource="content" />} />
      <Route path="reports" element={privilegedElement(<ReportsOperationsPage />)} />
      <Route path="settings" element={<SettingsPage user={user} />} />
      <Route path="*" element={<ManagementNotFound />} />
    </Routes></>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<ManagementUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include', headers: { Accept: 'application/json' } });
        if (!response.ok) {
          navigate(response.status === 403 ? '/management/access-denied' : '/management/login', { replace: true });
          return;
        }
        const payload = await response.json().catch(() => null) as { user?: ManagementUser } | null;
        if (!payload?.user) {
          navigate('/management/login', { replace: true });
          return;
        }
        if (active) setUser(payload.user);
      } catch {
        navigate('/management/login', { replace: true });
      } finally {
        if (active) setCheckingSession(false);
      }
    };
    void checkSession();
    return () => { active = false; };
  }, [navigate]);

  useEffect(() => {
    const current = navItems.find((item) => location.pathname.startsWith(item.path));
    document.title = `${current?.label || 'Management'} | Estate Nest`;
  }, [location.pathname]);

  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); }
    finally { navigate('/management/login', { replace: true }); }
  };

  if (checkingSession || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100"><Loader2 className="h-7 w-7 animate-spin text-primary" /><span className="ml-3 text-slate-600">Verifying secure session...</span></div>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950 text-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 lg:px-6">
          <Link to="/management/dashboard" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary"><ShieldCheck className="h-5 w-5" /></span>
            <span><span className="block font-semibold leading-tight">Estate Nest</span><span className="block text-xs text-slate-400">Management CRM</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-medium">{user.firstName || user.username}</p><p className="text-xs text-slate-400">{user.email}</p></div>
            <Button variant="ghost" size="sm" className="text-slate-200 hover:bg-slate-800 hover:text-white" onClick={() => void logout()}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
          </div>
        </div>
        <nav className="border-t border-slate-800 bg-slate-900" aria-label="Management navigation">
          <div className="mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-3 py-2 lg:px-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${isActive ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}><Icon className="h-4 w-4" />{item.label}</NavLink>;
            })}
          </div>
        </nav>
      </header>

      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-[1600px] gap-2 overflow-x-auto px-4 py-3 lg:px-6">
          <Button size="sm" asChild><Link to="/management/leads/new"><Plus className="mr-2 h-4 w-4" />Add lead</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/management/contacts/new"><Plus className="mr-2 h-4 w-4" />Add contact</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/management/appointments/new"><CalendarDays className="mr-2 h-4 w-4" />Schedule</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/management/advisors"><UserPlus className="mr-2 h-4 w-4" />Add advisor</Link></Button>
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-6 lg:py-8">
        <ManagementRoutes user={user} />
      </main>
    </div>
  );
};

export default Dashboard;
