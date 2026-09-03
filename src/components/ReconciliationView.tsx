import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  GitMerge,
  HelpCircle,
  Info,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { DEMO_CURRENT_DATE, EVIDENCE_META, STATE_META, formatDate } from '@/lib/constants';
import type { EvidenceRecord, OutcomeStateRecord, TimelineEvent, Trainee } from '@/types';

interface ReconciliationViewProps {
  trainee: Trainee;
  events: TimelineEvent[];
  evidence: EvidenceRecord[];
  outcomes: OutcomeStateRecord[];
}

export function ReconciliationView({ trainee, events, evidence, outcomes }: ReconciliationViewProps) {
  const currentOutcome = outcomes.length > 0 ? outcomes[outcomes.length - 1] : null;

  const historicalPlacement = evidence.find((record) => record.evidence_type === 'Placement report');
  const traineeResponse = evidence.find((record) => record.evidence_type === 'Current employment response');
  const followUpCompleted = evidence.find(
    (record) => record.evidence_type === 'Follow-up' && record.status === 'completed',
  );
  const employerConfirmation = evidence.find(
    (record) =>
      record.evidence_type === 'Current employment confirmation' ||
      record.evidence_type === 'Employer confirmation',
  );
  const employerConfirmationRequested = evidence.find(
    (record) => record.evidence_type === 'Employer confirmation request',
  );
  const isRahul = trainee.trainee_code === 'MS-24-01842';

  // The reconciliation layer shows every record, including contradictory history.
  const evidenceStreams = evidence.map((record) => ({
    id: record.id,
    label: record.evidence_type,
    source: record.source,
    status: record.status,
    detail: record.observed_value ?? '',
    provenance: record.provenance,
    icon: EVIDENCE_META[record.status]?.icon ?? HelpCircle,
  }));

  const currentStateMeta = currentOutcome ? STATE_META[currentOutcome.state] : null;
  const CurrentStateIcon = currentStateMeta?.icon ?? HelpCircle;
  const hasTraineeResponse = Boolean(traineeResponse);
  const hasEmployerConfirmation = Boolean(employerConfirmation);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-navy-600" />
            <h2 className="text-sm font-semibold text-navy-800">MahaSETU Reconciliation Layer</h2>
          </div>
          <p className="text-xs text-slate-400">As of {formatDate(currentOutcome?.as_of_date ?? DEMO_CURRENT_DATE)}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-wide text-slate-500">EVIDENCE STREAMS</p>
            {evidenceStreams.map((stream, idx) => {
              const meta = EVIDENCE_META[stream.status] ?? EVIDENCE_META.unresolved;
              const Icon = stream.icon;

              return (
                <div
                  key={stream.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 animate-slide-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`rounded-lg p-1.5 ${meta.bg}`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{stream.label}</p>
                      <p className="text-xs text-slate-500">{stream.detail}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Source: {stream.source}</p>
                      {stream.provenance && <p className="text-xs text-slate-400">Provenance: {stream.provenance}</p>}
                    </div>
                  </div>
                  <StatusBadge status={stream.status} kind="evidence" />
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border-2 p-5 bg-white border-slate-200">
              <p className="text-xs font-semibold tracking-wide text-slate-500">CURRENT OUTCOME</p>
              <div className="mt-3 flex items-center gap-3">
                <CurrentStateIcon className={`w-6 h-6 ${currentStateMeta?.color ?? 'text-slate-400'}`} />
                <div>
                  <p className={`text-base font-bold ${currentStateMeta?.color ?? 'text-slate-500'}`}>
                    {currentOutcome ? currentStateMeta?.label ?? currentOutcome.state : 'No outcome'}
                  </p>
                  {isRahul && hasEmployerConfirmation && (
                    <p className="text-xs font-semibold text-emerald-700">Verified — Currently Employed</p>
                  )}
                </div>
              </div>
              {currentOutcome && (
                <>
                  <p className="mt-3 text-sm text-slate-600">{currentOutcome.rationale}</p>
                  <p className="mt-2 text-xs text-slate-400">Updated {formatDate(currentOutcome.as_of_date)}</p>
                </>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold tracking-wide text-slate-500 mb-3">WORKFLOW STATE</p>
              <div className="space-y-2.5">
                <WorkflowLine label="Review Required" active />
                <WorkflowLine label="Follow-up Completed" active={Boolean(followUpCompleted)} />
                <WorkflowLine label="New Evidence" active={hasTraineeResponse} />
                <WorkflowLine label="Corroboration" active={hasEmployerConfirmation} />
                <WorkflowLine label="Verified" active={currentOutcome?.state === 'verified'} />
              </div>
            </div>

            {(employerConfirmationRequested || hasEmployerConfirmation) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold text-amber-700">DEMO / SYNTHETIC DATA</p>
                <p className="mt-1 text-xs text-amber-700">
                  Employer corroboration is shown through the mock employer portal for demonstration only.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-navy-800">Why is this current outcome in this state?</h3>
        </div>

        <div className="space-y-2.5">
          {currentOutcome?.state === 'review_required' && (
            <>
              <ExplanationRow
                icon={ShieldCheck}
                color="text-emerald-600"
                text="Historical placement remains verified, but historical placement is not the same as current employment."
              />
              <ExplanationRow
                icon={AlertTriangle}
                color="text-amber-600"
                text="Signal drift remains visible through changed contact and location information."
              />
              <ExplanationRow
                icon={Radio}
                color="text-blue-700"
                text={
                  hasTraineeResponse
                    ? 'A new trainee response has been received, but corroborating evidence is still required before the current outcome can be treated as verified.'
                    : 'An employment exit signal exists, and the current livelihood status is unresolved until follow-up produces usable evidence.'
                }
              />
            </>
          )}

          {currentOutcome?.state === 'verified' && (
            <>
              <ExplanationRow
                icon={ShieldCheck}
                color="text-emerald-600"
                text="Historical placement remains preserved as historical evidence."
              />
              <ExplanationRow
                icon={CheckCircle2}
                color="text-emerald-600"
                text="Current employment is supported by corroborating trainee and employer evidence."
              />
              <ExplanationRow
                icon={Info}
                color="text-slate-500"
                text="The exit signal is still visible in the ledger and timeline, but it has been superseded by more recent corroborated evidence."
              />
            </>
          )}

          {currentOutcome?.state === 'undetermined' && (
            <ExplanationRow
              icon={HelpCircle}
              color="text-slate-500"
              text="Insufficient evidence is available to establish a current livelihood outcome."
            />
          )}

          {currentOutcome?.state === 'conflict' && (
            <ExplanationRow
              icon={AlertOctagon}
              color="text-red-600"
              text="Contradictory evidence is preserved and requires manual reconciliation before a current outcome can be finalized."
            />
          )}
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            MahaSETU preserves contradictory and historical evidence, explains why an outcome is unresolved, and does not allow AI extraction or self-reported data alone to establish the final outcome.
          </p>
        </div>

        {events.length > 0 && (
          <p className="mt-3 text-xs text-slate-400">
            Timeline currently contains {events.length} longitudinal events for this trainee.
          </p>
        )}
      </div>
    </div>
  );
}

function ExplanationRow({
  icon: Icon,
  color,
  text,
}: {
  icon: typeof CheckCircle2;
  color: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  );
}

function WorkflowLine({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <span className={`text-sm font-medium ${active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
      <StatusBadge status={active ? 'completed' : 'unresolved'} kind="evidence" />
    </div>
  );
}
