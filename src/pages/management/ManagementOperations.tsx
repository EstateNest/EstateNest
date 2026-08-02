import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  AlertCircle, Archive, ArrowLeft, Bell, Download, FileCheck2,
  FileWarning, Loader2, Mail, Plus, RefreshCw, RotateCcw, Search, Send,
  ShieldCheck, Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  type Advisor, type AdvisorCompliance, type AdvisorContract, type Commission, type Contact, type EmailMessage,
  type QuoteNotification, advisorName, advisorStages, contactName, crmRequest, formatDate, formatLabel,
  leadSources, leadStatuses,
} from './crm';

const selectClassName = 'flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
const privilegedRoles = new Set(['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

function PageIntro({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1><p className="mt-1 text-sm text-slate-600">{description}</p></div>{action}</div>;
}

function Loading({ label }: { label: string }) {
  return <Card><CardContent className="flex min-h-56 items-center justify-center gap-3 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />{label}</CardContent></Card>;
}

function Failure({ message, retry }: { message: string; retry: () => void }) {
  return <Card className="border-red-200"><CardContent className="flex min-h-48 flex-col items-center justify-center gap-4 text-center"><AlertCircle className="h-9 w-9 text-red-500" /><p className="max-w-xl text-sm text-slate-600">{message}</p><Button variant="outline" onClick={retry}>Try again</Button></CardContent></Card>;
}

function Status({ value }: { value: string }) {
  const positive = ['ACTIVE_ADVISOR', 'ACTIVE_CLIENT', 'SENT', 'DELIVERED', 'COMPLIANT', 'PAID'].includes(value);
  const negative = ['FAILED', 'NOT_PROCEEDING', 'ARCHIVED', 'NON_COMPLIANT'].includes(value);
  return <Badge variant="outline" className={positive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : negative ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-blue-50 text-blue-700'}>{formatLabel(value)}</Badge>;
}

export function LifecycleDialog({ open, onOpenChange, mode, recordLabel, onConfirm }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'archive' | 'restore';
  recordLabel: string;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!reason.trim() || !confirmed) return;
    setSaving(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
      setConfirmed(false);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><form onSubmit={submit}><DialogHeader><DialogTitle>{mode === 'archive' ? 'Archive' : 'Restore'} {recordLabel}</DialogTitle><DialogDescription>{mode === 'archive' ? 'The record remains preserved and auditable. It is removed from active workflows.' : 'The record returns to active management. The restore action is audited.'}</DialogDescription></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label htmlFor="lifecycle-reason">Required reason</Label><Textarea id="lifecycle-reason" value={reason} onChange={(event) => setReason(event.target.value)} required /></div><label className="flex items-start gap-3 rounded-lg border p-3 text-sm"><Checkbox checked={confirmed} onCheckedChange={(value) => setConfirmed(value === true)} /><span>I confirm this {mode} action for <strong>{recordLabel}</strong>.</span></label></div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={saving || !reason.trim() || !confirmed}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{mode === 'archive' ? 'Archive record' : 'Restore record'}</Button></DialogFooter></form></DialogContent></Dialog>;
}

interface AdvisorForm {
  firstName: string; lastName: string; email: string; phone: string; alternatePhone: string;
  address: string; city: string; province: string; postalCode: string; previousMga: string;
  newMga: string; reasonForLeaving: string; advisorNotes: string; goals: string;
  recruitmentStage: string; nextFollowUpAt: string;
}

const emptyAdvisor: AdvisorForm = {
  firstName: '', lastName: '', email: '', phone: '', alternatePhone: '', address: '', city: '', province: '', postalCode: '',
  previousMga: '', newMga: '', reasonForLeaving: '', advisorNotes: '', goals: '', recruitmentStage: 'ADVISOR_PROSPECT', nextFollowUpAt: '',
};

export function AdvisorsPage() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [form, setForm] = useState<AdvisorForm>(emptyAdvisor);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lifecycle, setLifecycle] = useState<{ advisor: Advisor; mode: 'archive' | 'restore' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [active, archived] = await Promise.all([
        crmRequest<{ advisors: Advisor[] }>('advisors'),
        crmRequest<{ advisors: Advisor[] }>('advisors', { params: { archived: 'true' } }),
      ]);
      setAdvisors([...(active.advisors || []), ...(archived.advisors || [])]);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load advisors'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return advisors.filter((advisor) => (stage === 'ALL' || advisor.recruitment_stage === stage) && (!query || `${advisorName(advisor)} ${advisor.email || ''} ${advisor.phone || ''} ${advisor.province || ''} ${advisor.new_mga || ''}`.toLowerCase().includes(query)));
  }, [advisors, search, stage]);

  const create = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      await crmRequest('advisors', { method: 'POST', body: JSON.stringify({ ...form, nextFollowUpAt: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : null }) });
      toast({ title: 'Advisor added', description: 'The recruitment record is now in the unified portal.' });
      setForm(emptyAdvisor); setDialogOpen(false); await load();
    } catch (requestError) { toast({ title: 'Could not add advisor', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const lifecycleAction = async (reason: string) => {
    if (!lifecycle) return;
    try {
      await crmRequest('advisors', { method: 'PATCH', params: { id: lifecycle.advisor.id }, body: JSON.stringify({ action: lifecycle.mode.toUpperCase(), reason }) });
      toast({ title: lifecycle.mode === 'archive' ? 'Advisor archived' : 'Advisor restored' });
      await load();
    } catch (requestError) { toast({ title: `Could not ${lifecycle.mode} advisor`, description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); throw requestError; }
  };

  if (loading) return <Loading label="Loading advisor recruitment..." />;
  if (error) return <Failure message={error} retry={load} />;
  return <>
    <PageIntro title="Advisors" description="Recruit, onboard, and manage advisors without leaving the Estate Nest portal." action={<Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Add advisor</Button>} />
    <Card><CardHeader><div className="grid gap-3 md:grid-cols-[1fr_260px]"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input aria-label="Search advisors" className="pl-9" placeholder="Search name, contact, province, or MGA" value={search} onChange={(event) => setSearch(event.target.value)} /></div><select aria-label="Filter advisor stage" className={selectClassName} value={stage} onChange={(event) => setStage(event.target.value)}><option value="ALL">All recruitment stages</option>{advisorStages.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div></CardHeader><CardContent>{filtered.length ? <Table><TableHeader><TableRow><TableHead>Advisor</TableHead><TableHead>Location / MGA</TableHead><TableHead>Stage</TableHead><TableHead>Compliance</TableHead><TableHead>Follow-up</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader><TableBody>{filtered.map((advisor) => <TableRow key={advisor.id}><TableCell><Link className="font-medium text-slate-900 hover:underline" to={`/management/advisors/${advisor.id}`}>{advisorName(advisor)}</Link><p className="text-xs text-slate-500">{advisor.email || advisor.phone || 'No contact method'}</p></TableCell><TableCell>{[advisor.city, advisor.province].filter(Boolean).join(', ') || 'Not set'}<p className="text-xs text-slate-500">{advisor.new_mga || 'MGA not set'}</p></TableCell><TableCell><Status value={advisor.recruitment_stage} /></TableCell><TableCell><Status value={advisor.compliance?.[0]?.compliance_status || 'PENDING'} /></TableCell><TableCell>{formatDate(advisor.next_follow_up_at)}</TableCell><TableCell><Button variant="ghost" size="icon" aria-label={`${advisor.archived_at ? 'Restore' : 'Archive'} ${advisorName(advisor)}`} onClick={() => setLifecycle({ advisor, mode: advisor.archived_at ? 'restore' : 'archive' })}>{advisor.archived_at ? <RotateCcw className="h-4 w-4 text-emerald-600" /> : <Archive className="h-4 w-4 text-slate-500" />}</Button></TableCell></TableRow>)}</TableBody></Table> : <p className="py-12 text-center text-sm text-slate-500">No advisor records match these filters.</p>}</CardContent></Card>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><form onSubmit={create}><DialogHeader><DialogTitle>Add advisor recruitment record</DialogTitle><DialogDescription>Capture verified recruitment information. Missing carrier contacts must remain blank.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2">{advisorFormFields(form, setForm)}<div className="space-y-2 sm:col-span-2"><Label htmlFor="advisor-notes">Advisor notes</Label><Textarea id="advisor-notes" value={form.advisorNotes} onChange={(event) => setForm({ ...form, advisorNotes: event.target.value })} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="advisor-goals">Goals</Label><Textarea id="advisor-goals" value={form.goals} onChange={(event) => setForm({ ...form, goals: event.target.value })} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add advisor</Button></DialogFooter></form></DialogContent></Dialog>
    {lifecycle && <LifecycleDialog open onOpenChange={(open) => { if (!open) setLifecycle(null); }} mode={lifecycle.mode} recordLabel={advisorName(lifecycle.advisor)} onConfirm={lifecycleAction} />}
  </>;
}

function advisorFormFields(form: AdvisorForm, setForm: (form: AdvisorForm) => void) {
  return <>
    <div className="space-y-2"><Label htmlFor="advisor-first">First name</Label><Input id="advisor-first" required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></div>
    <div className="space-y-2"><Label htmlFor="advisor-last">Last name</Label><Input id="advisor-last" required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></div>
    <div className="space-y-2"><Label htmlFor="advisor-email">Email</Label><Input id="advisor-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
    <div className="space-y-2"><Label htmlFor="advisor-phone">Phone</Label><Input id="advisor-phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
    <div className="space-y-2"><Label htmlFor="advisor-alt-phone">Alternate phone</Label><Input id="advisor-alt-phone" value={form.alternatePhone} onChange={(event) => setForm({ ...form, alternatePhone: event.target.value })} /></div>
    <div className="space-y-2"><Label htmlFor="advisor-address">Address</Label><Input id="advisor-address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></div>
    <div className="space-y-2"><Label htmlFor="advisor-city">City</Label><Input id="advisor-city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></div>
    <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="advisor-province">Province</Label><Input id="advisor-province" value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="advisor-postal">Postal code</Label><Input id="advisor-postal" value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} /></div></div>
    <div className="space-y-2"><Label htmlFor="advisor-previous-mga">Previous MGA</Label><Input id="advisor-previous-mga" value={form.previousMga} onChange={(event) => setForm({ ...form, previousMga: event.target.value })} /></div>
    <div className="space-y-2"><Label htmlFor="advisor-new-mga">New MGA</Label><Input id="advisor-new-mga" value={form.newMga} onChange={(event) => setForm({ ...form, newMga: event.target.value })} /></div>
    <div className="space-y-2 sm:col-span-2"><Label htmlFor="advisor-leaving-reason">Reason for leaving</Label><Textarea id="advisor-leaving-reason" value={form.reasonForLeaving} onChange={(event) => setForm({ ...form, reasonForLeaving: event.target.value })} /></div>
    <div className="space-y-2"><Label htmlFor="advisor-stage">Recruitment stage</Label><select id="advisor-stage" className={selectClassName} value={form.recruitmentStage} onChange={(event) => setForm({ ...form, recruitmentStage: event.target.value })}>{advisorStages.filter((value) => value !== 'ARCHIVED').map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div>
    <div className="space-y-2"><Label htmlFor="advisor-follow-up">Next follow-up</Label><Input id="advisor-follow-up" type="datetime-local" value={form.nextFollowUpAt} onChange={(event) => setForm({ ...form, nextFollowUpAt: event.target.value })} /></div>
  </>;
}

interface ComplianceForm {
  lifeLicenceNumber: string; accidentSicknessLicenceNumber: string; licenceProvince: string;
  lifeLicenceIssueDate: string; lifeLicenceExpiryDate: string; accidentSicknessIssueDate: string; accidentSicknessExpiryDate: string;
  eoPolicyNumber: string; eoProvider: string; eoEffectiveDate: string; eoExpiryDate: string;
  cybersecurityPolicyNumber: string; cybersecurityProvider: string; cybersecurityEffectiveDate: string; cybersecurityExpiryDate: string;
  insurancePracticeSponsorship: string; sponsoringCompany: string; mga: string; complianceStatus: string;
  outstandingDocuments: string; nextReviewDate: string; bankingInformationReceived: boolean;
  bankingReceivedDate: string; bankingVerifiedDate: string; bankingSecureDocumentReference: string; bankingLastFour: string;
}

const emptyCompliance: ComplianceForm = {
  lifeLicenceNumber: '', accidentSicknessLicenceNumber: '', licenceProvince: '', lifeLicenceIssueDate: '', lifeLicenceExpiryDate: '',
  accidentSicknessIssueDate: '', accidentSicknessExpiryDate: '', eoPolicyNumber: '', eoProvider: '', eoEffectiveDate: '', eoExpiryDate: '',
  cybersecurityPolicyNumber: '', cybersecurityProvider: '', cybersecurityEffectiveDate: '', cybersecurityExpiryDate: '',
  insurancePracticeSponsorship: '', sponsoringCompany: '', mga: '', complianceStatus: 'PENDING', outstandingDocuments: '', nextReviewDate: '',
  bankingInformationReceived: false, bankingReceivedDate: '', bankingVerifiedDate: '', bankingSecureDocumentReference: '', bankingLastFour: '',
};

interface AdvisorContractForm {
  companyName: string;
  advisorCode: string;
  sponsorshipStatus: string;
  effectiveDate: string;
  endDate: string;
  notes: string;
}

const emptyAdvisorContract: AdvisorContractForm = {
  companyName: '', advisorCode: '', sponsorshipStatus: 'PENDING', effectiveDate: '', endDate: '', notes: '',
};

export function AdvisorDetailPage() {
  const { advisorId = '' } = useParams();
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [compliance, setCompliance] = useState<AdvisorCompliance | null>(null);
  const [contracts, setContracts] = useState<AdvisorContract[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [complianceForm, setComplianceForm] = useState<ComplianceForm>(emptyCompliance);
  const [contractForm, setContractForm] = useState<AdvisorContractForm>(emptyAdvisorContract);
  const [contractOpen, setContractOpen] = useState(false);
  const [stage, setStage] = useState('');
  const [stageReason, setStageReason] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [archiveOpen, setArchiveOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [advisorResponse, complianceResponse, contractResponse, commissionResponse] = await Promise.all([
        crmRequest<{ advisor: Advisor }>('advisors', { params: { id: advisorId } }),
        crmRequest<{ compliance: AdvisorCompliance[] }>('compliance', { params: { advisorId } }),
        crmRequest<{ contracts: AdvisorContract[] }>('advisor-contracts', { params: { advisorId } }),
        crmRequest<{ commissions: Commission[] }>('commissions', { params: { advisorId } }),
      ]);
      const loadedAdvisor = advisorResponse.advisor;
      const loadedCompliance = complianceResponse.compliance?.[0] || null;
      setAdvisor(loadedAdvisor); setCompliance(loadedCompliance); setContracts(contractResponse.contracts || []); setCommissions(commissionResponse.commissions || []);
      setStage(loadedAdvisor.recruitment_stage); setFollowUp('');
      if (loadedCompliance) setComplianceForm((current) => ({ ...current, licenceProvince: loadedCompliance.licence_province || '', lifeLicenceExpiryDate: loadedCompliance.life_licence_expiry_date || '', accidentSicknessExpiryDate: loadedCompliance.accident_sickness_expiry_date || '', eoProvider: loadedCompliance.eo_provider || '', eoExpiryDate: loadedCompliance.eo_expiry_date || '', cybersecurityProvider: loadedCompliance.cybersecurity_provider || '', cybersecurityExpiryDate: loadedCompliance.cybersecurity_expiry_date || '', complianceStatus: loadedCompliance.compliance_status || 'PENDING', outstandingDocuments: loadedCompliance.outstanding_documents || '', nextReviewDate: loadedCompliance.next_review_date || '', bankingInformationReceived: Boolean(loadedCompliance.banking_information_received), bankingLastFour: loadedCompliance.banking_last_four || '' }));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load advisor'); }
    finally { setLoading(false); }
  }, [advisorId]);
  useEffect(() => { void load(); }, [load]);

  const updateStage = async () => {
    setSaving(true);
    try {
      await crmRequest('advisors', { method: 'PATCH', params: { id: advisorId }, body: JSON.stringify({ recruitmentStage: stage, stageReason, nextFollowUpAt: followUp ? new Date(followUp).toISOString() : undefined }) });
      toast({ title: 'Advisor stage updated' }); await load();
    } catch (requestError) { toast({ title: 'Could not update advisor stage', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveCompliance = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    const payload = Object.fromEntries(Object.entries(complianceForm).filter(([, value]) => value !== ''));
    try {
      await crmRequest('compliance', { method: 'PATCH', body: JSON.stringify({ advisorId, ...payload }) });
      toast({ title: 'Compliance record updated', description: 'List views continue to mask licence and policy numbers.' }); await load();
    } catch (requestError) { toast({ title: 'Could not update compliance', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveContract = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      await crmRequest('advisor-contracts', { method: 'POST', body: JSON.stringify({ advisorId, ...contractForm }) });
      setContractForm(emptyAdvisorContract); setContractOpen(false);
      toast({ title: 'Insurance-company contract added', description: 'The advisor code is stored and displayed in masked form.' });
      await load();
    } catch (requestError) { toast({ title: 'Could not add advisor contract', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  if (loading) return <Loading label="Loading advisor record..." />;
  if (error || !advisor) return <Failure message={error || 'Advisor not found'} retry={load} />;
  return <>
    <Button variant="ghost" asChild className="mb-5"><Link to="/management/advisors"><ArrowLeft className="mr-2 h-4 w-4" />Back to advisors</Link></Button>
    <PageIntro title={advisorName(advisor)} description={`${formatLabel(advisor.recruitment_stage)} · ${advisor.email || advisor.phone || 'Contact details not set'}`} action={<Button variant="outline" onClick={() => setArchiveOpen(true)}><Archive className="mr-2 h-4 w-4" />Archive advisor</Button>} />
    <div className="grid gap-6 xl:grid-cols-3">
      <Card><CardHeader><CardTitle>Recruitment workflow</CardTitle><CardDescription>Stage changes and reasons are audited.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="detail-advisor-stage">Stage</Label><select id="detail-advisor-stage" className={selectClassName} value={stage} onChange={(event) => setStage(event.target.value)}>{advisorStages.filter((value) => value !== 'ARCHIVED').map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div>{['DEFERRED', 'NOT_PROCEEDING'].includes(stage) && <div className="space-y-2"><Label htmlFor="advisor-stage-reason">Required reason</Label><Textarea id="advisor-stage-reason" value={stageReason} onChange={(event) => setStageReason(event.target.value)} /></div>}<div className="space-y-2"><Label htmlFor="advisor-detail-followup">Next follow-up</Label><Input id="advisor-detail-followup" type="datetime-local" value={followUp} onChange={(event) => setFollowUp(event.target.value)} /></div><Button onClick={() => void updateStage()} disabled={saving || (['DEFERRED', 'NOT_PROCEEDING'].includes(stage) && !stageReason.trim())}>Save workflow</Button></CardContent></Card>
      <Card><CardHeader><CardTitle>Profile</CardTitle><CardDescription>Recruitment context</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><p><span className="text-slate-500">Phone:</span> {advisor.phone || 'Not set'}</p><p><span className="text-slate-500">Location:</span> {[advisor.address, advisor.city, advisor.province, advisor.postal_code].filter(Boolean).join(', ') || 'Not set'}</p><p><span className="text-slate-500">Previous MGA:</span> {advisor.previous_mga || 'Not set'}</p><p><span className="text-slate-500">New MGA:</span> {advisor.new_mga || 'Not set'}</p><p><span className="text-slate-500">Goals:</span> {advisor.goals || 'Not set'}</p></CardContent></Card>
      <Card><CardHeader><CardTitle>Compliance snapshot</CardTitle><CardDescription>Identifiers remain masked in the interface</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><Status value={compliance?.compliance_status || 'PENDING'} /><p>Life licence: {compliance?.life_licence_number || 'Not set'}</p><p>A&amp;S licence: {compliance?.accident_sickness_licence_number || 'Not set'}</p><p>E&amp;O: {compliance?.eo_policy_number || 'Not set'}</p><p>Next review: {formatDate(compliance?.next_review_date)}</p></CardContent></Card>
    </div>
    <Card className="mt-6"><CardHeader><CardTitle>Advisor compliance</CardTitle><CardDescription>Full identifiers are accepted only on update and are returned masked. Banking is limited to receipt metadata, secure reference, and approved last four.</CardDescription></CardHeader><CardContent><form onSubmit={saveCompliance} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{complianceFields(complianceForm, setComplianceForm, compliance)}<div className="md:col-span-2 xl:col-span-4"><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save compliance</Button></div></form></CardContent></Card>
    <Card className="mt-6"><CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle>Insurance-company contracts</CardTitle><CardDescription>Carrier sponsorship and advisor codes remain structured, masked, and auditable.</CardDescription></div><Button onClick={() => setContractOpen(true)}><Plus className="mr-2 h-4 w-4" />Add contract</Button></CardHeader><CardContent>{contracts.length ? <Table><TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Advisor code</TableHead><TableHead>Sponsorship</TableHead><TableHead>Effective</TableHead><TableHead>End</TableHead></TableRow></TableHeader><TableBody>{contracts.map((contract) => <TableRow key={contract.id}><TableCell>{contract.company_name}<p className="text-xs text-slate-500">{contract.carrier?.mga_name || 'MGA not linked'}</p></TableCell><TableCell>{contract.advisor_code_masked || 'Not set'}</TableCell><TableCell><Status value={contract.sponsorship_status || 'PENDING'} /></TableCell><TableCell>{formatDate(contract.effective_date)}</TableCell><TableCell>{formatDate(contract.end_date)}</TableCell></TableRow>)}</TableBody></Table> : <p className="py-8 text-center text-sm text-slate-500">No insurance-company contracts recorded.</p>}</CardContent></Card>
    <Card className="mt-6"><CardHeader><CardTitle>Commission history</CardTitle><CardDescription>Historical structures are retained by the database history trigger.</CardDescription></CardHeader><CardContent>{commissions.length ? <Table><TableHeader><TableRow><TableHead>Policy</TableHead><TableHead>Insurer / product</TableHead><TableHead>Commission</TableHead><TableHead>Status</TableHead><TableHead>Release</TableHead></TableRow></TableHeader><TableBody>{commissions.map((commission) => <TableRow key={commission.id}><TableCell>{commission.policy_reference}<p className="text-xs text-slate-500">{commission.policy_number_masked || 'Number not set'}</p></TableCell><TableCell>{commission.insurer}<p className="text-xs text-slate-500">{commission.product_type || 'Not set'}</p></TableCell><TableCell>{commission.commission_percentage != null ? `${commission.commission_percentage}%` : commission.commission_amount != null ? `$${commission.commission_amount.toFixed(2)}` : 'Not set'}</TableCell><TableCell><Status value={commission.commission_status} /></TableCell><TableCell>{formatDate(commission.commission_release_date)}</TableCell></TableRow>)}</TableBody></Table> : <p className="py-8 text-center text-sm text-slate-500">No commission records.</p>}</CardContent></Card>
    <Dialog open={contractOpen} onOpenChange={setContractOpen}><DialogContent><form onSubmit={saveContract}><DialogHeader><DialogTitle>Add insurance-company contract</DialogTitle><DialogDescription>Enter only verified contract details. Advisor codes are masked after submission.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="contract-company">Insurance company</Label><Input id="contract-company" required value={contractForm.companyName} onChange={(event) => setContractForm({ ...contractForm, companyName: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="contract-advisor-code">Advisor code</Label><Input id="contract-advisor-code" value={contractForm.advisorCode} onChange={(event) => setContractForm({ ...contractForm, advisorCode: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="contract-sponsorship">Sponsorship status</Label><select id="contract-sponsorship" className={selectClassName} value={contractForm.sponsorshipStatus} onChange={(event) => setContractForm({ ...contractForm, sponsorshipStatus: event.target.value })}><option value="PENDING">Pending</option><option value="SPONSORED">Sponsored</option><option value="ACTIVE">Active</option><option value="ENDED">Ended</option></select></div><div className="space-y-2"><Label htmlFor="contract-effective">Effective date</Label><Input id="contract-effective" type="date" value={contractForm.effectiveDate} onChange={(event) => setContractForm({ ...contractForm, effectiveDate: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="contract-end">End date</Label><Input id="contract-end" type="date" value={contractForm.endDate} onChange={(event) => setContractForm({ ...contractForm, endDate: event.target.value })} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="contract-notes">Contract notes</Label><Textarea id="contract-notes" value={contractForm.notes} onChange={(event) => setContractForm({ ...contractForm, notes: event.target.value })} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setContractOpen(false)}>Cancel</Button><Button type="submit" disabled={saving || !contractForm.companyName.trim()}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add contract</Button></DialogFooter></form></DialogContent></Dialog>
    <LifecycleDialog open={archiveOpen} onOpenChange={setArchiveOpen} mode="archive" recordLabel={advisorName(advisor)} onConfirm={async (reason) => { await crmRequest('advisors', { method: 'PATCH', params: { id: advisor.id }, body: JSON.stringify({ action: 'ARCHIVE', reason }) }); window.location.assign('/management/advisors'); }} />
  </>;
}

function complianceFields(form: ComplianceForm, setForm: (form: ComplianceForm) => void, current: AdvisorCompliance | null) {
  const field = (id: string, label: string, key: keyof ComplianceForm, type = 'text', placeholder = '') => <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={String(form[key] ?? '')} placeholder={placeholder} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></div>;
  return <>
    {field('life-licence-number', 'Life licence number', 'lifeLicenceNumber', 'text', current?.life_licence_number || '')}
    {field('life-licence-province', 'Licence province', 'licenceProvince')}
    {field('life-licence-issued', 'Life licence issue date', 'lifeLicenceIssueDate', 'date')}
    {field('life-licence-expiry', 'Life licence expiry date', 'lifeLicenceExpiryDate', 'date')}
    {field('as-licence-number', 'A&S licence number', 'accidentSicknessLicenceNumber', 'text', current?.accident_sickness_licence_number || '')}
    {field('as-licence-issued', 'A&S issue date', 'accidentSicknessIssueDate', 'date')}
    {field('as-licence-expiry', 'A&S expiry date', 'accidentSicknessExpiryDate', 'date')}
    {field('eo-policy-number', 'E&O policy number', 'eoPolicyNumber', 'text', current?.eo_policy_number || '')}
    {field('eo-provider', 'E&O provider', 'eoProvider')}{field('eo-effective', 'E&O effective date', 'eoEffectiveDate', 'date')}{field('eo-expiry', 'E&O expiry date', 'eoExpiryDate', 'date')}
    {field('cyber-policy-number', 'Cybersecurity policy number', 'cybersecurityPolicyNumber', 'text', current?.cybersecurity_policy_number || '')}
    {field('cyber-provider', 'Cybersecurity provider', 'cybersecurityProvider')}{field('cyber-effective', 'Cybersecurity effective date', 'cybersecurityEffectiveDate', 'date')}{field('cyber-expiry', 'Cybersecurity expiry date', 'cybersecurityExpiryDate', 'date')}
    {field('practice-sponsorship', 'Insurance-practice sponsorship', 'insurancePracticeSponsorship')}{field('sponsoring-company', 'Sponsoring company', 'sponsoringCompany')}{field('advisor-mga', 'MGA', 'mga')}
    <div className="space-y-2"><Label htmlFor="compliance-status">Compliance status</Label><select id="compliance-status" className={selectClassName} value={form.complianceStatus} onChange={(event) => setForm({ ...form, complianceStatus: event.target.value })}><option value="PENDING">Pending</option><option value="COMPLIANT">Compliant</option><option value="REVIEW_REQUIRED">Review required</option><option value="NON_COMPLIANT">Non-compliant</option></select></div>
    <div className="space-y-2 md:col-span-2"><Label htmlFor="outstanding-documents">Outstanding documents</Label><Textarea id="outstanding-documents" value={form.outstandingDocuments} onChange={(event) => setForm({ ...form, outstandingDocuments: event.target.value })} /></div>
    {field('next-review-date', 'Next review date', 'nextReviewDate', 'date')}
    <label className="flex items-center gap-3 rounded-lg border p-3 text-sm"><Checkbox checked={form.bankingInformationReceived} onCheckedChange={(value) => setForm({ ...form, bankingInformationReceived: value === true })} />Banking information received</label>
    {field('banking-received-date', 'Banking received date', 'bankingReceivedDate', 'date')}{field('banking-verified-date', 'Banking verified date', 'bankingVerifiedDate', 'date')}
    {field('banking-reference', 'Secure document reference', 'bankingSecureDocumentReference')}{field('banking-last-four', 'Approved last four digits', 'bankingLastFour')}
  </>;
}

export function CompliancePage() {
  const [records, setRecords] = useState<Array<AdvisorCompliance & { advisor?: Advisor }>>([]);
  const [rules, setRules] = useState<Array<Record<string, unknown>>>([]);
  const [carriers, setCarriers] = useState<Array<Record<string, unknown>>>([]);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [carrierOpen, setCarrierOpen] = useState(false);
  const [rule, setRule] = useState({ province: '', licenceType: '', deadlineRule: '', regulator: '', mga: '', insuranceCompany: '', apexaRequirement: '', requiredDocuments: '' });
  const [carrier, setCarrier] = useState({ companyName: '', contractingEmail: '', complianceEmail: '', mgaName: '', mgaEmail: '', portalUrl: '', contactPerson: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { const [complianceResponse, rulesResponse, carriersResponse] = await Promise.all([crmRequest<{ compliance: Array<AdvisorCompliance & { advisor?: Advisor }> }>('compliance'), crmRequest<{ rules: Array<Record<string, unknown>> }>('reminder-rules'), crmRequest<{ carriers: Array<Record<string, unknown>> }>('carriers')]); setRecords(complianceResponse.compliance || []); setRules(rulesResponse.rules || []); setCarriers(carriersResponse.carriers || []); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load compliance'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const saveRule = async (event: FormEvent) => { event.preventDefault(); try { await crmRequest('reminder-rules', { method: 'POST', body: JSON.stringify({ ...rule, reminderDays: [90, 60, 30, 7] }) }); setRuleOpen(false); setRule({ province: '', licenceType: '', deadlineRule: '', regulator: '', mga: '', insuranceCompany: '', apexaRequirement: '', requiredDocuments: '' }); await load(); toast({ title: 'Reminder rule saved', description: 'Automatic scheduling remains disabled until separately previewed and approved.' }); } catch (requestError) { toast({ title: 'Could not save rule', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); } };
  const saveCarrier = async (event: FormEvent) => { event.preventDefault(); try { await crmRequest('carriers', { method: 'POST', body: JSON.stringify(carrier) }); setCarrierOpen(false); setCarrier({ companyName: '', contractingEmail: '', complianceEmail: '', mgaName: '', mgaEmail: '', portalUrl: '', contactPerson: '' }); await load(); } catch (requestError) { toast({ title: 'Could not save directory entry', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); } };
  if (loading) return <Loading label="Loading compliance..." />;
  if (error) return <Failure message={error} retry={load} />;
  return <><PageIntro title="Compliance" description="Masked licence, E&O, cybersecurity, sponsorship, carrier, and reminder controls." action={<div className="flex gap-2"><Button variant="outline" onClick={() => setCarrierOpen(true)}><Plus className="mr-2 h-4 w-4" />Directory entry</Button><Button onClick={() => setRuleOpen(true)}><Bell className="mr-2 h-4 w-4" />Reminder rule</Button></div>} />
    <Card><CardHeader><CardTitle>Advisor compliance overview</CardTitle><CardDescription>Licence and policy numbers are masked in every list view.</CardDescription></CardHeader><CardContent>{records.length ? <Table><TableHeader><TableRow><TableHead>Advisor</TableHead><TableHead>Province</TableHead><TableHead>Life licence</TableHead><TableHead>E&amp;O</TableHead><TableHead>Cybersecurity</TableHead><TableHead>Status / review</TableHead></TableRow></TableHeader><TableBody>{records.map((record) => <TableRow key={record.id}><TableCell>{advisorName(record.advisor)}</TableCell><TableCell>{record.licence_province || 'Not set'}</TableCell><TableCell>{record.life_licence_number || 'Not set'}<p className="text-xs text-slate-500">Expires {formatDate(record.life_licence_expiry_date)}</p></TableCell><TableCell>{record.eo_policy_number || 'Not set'}<p className="text-xs text-slate-500">Expires {formatDate(record.eo_expiry_date)}</p></TableCell><TableCell>{record.cybersecurity_policy_number || 'Not set'}<p className="text-xs text-slate-500">Expires {formatDate(record.cybersecurity_expiry_date)}</p></TableCell><TableCell><Status value={record.compliance_status || 'PENDING'} /><p className="mt-1 text-xs text-slate-500">{formatDate(record.next_review_date)}</p></TableCell></TableRow>)}</TableBody></Table> : <p className="py-10 text-center text-sm text-slate-500">Compliance records appear after an advisor record is completed.</p>}</CardContent></Card>
    <div className="mt-6 grid gap-6 xl:grid-cols-2"><Card><CardHeader><CardTitle>Renewal reminder rules</CardTitle><CardDescription>Rules support 90, 60, 30, and 7-day reminders. No generic May 30 deadline is assumed.</CardDescription></CardHeader><CardContent className="space-y-3">{rules.map((entry) => <div key={String(entry.id)} className="rounded-lg border p-3"><div className="flex items-center justify-between"><p className="font-medium">{String(entry.province)} · {formatLabel(String(entry.licence_type))}</p><Status value={entry.automatic_scheduling_enabled ? 'SCHEDULED' : 'DRAFT'} /></div><p className="mt-1 text-sm text-slate-600">{String(entry.deadline_rule)}</p><p className="mt-1 text-xs text-slate-500">Reminders: {Array.isArray(entry.reminder_days) ? entry.reminder_days.join(', ') : '90, 60, 30, 7'} days</p></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Carrier / MGA directory</CardTitle><CardDescription>Only owner-verified contact information is stored.</CardDescription></CardHeader><CardContent className="space-y-3">{carriers.map((entry) => <div key={String(entry.id)} className="rounded-lg border p-3"><p className="font-medium">{String(entry.company_name)}</p><p className="text-sm text-slate-600">{String(entry.mga_name || 'MGA not set')}</p><p className="text-xs text-slate-500">{String(entry.contracting_email || entry.compliance_email || 'Contact email not set')}</p></div>)}</CardContent></Card></div>
    <Dialog open={ruleOpen} onOpenChange={setRuleOpen}><DialogContent><form onSubmit={saveRule}><DialogHeader><DialogTitle>Add verified reminder rule</DialogTitle><DialogDescription>Confirm the regulator deadline before saving. Scheduling remains disabled.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2"><Input required placeholder="Province" value={rule.province} onChange={(event) => setRule({ ...rule, province: event.target.value })} /><Input required placeholder="Licence type" value={rule.licenceType} onChange={(event) => setRule({ ...rule, licenceType: event.target.value })} /><Textarea className="sm:col-span-2" required placeholder="Verified deadline rule" value={rule.deadlineRule} onChange={(event) => setRule({ ...rule, deadlineRule: event.target.value })} /><Input placeholder="Regulator" value={rule.regulator} onChange={(event) => setRule({ ...rule, regulator: event.target.value })} /><Input placeholder="MGA" value={rule.mga} onChange={(event) => setRule({ ...rule, mga: event.target.value })} /><Input placeholder="Insurance company" value={rule.insuranceCompany} onChange={(event) => setRule({ ...rule, insuranceCompany: event.target.value })} /><Input placeholder="APEXA requirement, if applicable" value={rule.apexaRequirement} onChange={(event) => setRule({ ...rule, apexaRequirement: event.target.value })} /><Textarea className="sm:col-span-2" placeholder="Required attachments/documents" value={rule.requiredDocuments} onChange={(event) => setRule({ ...rule, requiredDocuments: event.target.value })} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setRuleOpen(false)}>Cancel</Button><Button type="submit">Save rule</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={carrierOpen} onOpenChange={setCarrierOpen}><DialogContent><form onSubmit={saveCarrier}><DialogHeader><DialogTitle>Add carrier / MGA directory entry</DialogTitle><DialogDescription>Leave unknown fields blank. Do not invent addresses.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2"><Input required placeholder="Company name" value={carrier.companyName} onChange={(event) => setCarrier({ ...carrier, companyName: event.target.value })} /><Input placeholder="Contact person" value={carrier.contactPerson} onChange={(event) => setCarrier({ ...carrier, contactPerson: event.target.value })} /><Input type="email" placeholder="Contracting email" value={carrier.contractingEmail} onChange={(event) => setCarrier({ ...carrier, contractingEmail: event.target.value })} /><Input type="email" placeholder="Compliance email" value={carrier.complianceEmail} onChange={(event) => setCarrier({ ...carrier, complianceEmail: event.target.value })} /><Input placeholder="MGA name" value={carrier.mgaName} onChange={(event) => setCarrier({ ...carrier, mgaName: event.target.value })} /><Input type="email" placeholder="MGA email" value={carrier.mgaEmail} onChange={(event) => setCarrier({ ...carrier, mgaEmail: event.target.value })} /><Input className="sm:col-span-2" type="url" placeholder="Portal URL" value={carrier.portalUrl} onChange={(event) => setCarrier({ ...carrier, portalUrl: event.target.value })} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setCarrierOpen(false)}>Cancel</Button><Button type="submit">Save verified entry</Button></DialogFooter></form></DialogContent></Dialog>
  </>;
}

export function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ advisorId: '', policyReference: '', policyNumber: '', insurer: '', productType: '', commissionPercentage: '', commissionAmount: '', commissionStatus: 'PENDING', policyEffectiveDate: '', commissionReleaseDate: '', paymentDate: '', annualReminderDate: '', notes: '' });
  const load = useCallback(async () => { setLoading(true); try { const [commissionResponse, advisorResponse] = await Promise.all([crmRequest<{ commissions: Commission[] }>('commissions'), crmRequest<{ advisors: Advisor[] }>('advisors')]); setCommissions(commissionResponse.commissions || []); setAdvisors(advisorResponse.advisors || []); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const submit = async (event: FormEvent) => { event.preventDefault(); try { await crmRequest('commissions', { method: 'POST', body: JSON.stringify(form) }); setOpen(false); await load(); toast({ title: 'Commission record added', description: 'The initial structure is preserved in commission history.' }); } catch (requestError) { toast({ title: 'Could not add commission', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); } };
  if (loading) return <Loading label="Loading commissions..." />;
  return <><PageIntro title="Commissions" description="Track releases, payments, reminders, approvals, and immutable percentage history." action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Add commission</Button>} /><Card><CardContent className="pt-6">{commissions.length ? <Table><TableHeader><TableRow><TableHead>Advisor</TableHead><TableHead>Policy</TableHead><TableHead>Insurer / product</TableHead><TableHead>Commission</TableHead><TableHead>Status</TableHead><TableHead>Release / payment</TableHead></TableRow></TableHeader><TableBody>{commissions.map((commission) => <TableRow key={commission.id}><TableCell>{advisorName(commission.advisor)}</TableCell><TableCell>{commission.policy_reference}<p className="text-xs text-slate-500">{commission.policy_number_masked || 'Masked number not set'}</p></TableCell><TableCell>{commission.insurer}<p className="text-xs text-slate-500">{commission.product_type || 'Not set'}</p></TableCell><TableCell>{commission.commission_percentage != null ? `${commission.commission_percentage}%` : commission.commission_amount != null ? `$${commission.commission_amount.toFixed(2)}` : 'Not set'}</TableCell><TableCell><Status value={commission.commission_status} /></TableCell><TableCell>{formatDate(commission.commission_release_date)}<p className="text-xs text-slate-500">Paid {formatDate(commission.payment_date)}</p></TableCell></TableRow>)}</TableBody></Table> : <p className="py-12 text-center text-sm text-slate-500">No commission records.</p>}</CardContent></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><form onSubmit={submit}><DialogHeader><DialogTitle>Add commission record</DialogTitle><DialogDescription>Policy numbers are masked before database storage. Later changes create history records.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="commission-advisor">Advisor</Label><select id="commission-advisor" required className={selectClassName} value={form.advisorId} onChange={(event) => setForm({ ...form, advisorId: event.target.value })}><option value="">Select advisor</option>{advisors.map((advisor) => <option key={advisor.id} value={advisor.id}>{advisorName(advisor)} · {advisor.email || advisor.phone || 'No contact'}</option>)}</select></div><Input required placeholder="Policy reference" value={form.policyReference} onChange={(event) => setForm({ ...form, policyReference: event.target.value })} /><Input placeholder="Policy number (stored masked)" value={form.policyNumber} onChange={(event) => setForm({ ...form, policyNumber: event.target.value })} /><Input required placeholder="Insurer" value={form.insurer} onChange={(event) => setForm({ ...form, insurer: event.target.value })} /><Input placeholder="Product type" value={form.productType} onChange={(event) => setForm({ ...form, productType: event.target.value })} /><select className={selectClassName} value={form.commissionStatus} onChange={(event) => setForm({ ...form, commissionStatus: event.target.value })}><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="RELEASED">Released</option><option value="PAID">Paid</option><option value="HELD">Held</option></select><Input type="number" min="0" max="100" step="0.01" placeholder="Commission percentage" value={form.commissionPercentage} onChange={(event) => setForm({ ...form, commissionPercentage: event.target.value })} /><Input type="number" min="0" step="0.01" placeholder="Commission amount" value={form.commissionAmount} onChange={(event) => setForm({ ...form, commissionAmount: event.target.value })} />{[['Policy effective', 'policyEffectiveDate'], ['Release date', 'commissionReleaseDate'], ['Payment date', 'paymentDate'], ['Annual reminder', 'annualReminderDate']].map(([label, key]) => <div key={key} className="space-y-2"><Label>{label}</Label><Input type="date" value={String(form[key as keyof typeof form])} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></div>)}<Textarea className="sm:col-span-2" placeholder="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Add commission</Button></DialogFooter></form></DialogContent></Dialog>
  </>;
}

type EmailContext = 'CLIENT' | 'ADVISOR' | 'COMPLIANCE' | 'COMMISSION';

export function CommunicationsPage() {
  const location = useLocation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [defaultBcc, setDefaultBcc] = useState<string[]>([]);
  const [contextType, setContextType] = useState<EmailContext>('CLIENT');
  const [contextId, setContextId] = useState('');
  const [template, setTemplate] = useState('client-general');
  const [to, setTo] = useState(''); const [cc, setCc] = useState(''); const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(''); const [body, setBody] = useState(''); const [policyLastFour, setPolicyLastFour] = useState('');
  const [draftId, setDraftId] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendConfirmed, setSendConfirmed] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ name: string; status: string }>>([]);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const load = useCallback(async () => { setLoading(true); try { const [contactResponse, advisorResponse, emailResponse] = await Promise.all([crmRequest<{ contacts: Contact[] }>('contacts', { params: { limit: 500 } }), crmRequest<{ advisors: Advisor[] }>('advisors'), crmRequest<{ messages: EmailMessage[]; defaultBcc: string[] }>('emails')]); setContacts(contactResponse.contacts || []); setAdvisors(advisorResponse.advisors || []); setMessages(emailResponse.messages || []); setDefaultBcc(emailResponse.defaultBcc || []); setBcc((current) => current || (emailResponse.defaultBcc || []).join(', ')); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const params = new URLSearchParams(location.search); const requested = params.get('template'); if (requested === 'commission') { setContextType('COMMISSION'); setTemplate('commission-payment'); } }, [location.search]);
  const selectedContact = contacts.find((contact) => contact.id === contextId);
  const selectedAdvisor = advisors.find((advisor) => advisor.id === contextId);
  const visibleBcc = useMemo(() => Array.from(new Set([
    ...defaultBcc,
    ...bcc.split(/[;,]/).map((address) => address.trim().toLowerCase()).filter(Boolean),
  ])).join(', '), [bcc, defaultBcc]);
  const selectRecipient = (id: string) => { setContextId(id); const selected = contextType === 'CLIENT' ? contacts.find((contact) => contact.id === id) : advisors.find((advisor) => advisor.id === id); setTo(selected?.email || ''); };
  const applyTemplate = () => {
    const name = contextType === 'CLIENT' ? contactName(selectedContact) : advisorName(selectedAdvisor);
    if (template === 'advisor-onboarding') { setSubject('Estate Nest advisor onboarding next steps'); setBody(`Hello ${name},\n\nThank you for meeting with Estate Nest. Please review the approved onboarding documents and next steps attached or listed here.\n\nRegards,\nEstate Nest`); }
    else if (template === 'compliance-reminder') { setSubject('Estate Nest compliance renewal reminder'); setBody(`Hello ${name},\n\nThis is an approved reminder to review your upcoming licence or compliance requirement. Please confirm the applicable regulator, deadline, MGA requirement, and requested documents before taking action.\n\nRegards,\nEstate Nest`); }
    else if (template === 'commission-payment') { const ending = /^\d{4}$/.test(policyLastFour) ? policyLastFour : '{{last_four}}'; setSubject(`Commission Payment Notification – Policy ending ${ending}`); setBody(`Hello ${name},\n\nAdvisor: ${name}\nMasked policy number: ••••${ending}\nInsurer: {{insurer}}\nPolicy type: {{policy_type}}\nPolicy effective date: {{policy_effective_date}}\nCommission percentage or amount: {{commission}}\nExpected release date: {{release_date}}\nPayment status: {{payment_status}}\n\nQuestions: hello@estatenest.ca or 780-860-3191.\n\nRegards,\nEstate Nest`); }
    else { setSubject('Estate Nest client update'); setBody(`Hello ${name},\n\nPlease review this Estate Nest update. A licensed advisor will confirm any product-specific recommendation, eligibility, pricing, and policy terms.\n\nRegards,\nEstate Nest`); }
  };
  const insertApprovedSummary = () => {
    if (contextType === 'CLIENT' && selectedContact) setBody((current) => `${current}\n\nApproved Client Summary\nName: ${contactName(selectedContact)}\nEmail: ${selectedContact.email || 'Not set'}\nPhone: ${selectedContact.phone || 'Not set'}\nLocation: ${[selectedContact.city, selectedContact.province].filter(Boolean).join(', ') || 'Not set'}`);
    else if (selectedAdvisor) setBody((current) => `${current}\n\nSelected Advisor Meeting Summary\nAdvisor: ${advisorName(selectedAdvisor)}\nEmail: ${selectedAdvisor.email || 'Not set'}\nProvince: ${selectedAdvisor.province || 'Not set'}\nRecruitment stage: ${formatLabel(selectedAdvisor.recruitment_stage)}`);
  };
  const htmlBody = () => `<div style="font-family:Arial,sans-serif;white-space:pre-wrap">${body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div><p><strong>Estate Nest</strong><br><a href="https://www.estatenest.ca">www.estatenest.ca</a></p>`;
  const saveDraft = async (): Promise<string> => { const response = await crmRequest<{ message: EmailMessage }>('emails', { method: 'POST', params: draftId ? { id: draftId } : {}, body: JSON.stringify({ action: 'SAVE_DRAFT', contextType, contextId, templateKey: template, to, cc, bcc, subject, bodyHtml: htmlBody(), bodyText: body }) }); setDraftId(response.message.id); toast({ title: 'Draft saved' }); return response.message.id; };
  const preview = async () => { setSaving(true); try { const id = await saveDraft(); await crmRequest('emails', { method: 'POST', params: { id }, body: JSON.stringify({ action: 'PREVIEW' }) }); setPreviewOpen(true); await load(); } catch (requestError) { toast({ title: 'Could not preview email', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); } finally { setSaving(false); } };
  const send = async () => { if (!draftId || !sendConfirmed) return; setSaving(true); try { await crmRequest('emails', { method: 'POST', params: { id: draftId }, body: JSON.stringify({ action: 'SEND', confirm: true }) }); toast({ title: 'Email accepted by Gmail SMTP' }); setPreviewOpen(false); setSendConfirmed(false); setDraftId(''); setSubject(''); setBody(''); setAttachments([]); await load(); } catch (requestError) { toast({ title: 'Email was not sent', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); } finally { setSaving(false); } };
  const addAttachment = async (file: File) => { setSaving(true); try { const id = draftId || await saveDraft(); const created = await crmRequest<{ document: { id: string; scan_status: string }; uploadUrl: string }>('documents', { method: 'POST', body: JSON.stringify({ ownerType: 'EMAIL', ownerId: id, fileName: file.name, mimeType: file.type, sizeBytes: file.size }) }); const uploaded = await fetch(created.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type, 'x-upsert': 'false' }, body: file }); if (!uploaded.ok) throw new Error('Secure upload failed'); await crmRequest('emails', { method: 'POST', params: { id }, body: JSON.stringify({ action: 'ATTACH', documentId: created.document.id }) }); setAttachments((current) => [...current, { name: file.name, status: created.document.scan_status }]); toast({ title: 'Attachment uploaded', description: 'Sending remains blocked until malware scanning marks the file clean.' }); } catch (requestError) { toast({ title: 'Attachment rejected', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); } finally { setSaving(false); } };
  const retry = async (id: string) => { try { await crmRequest('emails', { method: 'POST', params: { id }, body: JSON.stringify({ action: 'RETRY', confirm: true }) }); await load(); } catch (requestError) { toast({ title: 'Retry failed', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); } };
  if (loading) return <Loading label="Loading communication centre..." />;
  const options = contextType === 'CLIENT' ? contacts : advisors;
  return <><PageIntro title="Email" description="Gmail-only drafts, approved summaries, preview, confirmation, attachment controls, status, and retry." /><div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]"><Card><CardHeader><CardTitle>Compose</CardTitle><CardDescription>No email sends until Preview and explicit confirmation. Default BCC is centrally configured and visible.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="email-context">Message type</Label><select id="email-context" className={selectClassName} value={contextType} onChange={(event) => { const next = event.target.value as EmailContext; setContextType(next); setContextId(''); setTo(''); setTemplate(next === 'CLIENT' ? 'client-general' : next === 'ADVISOR' ? 'advisor-onboarding' : next === 'COMPLIANCE' ? 'compliance-reminder' : 'commission-payment'); }}><option value="CLIENT">Client</option><option value="ADVISOR">Advisor onboarding</option><option value="COMPLIANCE">Advisor compliance</option><option value="COMMISSION">Advisor commission</option></select></div><div className="space-y-2"><Label htmlFor="email-recipient">Database recipient</Label><select id="email-recipient" className={selectClassName} value={contextId} onChange={(event) => selectRecipient(event.target.value)}><option value="">Select record</option>{options.map((record) => <option key={record.id} value={record.id}>{'recruitment_stage' in record ? `${advisorName(record)} · ${record.email || record.phone || 'No contact'} · ${record.province || 'No province'}` : `${contactName(record)} · ${record.email || record.phone || 'No contact'} · ${record.city || ''} ${record.province || ''}`}</option>)}</select></div></div><div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="email-to">To</Label><Input id="email-to" type="email" value={to} onChange={(event) => setTo(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="email-cc">CC</Label><Input id="email-cc" value={cc} onChange={(event) => setCc(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="email-bcc">BCC</Label><Input id="email-bcc" value={bcc} onChange={(event) => setBcc(event.target.value)} /><p className="text-xs text-slate-500">Always included: {defaultBcc.join(', ') || 'Not configured'}</p></div></div><div className="grid gap-4 sm:grid-cols-[1fr_auto]"><div className="space-y-2"><Label htmlFor="email-template">Approved template</Label><select id="email-template" className={selectClassName} value={template} onChange={(event) => setTemplate(event.target.value)}><option value="client-general">Client update</option><option value="advisor-onboarding">Advisor onboarding</option><option value="compliance-reminder">Compliance reminder</option><option value="commission-payment">Commission payment</option></select></div>{template === 'commission-payment' && <div className="space-y-2"><Label htmlFor="policy-last-four">Policy last four</Label><Input id="policy-last-four" inputMode="numeric" maxLength={4} value={policyLastFour} onChange={(event) => setPolicyLastFour(event.target.value.replace(/\D/g, '').slice(0, 4))} /></div>}<Button className="self-end" type="button" variant="outline" onClick={applyTemplate}>Apply template</Button></div><div className="space-y-2"><Label htmlFor="email-subject">Subject</Label><Input id="email-subject" value={subject} onChange={(event) => setSubject(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="email-body">Body</Label><Textarea id="email-body" rows={14} value={body} onChange={(event) => setBody(event.target.value)} /><Button type="button" variant="outline" onClick={insertApprovedSummary} disabled={!contextId}>{contextType === 'CLIENT' ? 'Insert Approved Client Summary' : 'Insert Selected Advisor Meeting Summary'}</Button></div><div className="rounded-lg border p-4"><Label htmlFor="email-attachment" className="flex cursor-pointer items-center gap-2 font-medium"><Upload className="h-4 w-4" />Add approved attachment</Label><Input id="email-attachment" className="mt-2" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void addAttachment(file); event.target.value = ''; }} /><p className="mt-2 text-xs text-slate-500">PDF, DOC/DOCX, XLS/XLSX, JPEG, PNG, or WebP; maximum 10 MiB. Files cannot send until malware status is CLEAN.</p>{attachments.map((attachment) => <p key={attachment.name} className="mt-2 text-sm"><FileWarning className="mr-2 inline h-4 w-4 text-amber-600" />{attachment.name} · {formatLabel(attachment.status)}</p>)}</div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void saveDraft()} disabled={saving || !to || !subject || !body}>Save Draft</Button><Button onClick={() => void preview()} disabled={saving || !to || !subject || !body}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Preview</Button><Button variant="ghost" onClick={() => { setDraftId(''); setSubject(''); setBody(''); setAttachments([]); }}>Cancel</Button></div></CardContent></Card><Card><CardHeader><CardTitle>Sending history</CardTitle><CardDescription>Failures are visible and retryable; no silent fallback provider.</CardDescription></CardHeader><CardContent className="space-y-3">{messages.slice(0, 20).map((message) => <div key={message.id} className="rounded-lg border p-3"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium">{message.subject || 'Untitled draft'}</p><Status value={message.status} /></div><p className="mt-1 text-xs text-slate-500">{message.to_addresses?.join(', ')} · {formatDate(message.created_at, true)}</p>{message.last_error_message && <p className="mt-2 text-xs text-red-600">{message.last_error_message}</p>}{message.status === 'FAILED' && <Button className="mt-2" size="sm" variant="outline" onClick={() => void retry(message.id)}><RefreshCw className="mr-2 h-3 w-3" />Retry</Button>}</div>)}</CardContent></Card></div>
    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Email preview</DialogTitle><DialogDescription>Review every recipient and the complete message before sending.</DialogDescription></DialogHeader><div className="space-y-3 rounded-lg border bg-slate-50 p-4 text-sm"><p><strong>To:</strong> {to}</p><p><strong>CC:</strong> {cc || 'None'}</p><p><strong>BCC:</strong> {visibleBcc || 'None'}</p><p><strong>Subject:</strong> {subject}</p><div className="whitespace-pre-wrap rounded border bg-white p-4">{body}</div>{attachments.length > 0 && <div className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-800">Attachments pending malware scan prevent sending.</div>}</div><label className="flex items-start gap-3 rounded-lg border p-3 text-sm"><Checkbox checked={sendConfirmed} onCheckedChange={(value) => setSendConfirmed(value === true)} /><span>I reviewed the recipients, BCC, subject, body, summary, and attachments and authorize this Gmail send.</span></label><DialogFooter><Button variant="outline" onClick={() => setPreviewOpen(false)}>Return to draft</Button><Button onClick={() => void send()} disabled={!sendConfirmed || saving || attachments.some((attachment) => attachment.status !== 'CLEAN')}><Send className="mr-2 h-4 w-4" />Send with Gmail</Button></DialogFooter></DialogContent></Dialog>
  </>;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<QuoteNotification[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { const response = await crmRequest<{ notifications: QuoteNotification[] }>('notifications'); setNotifications(response.notifications || []); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load notifications'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const retry = async (id: string) => { try { await crmRequest('notifications', { method: 'POST', body: JSON.stringify({ action: 'RETRY', id }) }); toast({ title: 'Notification accepted by Gmail SMTP' }); await load(); } catch (requestError) { toast({ title: 'Notification retry failed', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); await load(); } };
  if (loading) return <Loading label="Loading lead notifications..." />;
  if (error) return <Failure message={error} retry={load} />;
  const failed = notifications.filter((notification) => notification.status === 'FAILED').length;
  return <><PageIntro title="Notifications" description={`${failed} failed quote notification${failed === 1 ? '' : 's'} require review. Leads remain preserved regardless of email status.`} /><Card><CardContent className="pt-6">{notifications.length ? <Table><TableHeader><TableRow><TableHead>Lead</TableHead><TableHead>Contact</TableHead><TableHead>Status</TableHead><TableHead>Attempts</TableHead><TableHead>Created</TableHead><TableHead>Failure / action</TableHead></TableRow></TableHeader><TableBody>{notifications.map((notification) => <TableRow key={notification.id}><TableCell><Link className="font-medium hover:underline" to={`/management/leads/${notification.lead?.id}`}>{notification.lead?.public_id || notification.lead?.id || 'Unknown lead'}</Link></TableCell><TableCell>{contactName(notification.lead?.contact)}</TableCell><TableCell><Status value={notification.status} /></TableCell><TableCell>{notification.attempt_count}</TableCell><TableCell>{formatDate(notification.created_at, true)}</TableCell><TableCell><p className="max-w-md text-xs text-red-600">{notification.last_error_message || '—'}</p>{notification.status === 'FAILED' && <Button size="sm" variant="outline" className="mt-2" onClick={() => void retry(notification.id)}><RefreshCw className="mr-2 h-3 w-3" />Retry Gmail</Button>}</TableCell></TableRow>)}</TableBody></Table> : <p className="py-12 text-center text-sm text-slate-500">No quote notification records.</p>}</CardContent></Card></>;
}

export function ReportsOperationsPage() {
  const [reportType, setReportType] = useState('LEADS'); const [format, setFormat] = useState('CSV'); const [stage, setStage] = useState(''); const [source, setSource] = useState('');
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]); const [rowCount, setRowCount] = useState(0); const [loading, setLoading] = useState(false);
  const [previewRunId, setPreviewRunId] = useState('');
  const [sendOpen, setSendOpen] = useState(false); const [sendConfirmed, setSendConfirmed] = useState(false); const [recipient, setRecipient] = useState('hello@estatenest.ca');
  const [scheduleOpen, setScheduleOpen] = useState(false); const [schedule, setSchedule] = useState({ name: '', expression: '' }); const [scheduleConfirmed, setScheduleConfirmed] = useState(false);
  const reportStageOptions = reportType === 'ADVISORS'
    ? advisorStages.filter((value) => value !== 'ARCHIVED')
    : reportType === 'COMPLIANCE'
      ? ['PENDING', 'COMPLIANT', 'REVIEW_REQUIRED', 'NON_COMPLIANT']
      : reportType === 'COMMISSIONS'
        ? ['PENDING', 'APPROVED', 'RELEASED', 'PAID', 'HELD']
        : leadStatuses;
  const reportSupportsSource = ['LEADS', 'CLIENTS'].includes(reportType);
  const filters = { stage: stage || undefined, source: reportSupportsSource ? source || undefined : undefined };
  const invalidatePreview = () => { setPreviewRunId(''); setRows([]); setRowCount(0); };
  const preview = async () => { setLoading(true); try { const response = await crmRequest<{ previewRunId: string; rows: Array<Record<string, unknown>>; rowCount: number }>('reports', { method: 'POST', body: JSON.stringify({ action: 'PREVIEW', reportType, format, filters }) }); setPreviewRunId(response.previewRunId); setRows(response.rows || []); setRowCount(response.rowCount || 0); } catch (requestError) { invalidatePreview(); toast({ title: 'Could not preview report', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); } finally { setLoading(false); } };
  const exportReport = async () => { if (!previewRunId) return; setLoading(true); try { const response = await fetch('/api/crm?resource=reports', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'EXPORT', previewRunId, reportType, format, filters }) }); if (!response.ok) { const payload = await response.json(); throw new Error(payload.message || 'Export failed'); } const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || `estate-nest-report.${format === 'PDF' ? 'pdf' : format === 'EXCEL' ? 'xls' : 'csv'}`; anchor.click(); URL.revokeObjectURL(url); } catch (requestError) { toast({ title: 'Could not export report', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); } finally { setLoading(false); } };
  const sendReport = async () => { if (!sendConfirmed || !previewRunId) return; setLoading(true); try { await crmRequest('reports', { method: 'POST', body: JSON.stringify({ action: 'SEND', previewRunId, reportType, format, filters, recipient, confirm: true }) }); toast({ title: 'Report summary sent with Gmail' }); setSendOpen(false); setSendConfirmed(false); } catch (requestError) { toast({ title: 'Report send failed', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); } finally { setLoading(false); } };
  const saveSchedule = async () => { if (!previewRunId || !scheduleConfirmed) return; setLoading(true); try { const response = await crmRequest<{ message: string }>('reports', { method: 'POST', body: JSON.stringify({ action: 'SCHEDULE', previewRunId, reportType, format, filters, name: schedule.name, scheduleExpression: schedule.expression, recipients: [recipient], confirm: true }) }); toast({ title: 'Report schedule saved', description: response.message }); setScheduleOpen(false); setScheduleConfirmed(false); } catch (requestError) { toast({ title: 'Could not save schedule', description: requestError instanceof Error ? requestError.message : 'Unknown error', variant: 'destructive' }); } finally { setLoading(false); } };
  return <><PageIntro title="Reports" description="Filter, preview, export CSV/Excel/PDF, and configure confirmed report delivery." /><Card><CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4"><div className="space-y-2"><Label htmlFor="report-type">Report</Label><select id="report-type" className={selectClassName} value={reportType} onChange={(event) => { setReportType(event.target.value); setStage(''); setSource(''); invalidatePreview(); }}><option value="LEADS">Leads</option><option value="CLIENTS">Active clients</option><option value="ADVISORS">Advisors</option><option value="COMPLIANCE">Compliance</option><option value="COMMISSIONS">Commissions</option></select></div><div className="space-y-2"><Label htmlFor="report-stage">Stage / status</Label><select id="report-stage" className={selectClassName} value={stage} onChange={(event) => { setStage(event.target.value); invalidatePreview(); }}><option value="">All stages</option>{reportStageOptions.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div><div className="space-y-2"><Label htmlFor="report-source">Source</Label><select id="report-source" className={selectClassName} value={source} disabled={!reportSupportsSource} onChange={(event) => { setSource(event.target.value); invalidatePreview(); }}><option value="">{reportSupportsSource ? 'All sources' : 'Not applicable'}</option>{reportSupportsSource && leadSources.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div><div className="space-y-2"><Label htmlFor="report-format">Export format</Label><select id="report-format" className={selectClassName} value={format} onChange={(event) => { setFormat(event.target.value); invalidatePreview(); }}><option value="CSV">CSV</option><option value="EXCEL">Excel-compatible</option><option value="PDF">PDF summary</option></select></div><div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-4"><Button onClick={() => void preview()} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Preview report</Button><Button variant="outline" onClick={() => void exportReport()} disabled={loading || !previewRunId}><Download className="mr-2 h-4 w-4" />Export {formatLabel(format)}</Button><Button variant="outline" onClick={() => setSendOpen(true)} disabled={!previewRunId}><Mail className="mr-2 h-4 w-4" />Send summary</Button><Button variant="outline" onClick={() => setScheduleOpen(true)} disabled={!previewRunId}><Bell className="mr-2 h-4 w-4" />Schedule</Button></div></CardContent></Card>
    <Card className="mt-6"><CardHeader><CardTitle>Preview</CardTitle><CardDescription>{rowCount ? `${rowCount} matching records; first ${Math.min(rows.length, 100)} shown.` : 'Run a preview before sending or approving a schedule.'}</CardDescription></CardHeader><CardContent>{rows.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow>{Object.keys(rows[0]).map((key) => <TableHead key={key}>{formatLabel(key)}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.slice(0, 25).map((row, index) => <TableRow key={String(row.id || row.lead_id || index)}>{Object.keys(rows[0]).map((key) => <TableCell key={key} className="max-w-56 truncate">{String(row[key] ?? '')}</TableCell>)}</TableRow>)}</TableBody></Table></div> : <div className="flex min-h-48 flex-col items-center justify-center text-center text-slate-500"><FileCheck2 className="mb-3 h-10 w-10 text-slate-300" /><p>Report preview appears here.</p></div>}</CardContent></Card>
    <Dialog open={sendOpen} onOpenChange={setSendOpen}><DialogContent><DialogHeader><DialogTitle>Send report summary</DialogTitle><DialogDescription>The email contains a summary and directs the recipient to the authenticated portal instead of attaching a large file.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><select aria-label="Report recipient" className={selectClassName} value={recipient} onChange={(event) => setRecipient(event.target.value)}><option value="hello@estatenest.ca">hello@estatenest.ca</option><option value="kanwar@estatenest.ca">kanwar@estatenest.ca</option></select><label className="flex gap-3 rounded-lg border p-3 text-sm"><Checkbox checked={sendConfirmed} onCheckedChange={(value) => setSendConfirmed(value === true)} />I reviewed the report filters, preview, format, and recipient and authorize this send.</label></div><DialogFooter><Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button><Button onClick={() => void sendReport()} disabled={!sendConfirmed || loading}><Send className="mr-2 h-4 w-4" />Send summary</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}><DialogContent><DialogHeader><DialogTitle>Configure report schedule</DialogTitle><DialogDescription>Saving a schedule does not create a hidden automation. Automatic delivery remains inactive until an approved scheduler is connected.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><Input placeholder="Schedule name" value={schedule.name} onChange={(event) => setSchedule({ ...schedule, name: event.target.value })} /><Input placeholder="Schedule expression, e.g. Monthly on day 1 at 09:00 MT" value={schedule.expression} onChange={(event) => setSchedule({ ...schedule, expression: event.target.value })} /><label className="flex gap-3 rounded-lg border p-3 text-sm"><Checkbox checked={scheduleConfirmed} onCheckedChange={(value) => setScheduleConfirmed(value === true)} />I reviewed the preview, filters, recipient, and proposed schedule.</label></div><DialogFooter><Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button><Button onClick={() => void saveSchedule()} disabled={!schedule.name || !schedule.expression || !scheduleConfirmed || loading}>Save schedule</Button></DialogFooter></DialogContent></Dialog>
  </>;
}

export function OperationsAccessNotice({ role }: { role: string }) {
  if (privilegedRoles.has(role.toUpperCase())) return null;
  return <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><ShieldCheck className="mr-2 inline h-4 w-4" />Sensitive compliance, commission, archive, and configuration changes require an administrator or manager role.</div>;
}
