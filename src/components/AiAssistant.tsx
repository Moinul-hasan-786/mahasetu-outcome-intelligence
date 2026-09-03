import { Sparkles, FileText, Plus, X, Info } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/StatusBadge';
import type { Trainee, AiExtraction, EvidenceRecord, TimelineEvent } from '@/types';

interface AiAssistantProps {
  trainee: Trainee;
  extractions: AiExtraction[];
  onAddedToLedger: (evidence: EvidenceRecord, event?: TimelineEvent) => void;
}

export function AiAssistant({ trainee, extractions, onAddedToLedger }: AiAssistantProps) {
  const [adding, setAdding] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleAddToLedger = async (extraction: AiExtraction) => {
    setAdding(true);
    try {
      // Create a new event
      const { data: newEvent, error: evError } = await supabase
        .from('events')
        .insert({
          trainee_id: trainee.id,
          event_type: 'job_ended',
          event_date: '2026-01-15',
          source_type: 'ai_extraction',
          source_label: 'AI Evidence Assistant',
          status: 'signal',
          description: `AI-extracted: ${extraction.extracted_event} — ${extraction.extracted_reason}`,
          provenance_note: 'AI-assisted extraction from employer message. Needs human verification.',
        })
        .select('*')
        .single();

      if (evError || !newEvent) throw evError ?? new Error('Failed to create event');

      // Create evidence record linked to event
      const { data: newEvidence, error: eviError } = await supabase
        .from('evidence_records')
        .insert({
          trainee_id: trainee.id,
          event_id: newEvent.id,
          evidence_type: 'AI-Extracted Event',
          source: 'AI Evidence Assistant',
          status: 'signal',
          observed_value: `${extraction.extracted_event} — ${extraction.extracted_reason}`,
          observed_at: '2026-01-15',
          provenance: 'AI-assisted extraction from employer message. Needs human verification.',
          reviewer_state: 'review',
        })
        .select('*')
        .single();

      if (eviError || !newEvidence) throw eviError ?? new Error('Failed to create evidence');

      // Mark extraction as added
      await supabase
        .from('ai_extractions')
        .update({ verification_state: 'added_to_ledger' })
        .eq('id', extraction.id);

      onAddedToLedger(newEvidence, newEvent);
    } catch (err) {
      console.error('Failed to add to ledger:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const visibleExtractions = extractions.filter((e) => !dismissed.has(e.id));

  return (
    <div className="space-y-4 animate-fade-in">
      {visibleExtractions.length === 0 ? (
        <div className="card p-8 text-center">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No pending AI extractions for this trainee.</p>
        </div>
      ) : (
        visibleExtractions.map((extraction) => (
          <div key={extraction.id} className="card p-5">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-blue-50">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-sm font-semibold text-navy-800">AI Evidence Assistant</h2>
              <span className="text-xs text-slate-400 ml-auto">Deterministic extraction</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: input message */}
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">SOURCE MESSAGE</p>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-sm text-slate-700 italic">"{extraction.input_text}"</p>
                  <p className="text-xs text-slate-400 mt-2">— Employer message (mock)</p>
                </div>
              </div>

              {/* Right: extraction card */}
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">EXTRACTED EVENT</p>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-2.5">
                  <ExtractField label="Event" value={extraction.extracted_event ?? '—'} />
                  <ExtractField label="Date" value={extraction.extracted_date ?? '—'} />
                  <ExtractField label="Reason" value={extraction.extracted_reason ?? '—'} />
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500">Status:</span>
                    <StatusBadge status="signal" kind="evidence" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => handleAddToLedger(extraction)}
                disabled={adding || extraction.verification_state === 'added_to_ledger'}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" />
                {extraction.verification_state === 'added_to_ledger' ? 'Added to Ledger' : 'Add to Ledger'}
              </button>
              <button
                onClick={() => handleDismiss(extraction.id)}
                className="btn-secondary"
              >
                <X className="w-4 h-4" />
                Dismiss
              </button>
            </div>

            {/* Disclosure */}
            <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500">
                AI assists extraction; it does not establish the final outcome by itself.
                Extracted events are added as signals pending human verification.
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ExtractField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-16 shrink-0">{label}:</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}
