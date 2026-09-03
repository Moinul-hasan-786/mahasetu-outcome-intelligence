import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  PhoneCall,
  FileText,
  Sparkles,
  GitMerge,
  Clock,
  MapPin,
  Building2,
  GraduationCap,
  Calendar,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/StatusBadge';
import { FollowUpModal } from '@/components/FollowUpModal';
import { AiAssistant } from '@/components/AiAssistant';
import { ReconciliationView } from '@/components/ReconciliationView';
import { EvidenceDrawer } from '@/components/EvidenceDrawer';
import {
  STATE_META,
  EVIDENCE_META,
  formatDate,
} from '@/lib/constants';
import type {
  Trainee,
  TimelineEvent,
  EvidenceRecord,
  OutcomeStateRecord,
  AiExtraction,
  OutreachRecord,
} from '@/types';

interface TraineeProfileProps {
  trainee: Trainee;
  onBack: () => void;
}

type TabId = 'timeline' | 'evidence' | 'ai' | 'reconciliation';

export function TraineeProfile({ trainee, onBack }: TraineeProfileProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeStateRecord[]>([]);
  const [aiExtractions, setAiExtractions] = useState<AiExtraction[]>([]);
  const [outreach, setOutreach] = useState<OutreachRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('timeline');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);
  const [followUpOpen, setFollowUpOpen] = useState(false);

  const loadData = useCallback(async () => {
    const [evRes, eviRes, outRes, aiRes, orRes] = await Promise.all([
      supabase.from('events').select('*').eq('trainee_id', trainee.id).order('event_date', { ascending: true }),
      supabase.from('evidence_records').select('*').eq('trainee_id', trainee.id).order('observed_at', { ascending: true }),
      supabase
        .from('outcome_states')
        .select('*')
        .eq('trainee_id', trainee.id)
        .order('as_of_date', { ascending: true })
        .order('updated_at', { ascending: true }),
      supabase.from('ai_extractions').select('*').eq('trainee_id', trainee.id).order('created_at', { ascending: false }),
      supabase.from('outreach').select('*').eq('trainee_id', trainee.id).order('sent_at', { ascending: false }),
    ]);

    setEvents(evRes.data ?? []);
    setEvidence(eviRes.data ?? []);
    setOutcomes(outRes.data ?? []);
    setAiExtractions(aiRes.data ?? []);
    setOutreach(orRes.data ?? []);
    setLoading(false);
  }, [trainee.id]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [trainee.id, loadData]);

  const currentOutcome = outcomes.length > 0 ? outcomes[outcomes.length - 1] : null;
  const historicalOutcome = outcomes.length > 1 ? outcomes[0] : null;
  const isRahul = trainee.trainee_code === 'MS-24-01842';
  const hasEmployerConfirmation = useMemo(
    () =>
      evidence.some(
        (record) =>
          (record.evidence_type === 'Current employment confirmation' || record.evidence_type === 'Employer confirmation') &&
          record.source === 'Employer Portal (mock)' &&
          record.status === 'verified',
      ),
    [evidence],
  );
  const hasCurrentEmploymentResponse = useMemo(
    () =>
      evidence.some(
        (record) =>
          record.evidence_type === 'Current employment response' &&
          (record.source === 'Trainee Response (mock)' || record.source === 'Trainee Response'),
      ),
    [evidence],
  );
  const currentOutcomeLabel =
    isRahul && currentOutcome?.state === 'verified' && hasEmployerConfirmation
      ? 'Verified — Currently Employed'
      : currentOutcome
        ? STATE_META[currentOutcome.state]?.label
        : null;

  const tabs: { id: TabId; label: string; icon: typeof Clock }[] = [
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'evidence', label: 'Evidence Ledger', icon: FileText },
    { id: 'ai', label: 'AI Evidence Assistant', icon: Sparkles },
    { id: 'reconciliation', label: 'Reconciliation', icon: GitMerge },
  ];

  const handleEvidenceAdded = async (newEvidence: EvidenceRecord, newEvent?: TimelineEvent, newState?: OutcomeStateRecord) => {
    if (newEvent) {
      setEvents((prev) => [...prev, newEvent].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));
    }
    setEvidence((prev) => [...prev, newEvidence].sort((a, b) => new Date(a.observed_at ?? '').getTime() - new Date(b.observed_at ?? '').getTime()));
    if (newState) {
      setOutcomes((prev) => [...prev, newState]);
    }
    await loadData();
  };

  const eventIcon = (eventType: string): string => {
    const map: Record<string, string> = {
      training_completed: 'GraduationCap',
      placement_reported: 'Building2',
      contact_changed: 'PhoneCall',
      location_changed: 'MapPin',
      job_ended: 'AlertTriangle',
      followup_missed: 'Clock',
      followup_completed: 'PhoneCall',
      employment_verified: 'CheckCircle2',
      self_employment: 'Building2',
      apprenticeship_started: 'GraduationCap',
      no_formal_signal: 'HelpCircle',
      employer_says_employed: 'CheckCircle2',
      trainee_says_ended: 'AlertTriangle',
      current_employment_response: 'Clock',
      employer_confirmation_requested: 'PhoneCall',
      current_employment_confirmed: 'CheckCircle2',
    };
    return map[eventType] ?? 'Clock';
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Trainees
      </button>

      {/* Profile header */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: identity */}
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-lg shrink-0">
              {trainee.display_name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy-800">{trainee.display_name}</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {trainee.occupation} · {trainee.trainee_code}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Building2 className="w-3.5 h-3.5" /> {trainee.provider}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <GraduationCap className="w-3.5 h-3.5" /> {trainee.course}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5" /> {trainee.current_district}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" /> Updated {currentOutcome ? formatDate(currentOutcome.as_of_date) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: outcome + action */}
          <div className="flex flex-col items-start lg:items-end gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-1.5 text-right">Current Outcome</p>
              {currentOutcome ? (
                <div className="space-y-1.5">
                  <StatusBadge status={currentOutcome.state} size="md" />
                  {currentOutcomeLabel && currentOutcomeLabel !== STATE_META[currentOutcome.state]?.label && (
                    <p className="text-right text-xs font-semibold text-emerald-700">{currentOutcomeLabel}</p>
                  )}
                </div>
              ) : (
                <span className="text-sm text-slate-400">No outcome recorded</span>
              )}
            </div>
            <button onClick={() => setFollowUpOpen(true)} className="btn-primary">
              <PhoneCall className="w-4 h-4" />
              Start Follow-up
            </button>
          </div>
        </div>

        {/* Hero state message for Rahul */}
        {isRahul && historicalOutcome && currentOutcome && (
          <div
            className={`mt-6 flex items-start gap-4 rounded-xl border p-4 ${
              hasEmployerConfirmation ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
            }`}
          >
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">Was: {STATE_META[historicalOutcome.state]?.label}</span>
              </div>
              <ArrowLeft className="w-4 h-4 text-slate-400 rotate-[-90deg]" />
              <div className="flex items-center gap-2">
                {hasEmployerConfirmation ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
                <span className={`text-xs font-medium ${hasEmployerConfirmation ? 'text-emerald-700' : 'text-amber-700'}`}>
                  Now: {currentOutcomeLabel ?? STATE_META[currentOutcome.state]?.label}
                </span>
              </div>
            </div>
            <div className={`pl-4 ${hasEmployerConfirmation ? 'border-l border-emerald-200' : 'border-l border-amber-200'}`}>
              <p className={`text-sm font-semibold ${hasEmployerConfirmation ? 'text-emerald-800' : 'text-amber-800'}`}>
                {hasEmployerConfirmation
                  ? 'Current outcome now has corroborating evidence.'
                  : 'The person moved on. The record didn\'t.'}
              </p>
              <p className={`mt-1 text-sm ${hasEmployerConfirmation ? 'text-emerald-700' : 'text-amber-700'}`}>
                {hasEmployerConfirmation
                  ? 'Historical placement remains visible, and current employment is now supported by both trainee and employer evidence.'
                  : hasCurrentEmploymentResponse
                    ? 'A new trainee response has been received, but corroborating evidence is still required before current employment can be treated as verified.'
                    : 'Historical placement exists, but contact/location drift, an exit signal, and an unresolved follow-up mean the current livelihood outcome cannot be established without action.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-navy-700 text-navy-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'ai' && aiExtractions.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
                  {aiExtractions.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-slate-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Timeline */}
          {activeTab === 'timeline' && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-navy-800 mb-5">Longitudinal Timeline</h2>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-200" />

                <div className="space-y-5">
                  {events.map((event, idx) => {
                    const meta = EVIDENCE_META[event.status] ?? EVIDENCE_META.verified;
                    const iconName = eventIcon(event.event_type);
                    return (
                      <div key={event.id} className="flex items-start gap-4 relative animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                        {/* Icon */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${meta.bg} ${meta.border} relative z-10`}
                        >
                          <EventIcon name={iconName} className={`w-4.5 h-4.5 ${meta.color}`} />
                        </div>
                        {/* Content */}
                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {formatEventLabel(event.event_type)}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-slate-400">{formatDate(event.event_date)}</span>
                              <StatusBadge status={event.status} kind="evidence" />
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 mt-1.5">
                            Source: {event.source_label} · {event.provenance_note}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Outreach summary */}
              {outreach.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-500 mb-3">OUTREACH HISTORY</h3>
                  {outreach.map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3">
                        <PhoneCall className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-700">{o.channel} follow-up sent</p>
                          <p className="text-xs text-slate-400">{formatDate(o.sent_at)} · Due: {formatDate(o.follow_up_due)}</p>
                        </div>
                      </div>
                      <StatusBadge status={o.status === 'no_response' ? 'unresolved' : 'verified'} kind="evidence" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Evidence Ledger */}
          {activeTab === 'evidence' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-navy-800">Evidence Ledger</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {evidence.length} records · All evidence preserved — contradictory signals kept visible
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Evidence</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">Source</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden sm:table-cell">Date</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">Provenance</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.map((ev) => {
                    const meta = EVIDENCE_META[ev.status] ?? EVIDENCE_META.verified;
                    return (
                      <tr
                        key={ev.id}
                        onClick={() => setSelectedEvidence(ev)}
                        className="border-b border-slate-100 last:border-0 table-row-hover"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-800">{ev.evidence_type}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{ev.observed_value}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{ev.source}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 hidden sm:table-cell">{formatDate(ev.observed_at)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={ev.status} kind="evidence" />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">{ev.provenance}</td>
                        <td className="px-4 py-3 text-right">
                          <ChevronRight className="w-4 h-4 text-slate-300 inline" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* AI Assistant */}
          {activeTab === 'ai' && (
            <AiAssistant
              trainee={trainee}
              extractions={aiExtractions}
              onAddedToLedger={handleEvidenceAdded}
            />
          )}

          {/* Reconciliation */}
          {activeTab === 'reconciliation' && (
            <ReconciliationView
              trainee={trainee}
              events={events}
              evidence={evidence}
              outcomes={outcomes}
            />
          )}
        </>
      )}

      {/* Evidence detail drawer */}
      {selectedEvidence && (
        <EvidenceDrawer
          evidence={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}

      {/* Follow-up modal */}
      <FollowUpModal
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        trainee={trainee}
        historicalOutcome={historicalOutcome}
        currentOutcome={currentOutcome}
        onWorkflowUpdated={loadData}
      />
    </div>
  );
}

function formatEventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    training_completed: 'Training Completed',
    placement_reported: 'Placement Reported',
    contact_changed: 'Contact Changed',
    location_changed: 'Location Changed',
    job_ended: 'Job Ended',
    followup_missed: 'Follow-up Missed',
    followup_completed: 'Follow-up Completed',
    employment_verified: 'Employment Verified',
    self_employment: 'Self-Employment Started',
    apprenticeship_started: 'Apprenticeship Started',
    no_formal_signal: 'Formal Signal Unavailable',
    employer_says_employed: 'Employer Reports Employed',
    trainee_says_ended: 'Trainee Reports Job Ended',
    current_employment_response: 'Current Employment Response',
    employer_confirmation_requested: 'Employer Confirmation Requested',
    current_employment_confirmed: 'Current Employment Confirmed',
  };
  return labels[eventType] ?? eventType;
}

function EventIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, typeof Clock> = {
    GraduationCap,
    Building2,
    PhoneCall,
    MapPin,
    AlertTriangle,
    Clock,
    CheckCircle2,
    HelpCircle,
  };
  const Icon = icons[name] ?? Clock;
  return <Icon className={className} />;
}
