import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  AlertOctagon,
  Radio,
  type LucideIcon,
} from 'lucide-react';

export const DASHBOARD_METRICS = {
  total_tracked: 12480,
  verified: 8942,
  review_required: 2118,
  undetermined: 1420,
};

export const DEMO_CURRENT_DATE = '2026-09-03';

export const OUTCOME_DIST: { label: string; value: number; color: string }[] = [
  { label: 'Verified', value: 8942, color: '#0d7d4e' },
  { label: 'Review Required', value: 2118, color: '#b8740a' },
  { label: 'Undetermined', value: 1420, color: '#6b7280' },
];

export const DISTRICT_DATA = [
  { district: 'Pune', reviewRate: 18, undeterminedRate: 12, followUpCompletion: 76 },
  { district: 'Nagpur', reviewRate: 24, undeterminedRate: 15, followUpCompletion: 68 },
  { district: 'Mumbai', reviewRate: 14, undeterminedRate: 8, followUpCompletion: 82 },
  { district: 'Aurangabad', reviewRate: 16, undeterminedRate: 10, followUpCompletion: 79 },
  { district: 'Nashik', reviewRate: 20, undeterminedRate: 13, followUpCompletion: 71 },
  { district: 'Thane', reviewRate: 22, undeterminedRate: 11, followUpCompletion: 74 },
];

export const PROVIDER_DATA = [
  { provider: 'Shakti Skill Centre', cohort: 3200, reported: 2480, verified: 2180, reviewRate: 19 },
  { provider: 'Bharat Technical Academy', cohort: 2800, reported: 2100, verified: 1850, reviewRate: 17 },
  { provider: 'Udyog Kendra', cohort: 2400, reported: 1920, verified: 1640, reviewRate: 15 },
  { provider: 'Mahila Training Institute', cohort: 2100, reported: 1680, verified: 1520, reviewRate: 12 },
  { provider: 'Navjeevan Computer Centre', cohort: 1980, reported: 1480, verified: 1200, reviewRate: 21 },
];

export const STATE_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: LucideIcon }
> = {
  verified: {
    label: 'Verified',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  placed: {
    label: 'Placed (Historical)',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  review_required: {
    label: 'Review Required',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertTriangle,
  },
  undetermined: {
    label: 'Undetermined',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    icon: HelpCircle,
  },
  conflict: {
    label: 'Conflict',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertOctagon,
  },
};

export const EVIDENCE_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: LucideIcon }
> = {
  verified: {
    label: 'Verified',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  changed: {
    label: 'Changed',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertTriangle,
  },
  signal: {
    label: 'Signal',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Radio,
  },
  new_signal: {
    label: 'New Signal',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Radio,
  },
  completed: {
    label: 'Completed',
    color: 'text-navy-700',
    bg: 'bg-navy-50',
    border: 'border-navy-200',
    icon: CheckCircle2,
  },
  unresolved: {
    label: 'Unresolved',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    icon: HelpCircle,
  },
  conflict: {
    label: 'Conflict',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertOctagon,
  },
};

export function stateLabel(state: string): string {
  return STATE_META[state]?.label ?? state;
}

export function evidenceLabel(status: string): string {
  return EVIDENCE_META[status]?.label ?? status;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMonthYear(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

export function getOverviewMetrics(rahulVerified: boolean) {
  if (!rahulVerified) return DASHBOARD_METRICS;

  return {
    ...DASHBOARD_METRICS,
    verified: DASHBOARD_METRICS.verified + 1,
    review_required: DASHBOARD_METRICS.review_required - 1,
  };
}

export function getOverviewDistribution(rahulVerified: boolean) {
  const metrics = getOverviewMetrics(rahulVerified);
  return [
    { label: 'Verified', value: metrics.verified, color: '#0d7d4e' },
    { label: 'Review Required', value: metrics.review_required, color: '#b8740a' },
    { label: 'Undetermined', value: metrics.undetermined, color: '#6b7280' },
  ];
}
