import { useState } from 'react';
import { Sidebar, type PageId } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { Overview } from '@/pages/Overview';
import { TraineeList } from '@/pages/TraineeList';
import { TraineeProfile } from '@/pages/TraineeProfile';
import { Outcomes } from '@/pages/Outcomes';
import { FollowUpQueue } from '@/pages/FollowUpQueue';
import { supabase } from '@/lib/supabase';
import type { Trainee } from '@/types';

function App() {
  const [page, setPage] = useState<PageId>('overview');
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [demoVersion, setDemoVersion] = useState(0);

  const handleDemoReset = async () => {
    const rahulId = '11111111-1111-1111-1111-111111111111';
    const generatedEvidenceTypes = [
      'Follow-up',
      'Current employment response',
      'Employer confirmation request',
      'Current employment confirmation',
      'Employer confirmation',
      'AI-Extracted Event',
    ];
    const generatedEventTypes = [
      'followup_completed',
      'current_employment_response',
      'employer_confirmation_requested',
      'current_employment_confirmed',
    ];

    const results = await Promise.all([
      supabase
        .from('evidence_records')
        .delete()
        .eq('trainee_id', rahulId)
        .eq('observed_at', '2026-09-03')
        .in('evidence_type', generatedEvidenceTypes),
      supabase.from('evidence_records').delete().eq('trainee_id', rahulId).eq('evidence_type', 'AI-Extracted Event'),
      supabase.from('events').delete().eq('trainee_id', rahulId).in('event_type', generatedEventTypes),
      supabase.from('events').delete().eq('trainee_id', rahulId).eq('source_label', 'AI Evidence Assistant'),
      supabase.from('outreach').delete().eq('trainee_id', rahulId).eq('sent_at', '2026-09-03'),
      supabase.from('outcome_states').delete().eq('trainee_id', rahulId).eq('as_of_date', '2026-09-03'),
    ]);

    const failure = results.find((result) => result.error)?.error;
    if (failure) throw failure;

    const baselineResults = await Promise.all([
      supabase.from('evidence_records').upsert({
        id: 'b1000006-b100-b100-b100-b10000000006',
        trainee_id: rahulId,
        event_id: 'a1000006-a100-a100-a100-a10000000006',
        evidence_type: 'Follow-up',
        source: 'Outreach Workflow',
        status: 'unresolved',
        observed_value: 'No response',
        observed_at: '2026-03-01',
        provenance: 'System outreach log',
        reviewer_state: 'pending',
      }),
      supabase.from('outreach').upsert({
        id: 'c1000001-c100-c100-c100-c10000000001',
        trainee_id: rahulId,
        channel: 'SMS',
        sent_at: '2026-03-01',
        status: 'no_response',
        response: null,
        follow_up_due: '2026-03-15',
      }),
      supabase.from('outcome_states').upsert({
        id: 'd1000002-d100-d100-d100-d10000000002',
        trainee_id: rahulId,
        state: 'review_required',
        rationale: 'Current livelihood status cannot be established from available evidence. Historical placement exists but contact/location drift, exit signal, and unresolved follow-up require action.',
        as_of_date: '2026-03-01',
      }),
      supabase
        .from('ai_extractions')
        .update({ verification_state: 'needs_verification' })
        .eq('trainee_id', rahulId),
    ]);

    const baselineFailure = baselineResults.find((result) => result.error)?.error;
    if (baselineFailure) throw baselineFailure;
    setDemoVersion((version) => version + 1);
  };

  const handleTraineeSelect = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
  };

  const handleBack = () => {
    setSelectedTrainee(null);
  };

  const handleNavigate = (p: string) => {
    setSelectedTrainee(null);
    setPage(p as PageId);
  };

  const renderPage = () => {
    if (selectedTrainee) {
      return <TraineeProfile trainee={selectedTrainee} onBack={handleBack} />;
    }

    switch (page) {
      case 'overview':
        return <Overview onTraineeSelect={handleTraineeSelect} onNavigate={handleNavigate} />;
      case 'trainees':
        return <TraineeList onTraineeSelect={handleTraineeSelect} />;
      case 'outcomes':
        return <Outcomes onTraineeSelect={handleTraineeSelect} />;
      case 'followup':
        return <FollowUpQueue onTraineeSelect={handleTraineeSelect} />;
      case 'evidence':
        return <TraineeList onTraineeSelect={handleTraineeSelect} />;
      default:
        return <Overview onTraineeSelect={handleTraineeSelect} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentPage={page} onNavigate={handleNavigate} onDemoReset={handleDemoReset} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onTraineeSelect={handleTraineeSelect} />
        <main key={demoVersion} className="flex-1 overflow-y-auto">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;
