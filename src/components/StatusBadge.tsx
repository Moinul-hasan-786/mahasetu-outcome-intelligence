import { STATE_META, EVIDENCE_META } from '@/lib/constants';

interface StatusBadgeProps {
  status: string;
  kind?: 'state' | 'evidence';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, kind = 'state', size = 'sm' }: StatusBadgeProps) {
  const meta = kind === 'state' ? STATE_META[status] : EVIDENCE_META[status];

  if (!meta) {
    return (
      <span className="status-badge bg-slate-100 text-slate-600 border-slate-300">
        {status}
      </span>
    );
  }

  if (kind === 'state') {
    const Icon = (STATE_META[status] ?? STATE_META.verified).icon;
    return (
      <span
        className={`status-badge ${meta.bg} ${meta.color} ${meta.border} ${
          size === 'md' ? 'px-3 py-1.5 text-sm' : ''
        }`}
      >
        <Icon className={size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        {meta.label}
      </span>
    );
  }

  return (
    <span
      className={`status-badge ${meta.bg} ${meta.color} ${meta.border} ${
        size === 'md' ? 'px-3 py-1.5 text-sm' : ''
      }`}
    >
      {meta.label}
    </span>
  );
}
