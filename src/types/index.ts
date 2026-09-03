export type OutcomeState = 'verified' | 'review_required' | 'undetermined' | 'placed';

export type EvidenceStatus =
  | 'verified'
  | 'changed'
  | 'signal'
  | 'new_signal'
  | 'completed'
  | 'unresolved'
  | 'conflict';

export type ReviewerState = 'verified' | 'review' | 'pending';

export interface Trainee {
  id: string;
  display_name: string;
  trainee_code: string;
  occupation: string | null;
  course: string | null;
  provider: string | null;
  current_district: string | null;
  training_district: string | null;
  consent_status: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  trainee_id: string;
  event_type: string;
  event_date: string;
  source_type: string | null;
  source_label: string | null;
  status: string;
  description: string | null;
  provenance_note: string | null;
  created_at: string;
}

export interface EvidenceRecord {
  id: string;
  trainee_id: string;
  event_id: string | null;
  evidence_type: string;
  source: string;
  status: string;
  observed_value: string | null;
  observed_at: string | null;
  provenance: string | null;
  reviewer_state: string | null;
}

export interface OutreachRecord {
  id: string;
  trainee_id: string;
  channel: string;
  sent_at: string;
  status: string;
  response: string | null;
  follow_up_due: string | null;
}

export interface OutcomeStateRecord {
  id: string;
  trainee_id: string;
  state: string;
  rationale: string | null;
  as_of_date: string;
  updated_at: string;
}

export interface AiExtraction {
  id: string;
  trainee_id: string;
  input_text: string;
  extracted_event: string | null;
  extracted_date: string | null;
  extracted_reason: string | null;
  verification_state: string;
  created_at: string;
}

export interface TraineeWithLatest extends Trainee {
  latest_outcome?: OutcomeStateRecord;
  evidence_count?: number;
  event_count?: number;
}
