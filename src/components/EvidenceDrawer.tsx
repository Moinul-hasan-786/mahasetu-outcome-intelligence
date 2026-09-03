import { X, FileText, Building2, Calendar, Shield, User } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/constants';
import type { EvidenceRecord } from '@/types';

interface EvidenceDrawerProps {
  evidence: EvidenceRecord;
  onClose: () => void;
}

export function EvidenceDrawer({ evidence, onClose }: EvidenceDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-navy-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl animate-slide-in-right overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-navy-600" />
            <h2 className="text-base font-semibold text-navy-800">Evidence Detail</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          {/* Type + status */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-800">{evidence.evidence_type}</h3>
              <StatusBadge status={evidence.status} kind="evidence" size="md" />
            </div>
            <p className="text-sm text-slate-600">{evidence.observed_value}</p>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <DetailRow icon={Building2} label="Source" value={evidence.source} />
            <DetailRow icon={Calendar} label="Observed Date" value={formatDate(evidence.observed_at)} />
            <DetailRow icon={Shield} label="Provenance" value={evidence.provenance ?? '—'} />
            <DetailRow icon={User} label="Reviewer State" value={
              <span className="capitalize">{evidence.reviewer_state ?? 'pending'}</span>
            } />
          </div>

          {/* Provenance notes */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 mb-1.5">PROVENANCE NOTES</p>
            <p className="text-sm text-slate-600">
              {evidence.provenance ?? 'No provenance information recorded.'}
            </p>
          </div>

          {/* Reviewer state */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs font-semibold text-blue-600 mb-1.5">REVIEWER STATE</p>
            <p className="text-sm text-blue-700 capitalize">
              {evidence.reviewer_state ?? 'pending'}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              This evidence has not been independently verified by a human reviewer yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-700 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
