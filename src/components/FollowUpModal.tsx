import { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  FilePlus2,
  PhoneCall,
  Radio,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { StatusBadge } from '@/components/StatusBadge';
import { supabase } from '@/lib/supabase';
import { DEMO_CURRENT_DATE, STATE_META, formatDate } from '@/lib/constants';
import type { EvidenceRecord, OutcomeStateRecord, TimelineEvent, Trainee } from '@/types';

interface FollowUpModalProps {
  open: boolean;
  onClose: () => void;
  trainee: Trainee;
  historicalOutcome: OutcomeStateRecord | null;
  currentOutcome: OutcomeStateRecord | null;
  onWorkflowUpdated: () => Promise<void> | void;
}

type FollowUpChannel = 'sms' | 'call' | 'assisted';
type LivelihoodStatus =
  | 'currently_employed'
  | 'self_employed'
  | 'apprenticeship_training'
  | 'not_currently_working'
  | 'prefer_not_to_say'
  | '';

type WorkflowStage = 'form' | 'submitted' | 'verified';

interface FollowUpFormState {
  employerWorkplace: string;
  currentOccupation: string;
  approximateStartDate: string;
  employmentContinuity: string;
  monthlyEarningsRange: string;
  activityType: string;
  enterpriseName: string;
  activityStartDate: string;
  activityStatus: string;
  programmeType: string;
  institutionEmployer: string;
  apprenticeshipStartDate: string;
  primaryReason: string;
  notWorkingSince: string;
  supportRequested: string;
}

const initialFormState: FollowUpFormState = {
  employerWorkplace: '',
  currentOccupation: '',
  approximateStartDate: '2026-02-10',
  employmentContinuity: '',
  monthlyEarningsRange: '',
  activityType: '',
  enterpriseName: '',
  activityStartDate: '',
  activityStatus: '',
  programmeType: '',
  institutionEmployer: '',
  apprenticeshipStartDate: '',
  primaryReason: '',
  notWorkingSince: '',
  supportRequested: '',
};

export function FollowUpModal({
  open,
  onClose,
  trainee,
  historicalOutcome,
  currentOutcome,
  onWorkflowUpdated,
}: FollowUpModalProps) {
  const [channel, setChannel] = useState<FollowUpChannel>('call');
  const [livelihoodStatus, setLivelihoodStatus] = useState<LivelihoodStatus>('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [formState, setFormState] = useState<FollowUpFormState>(initialFormState);
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>('form');
  const [requestQueued, setRequestQueued] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTraineeResponse, setHasTraineeResponse] = useState(false);
  const [hasEmployerConfirmation, setHasEmployerConfirmation] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadWorkflowState = async () => {
      const { data: evidence } = await supabase
        .from('evidence_records')
        .select('evidence_type, source, status')
        .eq('trainee_id', trainee.id);

      const traineeResponseExists = (evidence ?? []).some(
        (record) =>
          record.evidence_type === 'Current employment response' &&
          (record.source === 'Trainee Response (mock)' || record.source === 'Trainee Response'),
      );
      const employerConfirmationExists = (evidence ?? []).some(
        (record) =>
          (record.evidence_type === 'Current employment confirmation' || record.evidence_type === 'Employer confirmation') &&
          record.source === 'Employer Portal (mock)' &&
          record.status === 'verified',
      );
      const confirmationRequestExists = (evidence ?? []).some(
        (record) =>
          record.evidence_type === 'Employer confirmation request' &&
          record.source === 'Outreach Workflow',
      );

      setHasTraineeResponse(traineeResponseExists);
      setHasEmployerConfirmation(employerConfirmationExists);
      setRequestQueued(confirmationRequestExists);
      setWorkflowStage(employerConfirmationExists ? 'verified' : traineeResponseExists ? 'submitted' : 'form');
    };

    loadWorkflowState();
  }, [open, trainee.id]);

  useEffect(() => {
    if (!open) {
      setChannel('call');
      setLivelihoodStatus('');
      setConsentChecked(false);
      setFormState(initialFormState);
      setWorkflowStage('form');
      setRequestQueued(false);
      setSaving(false);
      setSubmittingRequest(false);
      setSimulating(false);
      setError(null);
      setHasTraineeResponse(false);
      setHasEmployerConfirmation(false);
    }
  }, [open]);

  const livelihoodOptions = [
    { value: 'currently_employed' as const, label: 'Currently employed' },
    { value: 'self_employed' as const, label: 'Self-employed' },
    { value: 'apprenticeship_training' as const, label: 'Apprenticeship / training' },
    { value: 'not_currently_working' as const, label: 'Not currently working' },
    { value: 'prefer_not_to_say' as const, label: 'Prefer not to say' },
  ];

  const channels = [
    { id: 'sms' as const, label: 'SMS' },
    { id: 'call' as const, label: 'Call' },
    { id: 'assisted' as const, label: 'Assisted Outreach' },
  ];

  const responseSummary = useMemo(() => {
    switch (livelihoodStatus) {
      case 'currently_employed':
        return [
          'Currently employed',
          formState.currentOccupation || trainee.occupation || 'Occupation not captured',
          formState.employerWorkplace || 'Employer not provided',
        ]
          .filter(Boolean)
          .join(' · ');
      case 'self_employed':
        return [
          'Self-employed',
          formState.activityType || 'Activity type not captured',
          formState.enterpriseName || 'Enterprise name not provided',
        ]
          .filter(Boolean)
          .join(' · ');
      case 'apprenticeship_training':
        return [
          'Apprenticeship / training',
          formState.programmeType || 'Programme not captured',
          formState.institutionEmployer || 'Institution not provided',
        ]
          .filter(Boolean)
          .join(' · ');
      case 'not_currently_working':
        return [
          'Not currently working',
          formState.primaryReason || 'Reason not captured',
          formState.supportRequested || 'Support preference not captured',
        ]
          .filter(Boolean)
          .join(' · ');
      case 'prefer_not_to_say':
        return 'Prefer not to say';
      default:
        return '';
    }
  }, [formState, livelihoodStatus, trainee.occupation]);

  const canSubmit = livelihoodStatus !== '' && consentChecked;

  const updateField = (field: keyof FollowUpFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const createEvent = async (payload: {
    event_type: string;
    status: string;
    description: string;
    provenance_note: string;
    source_type: string;
    source_label: string;
  }) => {
    const { data, error: eventError } = await supabase
      .from('events')
      .insert({
        trainee_id: trainee.id,
        event_date: DEMO_CURRENT_DATE,
        ...payload,
      })
      .select('*')
      .single();

    if (eventError || !data) {
      throw eventError ?? new Error('Failed to create event');
    }

    return data as TimelineEvent;
  };

  const createEvidence = async (payload: {
    event_id?: string | null;
    evidence_type: string;
    source: string;
    status: string;
    observed_value: string;
    provenance: string;
    reviewer_state: string;
  }) => {
    const { data, error: evidenceError } = await supabase
      .from('evidence_records')
      .insert({
        trainee_id: trainee.id,
        observed_at: DEMO_CURRENT_DATE,
        event_id: payload.event_id ?? null,
        ...payload,
      })
      .select('*')
      .single();

    if (evidenceError || !data) {
      throw evidenceError ?? new Error('Failed to create evidence');
    }

    return data as EvidenceRecord;
  };

  const createOutcome = async (state: string, rationale: string) => {
    const { error: outcomeError } = await supabase.from('outcome_states').insert({
      trainee_id: trainee.id,
      state,
      rationale,
      as_of_date: DEMO_CURRENT_DATE,
    });

    if (outcomeError) {
      throw outcomeError;
    }
  };

  const handleSubmitOutcomeUpdate = async () => {
    if (!canSubmit) return;

    setSaving(true);
    setError(null);

    try {
      await supabase.from('outreach').insert({
        trainee_id: trainee.id,
        channel: channel.toUpperCase(),
        sent_at: DEMO_CURRENT_DATE,
        status: 'responded',
        response: livelihoodStatus,
        follow_up_due: null,
      });

      const followUpEvent = await createEvent({
        event_type: 'followup_completed',
        status: 'completed',
        source_type: 'outreach_workflow',
        source_label: 'Outreach Workflow',
        description: 'Follow-up completed and current livelihood response captured.',
        provenance_note: `Admin-assisted ${channel.toUpperCase()} workflow in demo environment.`,
      });

      await createEvidence({
        event_id: followUpEvent.id,
        evidence_type: 'Follow-up',
        source: 'Outreach Workflow',
        status: 'completed',
        observed_value: 'Follow-up completed',
        provenance: 'Outreach workflow completed to capture current livelihood response.',
        reviewer_state: 'verified',
      });

      const traineeResponseEvent = await createEvent({
        event_type: 'current_employment_response',
        status: 'new_signal',
        source_type: 'trainee_response',
        source_label: 'Trainee Response (mock)',
        description: responseSummary || 'Current livelihood status response received.',
        provenance_note: 'Self-reported',
      });

      await createEvidence({
        event_id: traineeResponseEvent.id,
        evidence_type: 'Current employment response',
        source: 'Trainee Response (mock)',
        status: 'new_signal',
        observed_value: responseSummary || 'Current livelihood status response received.',
        provenance: 'Self-reported',
        reviewer_state: 'review',
      });

      await createOutcome(
        'review_required',
        'A new employment signal has been received, but corroborating evidence is still required before the outcome can be treated as verified.',
      );

      setHasTraineeResponse(true);
      setWorkflowStage('submitted');
      await onWorkflowUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit outcome update');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestEmployerConfirmation = async () => {
    setSubmittingRequest(true);
    setError(null);

    try {
      await supabase.from('outreach').insert({
        trainee_id: trainee.id,
        channel: 'EMPLOYER PORTAL',
        sent_at: DEMO_CURRENT_DATE,
        status: 'sent',
        response: 'confirmation_requested',
        follow_up_due: '2026-09-10',
      });

      const requestEvent = await createEvent({
        event_type: 'employer_confirmation_requested',
        status: 'completed',
        source_type: 'outreach_workflow',
        source_label: 'Outreach Workflow',
        description: 'Employer confirmation requested for corroboration.',
        provenance_note: 'Mock employer outreach queued for demo.',
      });

      await createEvidence({
        event_id: requestEvent.id,
        evidence_type: 'Employer confirmation request',
        source: 'Outreach Workflow',
        status: 'completed',
        observed_value: 'Employer corroboration requested',
        provenance: 'Mock employer outreach queued for demo.',
        reviewer_state: 'verified',
      });

      setRequestQueued(true);
      await onWorkflowUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request employer confirmation');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleSimulateEmployerConfirmation = async () => {
    setSimulating(true);
    setError(null);

    try {
      const employerEvent = await createEvent({
        event_type: 'current_employment_confirmed',
        status: 'verified',
        source_type: 'employer_confirmation',
        source_label: 'Employer Portal (mock)',
        description: 'Current employment confirmed by employer.',
        provenance_note: 'DEMO / SYNTHETIC DATA',
      });

      await createEvidence({
        event_id: employerEvent.id,
        evidence_type: 'Current employment confirmation',
        source: 'Employer Portal (mock)',
        status: 'verified',
        observed_value: 'Current employment confirmed',
        provenance: 'Employer-submitted record',
        reviewer_state: 'verified',
      });

      await createOutcome(
        'verified',
        'Current employment is supported by corroborating trainee and employer evidence.',
      );

      setHasEmployerConfirmation(true);
      setWorkflowStage('verified');
      await onWorkflowUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to simulate employer confirmation');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Verify Current Livelihood Outcome"
      subtitle={`${trainee.display_name} · ${trainee.trainee_code}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <SummaryField label="Trainee" value={trainee.display_name} />
                <SummaryField label="Occupation" value={trainee.occupation ?? '—'} />
                <SummaryField
                  label="Previous status"
                  value={historicalOutcome ? STATE_META[historicalOutcome.state]?.label ?? historicalOutcome.state : '—'}
                />
                <SummaryField
                  label="Current system status"
                  value={currentOutcome ? STATE_META[currentOutcome.state]?.label ?? currentOutcome.state : '—'}
                />
              </div>
            </div>

            {workflowStage === 'form' && (
              <>
                <div>
                  <p className="text-sm font-semibold text-navy-800 mb-3">
                    What is your current livelihood status?
                  </p>
                  <div className="space-y-2">
                    {livelihoodOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLivelihoodStatus(option.value)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                          livelihoodStatus === option.value
                            ? 'border-navy-300 bg-navy-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {livelihoodStatus === option.value ? (
                            <CheckCircle2 className="h-4 w-4 text-navy-700 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                          )}
                          <span className="text-sm font-medium text-slate-800">{option.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {livelihoodStatus === 'currently_employed' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Employer / workplace">
                      <input
                        value={formState.employerWorkplace}
                        onChange={(e) => updateField('employerWorkplace', e.target.value)}
                        className="input-field"
                        placeholder="Shakti Manufacturing, Nagpur"
                      />
                    </FormField>
                    <FormField label="Current occupation">
                      <input
                        value={formState.currentOccupation}
                        onChange={(e) => updateField('currentOccupation', e.target.value)}
                        className="input-field"
                        placeholder="CNC Operator"
                      />
                    </FormField>
                    <FormField label="Approximate start date">
                      <input
                        type="date"
                        value={formState.approximateStartDate}
                        onChange={(e) => updateField('approximateStartDate', e.target.value)}
                        className="input-field"
                      />
                    </FormField>
                    <FormField label="Employment continuity">
                      <input
                        value={formState.employmentContinuity}
                        onChange={(e) => updateField('employmentContinuity', e.target.value)}
                        className="input-field"
                        placeholder="Rejoined in February 2026"
                      />
                    </FormField>
                    <FormField label="Optional monthly earnings range">
                      <input
                        value={formState.monthlyEarningsRange}
                        onChange={(e) => updateField('monthlyEarningsRange', e.target.value)}
                        className="input-field"
                        placeholder="₹12,000–₹15,000"
                      />
                    </FormField>
                  </div>
                )}

                {livelihoodStatus === 'self_employed' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Type of activity">
                      <input
                        value={formState.activityType}
                        onChange={(e) => updateField('activityType', e.target.value)}
                        className="input-field"
                        placeholder="Fabrication work"
                      />
                    </FormField>
                    <FormField label="Business / enterprise name">
                      <input
                        value={formState.enterpriseName}
                        onChange={(e) => updateField('enterpriseName', e.target.value)}
                        className="input-field"
                        placeholder="Rahul Engineering Works"
                      />
                    </FormField>
                    <FormField label="Start date">
                      <input
                        type="date"
                        value={formState.activityStartDate}
                        onChange={(e) => updateField('activityStartDate', e.target.value)}
                        className="input-field"
                      />
                    </FormField>
                    <FormField label="Current activity status">
                      <input
                        value={formState.activityStatus}
                        onChange={(e) => updateField('activityStatus', e.target.value)}
                        className="input-field"
                        placeholder="Active"
                      />
                    </FormField>
                  </div>
                )}

                {livelihoodStatus === 'apprenticeship_training' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Programme type">
                      <input
                        value={formState.programmeType}
                        onChange={(e) => updateField('programmeType', e.target.value)}
                        className="input-field"
                        placeholder="Advanced machine training"
                      />
                    </FormField>
                    <FormField label="Institution / employer">
                      <input
                        value={formState.institutionEmployer}
                        onChange={(e) => updateField('institutionEmployer', e.target.value)}
                        className="input-field"
                        placeholder="Nagpur Precision Works"
                      />
                    </FormField>
                    <FormField label="Start date">
                      <input
                        type="date"
                        value={formState.apprenticeshipStartDate}
                        onChange={(e) => updateField('apprenticeshipStartDate', e.target.value)}
                        className="input-field"
                      />
                    </FormField>
                  </div>
                )}

                {livelihoodStatus === 'not_currently_working' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Primary reason">
                      <input
                        value={formState.primaryReason}
                        onChange={(e) => updateField('primaryReason', e.target.value)}
                        className="input-field"
                        placeholder="Family responsibilities"
                      />
                    </FormField>
                    <FormField label="Since when">
                      <input
                        type="date"
                        value={formState.notWorkingSince}
                        onChange={(e) => updateField('notWorkingSince', e.target.value)}
                        className="input-field"
                      />
                    </FormField>
                    <FormField label="Would the trainee like support?">
                      <select
                        value={formState.supportRequested}
                        onChange={(e) => updateField('supportRequested', e.target.value)}
                        className="input-field"
                      >
                        <option value="">Select</option>
                        <option value="Yes, job support requested">Yes</option>
                        <option value="No support requested">No</option>
                        <option value="Will decide later">Will decide later</option>
                      </select>
                    </FormField>
                  </div>
                )}

                {livelihoodStatus === 'prefer_not_to_say' && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    The response will still be stored as evidence, and the current outcome will remain under review until corroborating evidence is available.
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <p className="text-sm text-slate-600">
                    Information provided is used only to update the trainee&apos;s livelihood outcome record and programme follow-up status.
                  </p>
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-navy-700 focus:ring-navy-400"
                    />
                    I understand
                  </label>
                </div>
              </>
            )}

            {workflowStage !== 'form' && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-slate-500">CURRENT OUTCOME</p>
                    <div className="mt-2">
                      <StatusBadge
                        status={hasEmployerConfirmation ? 'verified' : 'review_required'}
                        size="md"
                      />
                    </div>
                  </div>
                  {hasEmployerConfirmation && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-right">
                      <p className="text-[11px] font-semibold text-amber-700">DEMO / SYNTHETIC DATA</p>
                      <p className="text-[11px] text-amber-600">Employer corroboration is simulated for the demo.</p>
                    </div>
                  )}
                </div>

                {!hasEmployerConfirmation ? (
                  <p className="text-sm text-slate-600">
                    A new employment signal has been received, but corroborating evidence is still required before the outcome can be treated as verified.
                  </p>
                ) : (
                  <p className="text-sm text-slate-600">
                    Current employment is supported by corroborating trainee and employer evidence.
                  </p>
                )}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold tracking-wide text-slate-500 mb-3">RECONCILIATION STATE</p>
                  <div className="space-y-2.5">
                    <ReconciliationRow
                      icon={ShieldCheck}
                      label="Historical placement"
                      status="verified"
                      detail="Placement (Historical)"
                    />
                    <ReconciliationRow
                      icon={Radio}
                      label="Employment exit signal"
                      status="signal"
                      detail="Administrative exit signal remains visible"
                    />
                    <ReconciliationRow
                      icon={ClipboardCheck}
                      label="New trainee response"
                      status="new_signal"
                      detail="Current employment response"
                    />
                    <ReconciliationRow
                      icon={PhoneCall}
                      label="Follow-up"
                      status="completed"
                      detail="Completed"
                    />
                    {hasEmployerConfirmation && (
                      <ReconciliationRow
                        icon={Building2}
                        label="Current employment confirmation"
                        status="verified"
                        detail="Employer Portal (mock)"
                      />
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold tracking-wide text-blue-700">NEW EVIDENCE EVENT</p>
                  <div className="mt-3 space-y-1.5 text-sm text-blue-900">
                    <p className="font-semibold">Current employment response</p>
                    <p>Source: Trainee Response (mock)</p>
                    <p>Status: New Signal</p>
                    <p>Date: {formatDate(DEMO_CURRENT_DATE)}</p>
                    <p>Provenance: Self-reported</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold tracking-wide text-slate-500 mb-4">WORKFLOW PATH</p>
              <div className="space-y-3 text-sm">
                <WorkflowStep active label="Review Required" />
                <WorkflowConnector />
                <WorkflowStep active={hasTraineeResponse} label="Follow-up Completed" />
                <WorkflowConnector />
                <WorkflowStep active={hasTraineeResponse} label="New Evidence" />
                <WorkflowConnector />
                <WorkflowStep active={hasEmployerConfirmation} label="Corroboration" />
                <WorkflowConnector />
                <WorkflowStep active={hasEmployerConfirmation} label="Verified" />
              </div>
            </div>

            {workflowStage !== 'form' && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-slate-500">NEXT ACTION</p>
                  <p className="mt-1 text-sm text-slate-600">
                    The trainee response is evidence, not automatic truth. Add corroboration before treating the current outcome as verified.
                  </p>
                </div>

                <button
                  onClick={handleRequestEmployerConfirmation}
                  disabled={submittingRequest || requestQueued}
                  className="btn-secondary w-full justify-center"
                >
                  <FilePlus2 className="h-4 w-4" />
                  {requestQueued ? 'Employer Confirmation Requested' : 'Request Employer Confirmation'}
                </button>

                <button
                  onClick={handleSimulateEmployerConfirmation}
                  disabled={simulating || hasEmployerConfirmation}
                  className="btn-success w-full justify-center"
                >
                  <UserCheck className="h-4 w-4" />
                  {hasEmployerConfirmation ? 'Employer Confirmation Recorded' : 'Simulate Employer Confirmation'}
                </button>

                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                  <p className="text-xs font-semibold text-amber-700">DEMO / SYNTHETIC DATA</p>
                  <p className="mt-1 text-xs text-amber-700">
                    No live EPFO, Udyam, e-Shram, NCS, or SIDH integration is being claimed here.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold tracking-wide text-slate-500 mb-3">FOLLOW-UP CHANNEL</p>
              <div className="grid grid-cols-1 gap-2">
                {channels.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setChannel(item.id)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                      channel === item.id
                        ? 'border-navy-300 bg-navy-50 text-navy-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400">Demo date: {formatDate(DEMO_CURRENT_DATE)}</p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
            {workflowStage === 'form' && (
              <button
                onClick={handleSubmitOutcomeUpdate}
                disabled={!canSubmit || saving}
                className="btn-primary"
              >
                <BriefcaseBusiness className="h-4 w-4" />
                {saving ? 'Submitting...' : 'Submit Outcome Update'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function ReconciliationRow({
  icon: Icon,
  label,
  status,
  detail,
}: {
  icon: typeof Calendar;
  label: string;
  status: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">{label}</p>
          <p className="text-xs text-slate-500 truncate">{detail}</p>
        </div>
      </div>
      <StatusBadge status={status} kind="evidence" />
    </div>
  );
}

function WorkflowStep({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full border ${
          active
            ? 'border-navy-200 bg-navy-50 text-navy-700'
            : 'border-slate-200 bg-white text-slate-300'
        }`}
      >
        <CheckCircle2 className="h-4 w-4" />
      </div>
      <span className={`font-medium ${active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}

function WorkflowConnector() {
  return <div className="ml-[15px] h-4 w-px bg-slate-200" />;
}
