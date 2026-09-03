import { useState, useEffect } from 'react';
import { PhoneCall, ArrowRight, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/constants';
import type { Trainee, OutreachRecord, OutcomeStateRecord } from '@/types';

interface FollowUpQueueProps {
  onTraineeSelect: (trainee: Trainee) => void;
}

interface QueueItem {
  trainee: Trainee;
  outreach: OutreachRecord;
  outcome: OutcomeStateRecord | null;
}

export function FollowUpQueue({ onTraineeSelect }: FollowUpQueueProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: outreachData } = await supabase
        .from('outreach')
        .select('*')
        .order('sent_at', { ascending: false });

      if (!outreachData || outreachData.length === 0) {
        setLoading(false);
        return;
      }

      const traineeIds = outreachData.map((o) => o.trainee_id);
      const [traineesRes, outcomesRes] = await Promise.all([
        supabase.from('trainees').select('*').in('id', traineeIds),
        supabase
          .from('outcome_states')
          .select('*')
          .in('trainee_id', traineeIds)
          .order('as_of_date', { ascending: false })
          .order('updated_at', { ascending: false }),
      ]);

      const traineeMap: Record<string, Trainee> = {};
      (traineesRes.data ?? []).forEach((t) => (traineeMap[t.id] = t));

      const outcomeMap: Record<string, OutcomeStateRecord> = {};
      (outcomesRes.data ?? []).forEach((o) => {
        if (!outcomeMap[o.trainee_id]) outcomeMap[o.trainee_id] = o;
      });

      const latestOutreachByTrainee: Record<string, OutreachRecord> = {};
      outreachData.forEach((record) => {
        if (!latestOutreachByTrainee[record.trainee_id]) latestOutreachByTrainee[record.trainee_id] = record;
      });

      const queueItems: QueueItem[] = Object.values(latestOutreachByTrainee).map((o) => ({
        trainee: traineeMap[o.trainee_id],
        outreach: o,
        outcome: outcomeMap[o.trainee_id] ?? null,
      })).filter((item) => item.trainee);

      setItems(queueItems);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Follow-up Queue</h1>
        <p className="text-sm text-slate-500 mt-1">
          Latest follow-up state for trainees with pending, missed, or completed outreach · {items.length} records
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Trainee</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">Channel</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Sent</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden sm:table-cell">Due</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">Outcome</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td colSpan={7} className="px-4 py-4">
                    <div className="h-8 rounded bg-slate-50 animate-pulse" />
                  </td>
                </tr>
              ))
            ) : (
              items.map(({ trainee, outreach, outcome }) => (
                <tr
                  key={outreach.id}
                  onClick={() => onTraineeSelect(trainee)}
                  className="border-b border-slate-100 last:border-0 table-row-hover"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-semibold text-xs shrink-0">
                        {trainee.display_name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{trainee.display_name}</p>
                        <p className="text-xs text-slate-500">{trainee.trainee_code} · {trainee.occupation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="flex items-center gap-1.5 text-sm text-slate-600">
                      <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                      {outreach.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatDate(outreach.sent_at)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 hidden sm:table-cell">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {outreach.follow_up_due ? formatDate(outreach.follow_up_due) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={mapOutreachStatus(outreach.status)}
                      kind="evidence"
                    />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {outcome && <StatusBadge status={outcome.state} />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ArrowRight className="w-4 h-4 text-slate-300 inline" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && items.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-slate-400">
            No pending follow-ups in the queue.
          </div>
        )}
      </div>
    </div>
  );
}

function mapOutreachStatus(status: string) {
  if (status === 'no_response') return 'unresolved';
  if (status === 'responded' || status === 'sent') return 'completed';
  return 'verified';
}
