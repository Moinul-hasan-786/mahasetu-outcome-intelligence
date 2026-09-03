/*
# MahaSETU — Create core schema and seed data

## Summary
Creates the full relational schema for the MahaSETU outcome-intelligence prototype:
6 tables (trainees, events, evidence_records, outreach, outcome_states, ai_extractions),
enables RLS on all of them with anon+authenticated CRUD (single-tenant, no auth),
and seeds synthetic demo data for 10 trainees including the primary demo trainee
Rahul Sharma (CNC Operator) with his complete timeline, evidence ledger, outreach,
outcome states, and AI extraction. Also seeds edge-case trainees: informal-sector
electrician (formal signal unavailable), contradiction case (employer says employed,
trainee says job ended), and others covering verified/self-employed/apprentice/unresolved.

## Tables
1. trainees — synthetic trainee identity and training metadata
2. events — longitudinal timeline events per trainee
3. evidence_records — evidence ledger entries linked to events
4. outreach — follow-up outreach attempts per trainee
5. outcome_states — current and historical outcome states per trainee
6. ai_extractions — AI-extracted events from messages (pending verification)

## Security
- RLS enabled on all tables.
- All tables allow anon + authenticated full CRUD (single-tenant demo, no auth screen).
- USING (true) is acceptable because all data is intentionally public/shared synthetic demo data.

## Notes
- All names, IDs, and identifiers are fictional. No real personal data.
- UUIDs are hardcoded for seed data so the frontend can reference them reliably.
*/

-- ============================================================
-- 1. TRAINEES
-- ============================================================
CREATE TABLE IF NOT EXISTS trainees (
  id uuid PRIMARY KEY,
  display_name text NOT NULL,
  trainee_code text NOT NULL UNIQUE,
  occupation text,
  course text,
  provider text,
  current_district text,
  training_district text,
  consent_status text DEFAULT 'consented',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trainees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_trainees" ON trainees;
CREATE POLICY "anon_select_trainees" ON trainees FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_trainees" ON trainees;
CREATE POLICY "anon_insert_trainees" ON trainees FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_trainees" ON trainees;
CREATE POLICY "anon_update_trainees" ON trainees FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_trainees" ON trainees;
CREATE POLICY "anon_delete_trainees" ON trainees FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 2. EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id uuid NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_date date NOT NULL,
  source_type text,
  source_label text,
  status text NOT NULL DEFAULT 'verified',
  description text,
  provenance_note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "anon_insert_events" ON events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "anon_update_events" ON events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "anon_delete_events" ON events FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 3. EVIDENCE_RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS evidence_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id uuid NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  evidence_type text NOT NULL,
  source text NOT NULL,
  status text NOT NULL DEFAULT 'verified',
  observed_value text,
  observed_at date,
  provenance text,
  reviewer_state text DEFAULT 'pending'
);

ALTER TABLE evidence_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_evidence_records" ON evidence_records;
CREATE POLICY "anon_select_evidence_records" ON evidence_records FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_evidence_records" ON evidence_records;
CREATE POLICY "anon_insert_evidence_records" ON evidence_records FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_evidence_records" ON evidence_records;
CREATE POLICY "anon_update_evidence_records" ON evidence_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_evidence_records" ON evidence_records;
CREATE POLICY "anon_delete_evidence_records" ON evidence_records FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 4. OUTREACH
-- ============================================================
CREATE TABLE IF NOT EXISTS outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id uuid NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  channel text NOT NULL,
  sent_at date NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  response text,
  follow_up_due date
);

ALTER TABLE outreach ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_outreach" ON outreach;
CREATE POLICY "anon_select_outreach" ON outreach FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_outreach" ON outreach;
CREATE POLICY "anon_insert_outreach" ON outreach FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_outreach" ON outreach;
CREATE POLICY "anon_update_outreach" ON outreach FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_outreach" ON outreach;
CREATE POLICY "anon_delete_outreach" ON outreach FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 5. OUTCOME_STATES
-- ============================================================
CREATE TABLE IF NOT EXISTS outcome_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id uuid NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  state text NOT NULL,
  rationale text,
  as_of_date date NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE outcome_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_outcome_states" ON outcome_states;
CREATE POLICY "anon_select_outcome_states" ON outcome_states FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_outcome_states" ON outcome_states;
CREATE POLICY "anon_insert_outcome_states" ON outcome_states FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_outcome_states" ON outcome_states;
CREATE POLICY "anon_update_outcome_states" ON outcome_states FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_outcome_states" ON outcome_states;
CREATE POLICY "anon_delete_outcome_states" ON outcome_states FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 6. AI_EXTRACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id uuid NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  input_text text NOT NULL,
  extracted_event text,
  extracted_date text,
  extracted_reason text,
  verification_state text DEFAULT 'needs_verification',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_extractions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_ai_extractions" ON ai_extractions;
CREATE POLICY "anon_select_ai_extractions" ON ai_extractions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ai_extractions" ON ai_extractions;
CREATE POLICY "anon_insert_ai_extractions" ON ai_extractions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ai_extractions" ON ai_extractions;
CREATE POLICY "anon_update_ai_extractions" ON ai_extractions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ai_extractions" ON ai_extractions;
CREATE POLICY "anon_delete_ai_extractions" ON ai_extractions FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- SEED DATA — 10 TRAINEES
-- ============================================================

INSERT INTO trainees (id, display_name, trainee_code, occupation, course, provider, current_district, training_district, consent_status) VALUES
('11111111-1111-1111-1111-111111111111', 'Rahul Sharma', 'MS-24-01842', 'CNC Operator', 'CNC Machine Operations', 'Shakti Skill Centre', 'Nagpur', 'Pune', 'consented'),
('22222222-2222-2222-2222-222222222222', 'Priya Patil', 'MS-24-01937', 'Ward Administrator', 'Office Administration', 'Mahila Training Institute', 'Pune', 'Pune', 'consented'),
('33333333-3333-3333-3333-333333333333', 'Amit Deshmukh', 'MS-24-02051', 'Electrician', 'Industrial Electrician', 'Bharat Technical Academy', 'Nashik', 'Nashik', 'consented'),
('44444444-4444-4444-4444-444444444444', 'Sunita Kulkarni', 'MS-24-02188', 'Tailoring Entrepreneur', 'Garment Making & Entrepreneurship', 'Udyog Kendra', 'Aurangabad', 'Aurangabad', 'consented'),
('55555555-5555-5555-5555-555555555555', 'Deepak Jadhav', 'MS-24-02293', 'Welder', 'Welding & Fabrication', 'Shakti Skill Centre', 'Pune', 'Pune', 'consented'),
('66666666-6666-6666-6666-666666666666', 'Kavita More', 'MS-24-02345', 'Data Entry Operator', 'Computer Applications', 'Navjeevan Computer Centre', 'Mumbai', 'Mumbai', 'consented'),
('77777777-7777-7777-7777-777777777777', 'Rohan Nair', 'MS-24-02410', 'Plumber', 'Plumbing & Sanitation', 'Bharat Technical Academy', 'Thane', 'Thane', 'consented'),
('88888888-8888-8888-8888-888888888888', 'Anjali Shinde', 'MS-24-02567', 'Apprentice Fitter', 'Mechanical Fitting', 'Shakti Skill Centre', 'Nagpur', 'Nagpur', 'consented'),
('99999999-9999-9999-9999-999999999999', 'Sanjay Pawar', 'MS-24-02678', 'Mobile Phone Repair', 'Electronics Repair', 'Navjeevan Computer Centre', 'Nagpur', 'Nagpur', 'consented'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Meera Desai', 'MS-24-02789', 'Beautician', 'Beauty & Wellness', 'Udyog Kendra', 'Aurangabad', 'Aurangabad', 'consented')
ON CONFLICT (trainee_code) DO NOTHING;

-- ============================================================
-- RAHUL SHARMA — Events (primary demo trainee)
-- UUIDs: a1000001-a100-a100-a100-a10000000001 through a1000006
-- ============================================================
INSERT INTO events (id, trainee_id, event_type, event_date, source_type, source_label, status, description, provenance_note) VALUES
('a1000001-a100-a100-a100-a10000000001', '11111111-1111-1111-1111-111111111111', 'training_completed', '2025-06-15', 'training_mis', 'Training MIS', 'verified', 'Training completed successfully', 'Training centre record'),
('a1000002-a100-a100-a100-a10000000002', '11111111-1111-1111-1111-111111111111', 'placement_reported', '2025-07-20', 'employer_portal', 'Employer Portal (mock)', 'verified', 'Placement reported by employer', 'Employer-submitted record'),
('a1000003-a100-a100-a100-a10000000003', '11111111-1111-1111-1111-111111111111', 'contact_changed', '2025-09-10', 'trainee_response', 'Trainee Response (mock)', 'changed', 'Phone number changed', 'Self-reported'),
('a1000004-a100-a100-a100-a10000000004', '11111111-1111-1111-1111-111111111111', 'location_changed', '2025-11-05', 'trainee_response', 'Trainee Response (mock)', 'changed', 'District/location changed from Pune to Nagpur', 'Self-reported'),
('a1000005-a100-a100-a100-a10000000005', '11111111-1111-1111-1111-111111111111', 'job_ended', '2026-01-15', 'employment_signal', 'Formal Employment Signal (mock)', 'signal', 'Job ended', 'Administrative signal'),
('a1000006-a100-a100-a100-a10000000006', '11111111-1111-1111-1111-111111111111', 'followup_missed', '2026-03-01', 'outreach_workflow', 'Outreach Workflow', 'unresolved', 'No response to follow-up', 'System outreach log')
ON CONFLICT DO NOTHING;

-- ============================================================
-- RAHUL SHARMA — Evidence Records
-- UUIDs: b1000001-b100-b100-b100-b10000000001 through b1000006
-- ============================================================
INSERT INTO evidence_records (id, trainee_id, event_id, evidence_type, source, status, observed_value, observed_at, provenance, reviewer_state) VALUES
('b1000001-b100-b100-b100-b10000000001', '11111111-1111-1111-1111-111111111111', 'a1000001-a100-a100-a100-a10000000001', 'Training completion', 'Training MIS', 'verified', 'CNC Machine Operations — completed', '2025-06-15', 'Training centre record', 'verified'),
('b1000002-b100-b100-b100-b10000000002', '11111111-1111-1111-1111-111111111111', 'a1000002-a100-a100-a100-a10000000002', 'Placement report', 'Employer Portal (mock)', 'verified', 'CNC Operator at Shakti Manufacturing', '2025-07-20', 'Employer-submitted record', 'verified'),
('b1000003-b100-b100-b100-b10000000003', '11111111-1111-1111-1111-111111111111', 'a1000003-a100-a100-a100-a10000000003', 'Contact update', 'Trainee Response (mock)', 'changed', 'Phone number changed', '2025-09-10', 'Self-reported', 'review'),
('b1000004-b100-b100-b100-b10000000004', '11111111-1111-1111-1111-111111111111', 'a1000004-a100-a100-a100-a10000000004', 'Location update', 'Trainee Response (mock)', 'changed', 'District changed: Pune → Nagpur', '2025-11-05', 'Self-reported', 'review'),
('b1000005-b100-b100-b100-b10000000005', '11111111-1111-1111-1111-111111111111', 'a1000005-a100-a100-a100-a10000000005', 'Employment exit', 'Formal Employment Signal (mock)', 'signal', 'Job ended', '2026-01-15', 'Administrative signal', 'review'),
('b1000006-b100-b100-b100-b10000000006', '11111111-1111-1111-1111-111111111111', 'a1000006-a100-a100-a100-a10000000006', 'Follow-up', 'Outreach Workflow', 'unresolved', 'No response', '2026-03-01', 'System outreach log', 'pending')
ON CONFLICT DO NOTHING;

-- ============================================================
-- RAHUL SHARMA — Outreach
-- ============================================================
INSERT INTO outreach (id, trainee_id, channel, sent_at, status, response, follow_up_due) VALUES
('c1000001-c100-c100-c100-c10000000001', '11111111-1111-1111-1111-111111111111', 'SMS', '2026-03-01', 'no_response', NULL, '2026-03-15')
ON CONFLICT DO NOTHING;

-- ============================================================
-- RAHUL SHARMA — Outcome States
-- ============================================================
INSERT INTO outcome_states (id, trainee_id, state, rationale, as_of_date) VALUES
('d1000001-d100-d100-d100-d10000000001', '11111111-1111-1111-1111-111111111111', 'placed', 'Placement reported by employer via portal', '2025-07-20'),
('d1000002-d100-d100-d100-d10000000002', '11111111-1111-1111-1111-111111111111', 'review_required', 'Current livelihood status cannot be established from available evidence. Historical placement exists but contact/location drift, exit signal, and unresolved follow-up require action.', '2026-03-01')
ON CONFLICT DO NOTHING;

-- ============================================================
-- RAHUL SHARMA — AI Extraction
-- ============================================================
INSERT INTO ai_extractions (id, trainee_id, input_text, extracted_event, extracted_date, extracted_reason, verification_state) VALUES
('e1000001-e100-e100-e100-e10000000001', '11111111-1111-1111-1111-111111111111', 'Rahul left the job in January after his shift changed.', 'Job Exit', 'January 2026', 'Shift Change', 'needs_verification')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PRIYA PATIL — Verified Employed
-- ============================================================
INSERT INTO events (trainee_id, event_type, event_date, source_type, source_label, status, description, provenance_note) VALUES
('22222222-2222-2222-2222-222222222222', 'training_completed', '2025-05-10', 'training_mis', 'Training MIS', 'verified', 'Training completed', 'Training centre record'),
('22222222-2222-2222-2222-222222222222', 'placement_reported', '2025-06-15', 'employer_portal', 'Employer Portal (mock)', 'verified', 'Placement reported', 'Employer-submitted record'),
('22222222-2222-2222-2222-222222222222', 'employment_verified', '2026-02-01', 'employer_confirmation', 'Employer Confirmation (mock)', 'verified', 'Employment confirmed by employer', 'Employer-verified record')
ON CONFLICT DO NOTHING;

INSERT INTO evidence_records (trainee_id, event_id, evidence_type, source, status, observed_value, observed_at, provenance, reviewer_state) VALUES
('22222222-2222-2222-2222-222222222222', NULL, 'Training completion', 'Training MIS', 'verified', 'Office Administration — completed', '2025-05-10', 'Training centre record', 'verified'),
('22222222-2222-2222-2222-222222222222', NULL, 'Placement report', 'Employer Portal (mock)', 'verified', 'Ward Administrator at Pune Municipal Corp', '2025-06-15', 'Employer-submitted record', 'verified'),
('22222222-2222-2222-2222-222222222222', NULL, 'Employment confirmation', 'Employer Confirmation (mock)', 'verified', 'Still employed as of Feb 2026', '2026-02-01', 'Employer-verified record', 'verified')
ON CONFLICT DO NOTHING;

INSERT INTO outcome_states (trainee_id, state, rationale, as_of_date) VALUES
('22222222-2222-2222-2222-222222222222', 'verified', 'Employment confirmed by employer verification in Feb 2026', '2026-02-01')
ON CONFLICT DO NOTHING;

-- ============================================================
-- AMIT DESHMUKH — Informal-sector Electrician
-- ============================================================
INSERT INTO events (trainee_id, event_type, event_date, source_type, source_label, status, description, provenance_note) VALUES
('33333333-3333-3333-3333-333333333333', 'training_completed', '2025-04-20', 'training_mis', 'Training MIS', 'verified', 'Training completed', 'Training centre record'),
('33333333-3333-3333-3333-333333333333', 'self_employment', '2025-07-01', 'trainee_response', 'Trainee Response (mock)', 'verified', 'Active self-employment in small workshop', 'Self-reported and verified via field visit'),
('33333333-3333-3333-3333-333333333333', 'no_formal_signal', '2026-01-01', 'employment_signal', 'Formal Employment Signal (mock)', 'unresolved', 'No formal payroll signal available', 'Administrative signal — no EPFO/e-Shram match')
ON CONFLICT DO NOTHING;

INSERT INTO evidence_records (trainee_id, event_id, evidence_type, source, status, observed_value, observed_at, provenance, reviewer_state) VALUES
('33333333-3333-3333-3333-333333333333', NULL, 'Training completion', 'Training MIS', 'verified', 'Industrial Electrician — completed', '2025-04-20', 'Training centre record', 'verified'),
('33333333-3333-3333-3333-333333333333', NULL, 'Self-employment confirmation', 'Trainee Response (mock)', 'verified', 'Active work at small workshop in Nashik', '2025-07-01', 'Self-reported, field-verified', 'verified'),
('33333333-3333-3333-3333-333333333333', NULL, 'Formal payroll signal', 'Formal Employment Signal (mock)', 'unresolved', 'Formal signal unavailable', '2026-01-01', 'No EPFO/e-Shram match found', 'pending')
ON CONFLICT DO NOTHING;

INSERT INTO outcome_states (trainee_id, state, rationale, as_of_date) VALUES
('33333333-3333-3333-3333-333333333333', 'verified', 'Trainee confirmed active self-employment in small workshop. Formal payroll signal unavailable but livelihood outcome is established via field verification.', '2025-07-01')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SUNITA KULKARNI — Tailoring Entrepreneur (Self-employed)
-- ============================================================
INSERT INTO events (trainee_id, event_type, event_date, source_type, source_label, status, description, provenance_note) VALUES
('44444444-4444-4444-4444-444444444444', 'training_completed', '2025-03-15', 'training_mis', 'Training MIS', 'verified', 'Training completed', 'Training centre record'),
('44444444-4444-4444-4444-444444444444', 'self_employment', '2025-06-01', 'trainee_response', 'Trainee Response (mock)', 'verified', 'Started own tailoring unit', 'Self-reported')
ON CONFLICT DO NOTHING;

INSERT INTO evidence_records (trainee_id, event_id, evidence_type, source, status, observed_value, observed_at, provenance, reviewer_state) VALUES
('44444444-4444-4444-4444-444444444444', NULL, 'Training completion', 'Training MIS', 'verified', 'Garment Making — completed', '2025-03-15', 'Training centre record', 'verified'),
('44444444-4444-4444-4444-444444444444', NULL, 'Self-employment evidence', 'Trainee Response (mock)', 'verified', 'Own tailoring unit in Aurangabad', '2025-06-01', 'Self-reported', 'verified')
ON CONFLICT DO NOTHING;

INSERT INTO outcome_states (trainee_id, state, rationale, as_of_date) VALUES
('44444444-4444-4444-4444-444444444444', 'verified', 'Self-employment as tailoring entrepreneur confirmed', '2025-06-01')
ON CONFLICT DO NOTHING;

-- ============================================================
-- DEEPAK JADHAV — Job Ended
-- ============================================================
INSERT INTO events (trainee_id, event_type, event_date, source_type, source_label, status, description, provenance_note) VALUES
('55555555-5555-5555-5555-555555555555', 'training_completed', '2025-05-20', 'training_mis', 'Training MIS', 'verified', 'Training completed', 'Training centre record'),
('55555555-5555-5555-5555-555555555555', 'placement_reported', '2025-07-01', 'employer_portal', 'Employer Portal (mock)', 'verified', 'Placement reported', 'Employer-submitted record'),
('55555555-5555-5555-5555-555555555555', 'job_ended', '2025-12-15', 'employment_signal', 'Formal Employment Signal (mock)', 'verified', 'Job ended — confirmed', 'Administrative signal — EPFO exit')
ON CONFLICT DO NOTHING;

INSERT INTO evidence_records (trainee_id, event_id, evidence_type, source, status, observed_value, observed_at, provenance, reviewer_state) VALUES
('55555555-5555-5555-5555-555555555555', NULL, 'Training completion', 'Training MIS', 'verified', 'Welding & Fabrication — completed', '2025-05-20', 'Training centre record', 'verified'),
('55555555-5555-5555-5555-555555555555', NULL, 'Placement report', 'Employer Portal (mock)', 'verified', 'Welder at Pune Steel Works', '2025-07-01', 'Employer-submitted record', 'verified'),
('55555555-5555-5555-5555-555555555555', NULL, 'Employment exit', 'Formal Employment Signal (mock)', 'verified', 'Job ended — EPFO exit confirmed', '2025-12-15', 'Administrative signal', 'verified')
ON CONFLICT DO NOTHING;

INSERT INTO outcome_states (trainee_id, state, rationale, as_of_date) VALUES
('55555555-5555-5555-5555-555555555555', 'verified', 'Job ended confirmed via EPFO exit signal. Currently unemployed.', '2025-12-15')
ON CONFLICT DO NOTHING;

-- ============================================================
-- KAVITA MORE — Unresolved
-- ============================================================
INSERT INTO events (trainee_id, event_type, event_date, source_type, source_label, status, description, provenance_note) VALUES
('66666666-6666-6666-6666-666666666666', 'training_completed', '2025-06-01', 'training_mis', 'Training MIS', 'verified', 'Training completed', 'Training centre record'),
('66666666-6666-6666-6666-666666666666', 'placement_reported', '2025-07-15', 'employer_portal', 'Employer Portal (mock)', 'verified', 'Placement reported', 'Employer-submitted record'),
('66666666-6666-6666-6666-666666666666', 'followup_missed', '2026-02-01', 'outreach_workflow', 'Outreach Workflow', 'unresolved', 'No response to follow-up', 'System outreach log')
ON CONFLICT DO NOTHING;

INSERT INTO evidence_records (trainee_id, event_id, evidence_type, source, status, observed_value, observed_at, provenance, reviewer_state) VALUES
('66666666-6666-6666-6666-666666666666', NULL, 'Training completion', 'Training MIS', 'verified', 'Computer Applications — completed', '2025-06-01', 'Training centre record', 'verified'),
('66666666-6666-6666-6666-666666666666', NULL, 'Placement report', 'Employer Portal (mock)', 'verified', 'Data Entry Operator at Mumbai Corp', '2025-07-15', 'Employer-submitted record', 'verified'),
('66666666-6666-6666-6666-666666666666', NULL, 'Follow-up', 'Outreach Workflow', 'unresolved', 'No response', '2026-02-01', 'System outreach log', 'pending')
ON CONFLICT DO NOTHING;

INSERT INTO outreach (trainee_id, channel, sent_at, status, response, follow_up_due) VALUES
('66666666-6666-6666-6666-666666666666', 'SMS', '2026-02-01', 'no_response', NULL, '2026-02-15')
ON CONFLICT DO NOTHING;

INSERT INTO outcome_states (trainee_id, state, rationale, as_of_date) VALUES
('66666666-6666-6666-6666-666666666666', 'undetermined', 'Insufficient evidence to determine current livelihood status. No response to follow-up.', '2026-02-01')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROHAN NAIR — Contradiction Case (employer says employed, trainee says job ended)
-- ============================================================
INSERT INTO events (trainee_id, event_type, event_date, source_type, source_label, status, description, provenance_note) VALUES
('77777777-7777-7777-7777-777777777777', 'training_completed', '2025-04-10', 'training_mis', 'Training MIS', 'verified', 'Training completed', 'Training centre record'),
('77777777-7777-7777-7777-777777777777', 'placement_reported', '2025-06-01', 'employer_portal', 'Employer Portal (mock)', 'verified', 'Placement reported', 'Employer-submitted record'),
('77777777-7777-7777-7777-777777777777', 'employer_says_employed', '2026-01-20', 'employer_confirmation', 'Employer Confirmation (mock)', 'conflict', 'Employer reports still employed', 'Employer-confirmed record'),
('77777777-7777-7777-7777-777777777777', 'trainee_says_ended', '2026-01-25', 'trainee_response', 'Trainee Response (mock)', 'conflict', 'Trainee reports job ended', 'Self-reported')
ON CONFLICT DO NOTHING;

INSERT INTO evidence_records (trainee_id, event_id, evidence_type, source, status, observed_value, observed_at, provenance, reviewer_state) VALUES
('77777777-7777-7777-7777-777777777777', NULL, 'Training completion', 'Training MIS', 'verified', 'Plumbing & Sanitation — completed', '2025-04-10', 'Training centre record', 'verified'),
('77777777-7777-7777-7777-777777777777', NULL, 'Placement report', 'Employer Portal (mock)', 'verified', 'Plumber at Thane Contractors', '2025-06-01', 'Employer-submitted record', 'verified'),
('77777777-7777-7777-7777-777777777777', NULL, 'Employer confirmation', 'Employer Confirmation (mock)', 'conflict', 'Employer reports still employed', '2026-01-20', 'Employer-confirmed record', 'review'),
('77777777-7777-7777-7777-777777777777', NULL, 'Trainee response', 'Trainee Response (mock)', 'conflict', 'Trainee reports job ended in Jan 2026', '2026-01-25', 'Self-reported', 'review')
ON CONFLICT DO NOTHING;

INSERT INTO outcome_states (trainee_id, state, rationale, as_of_date) VALUES
('77777777-7777-7777-7777-777777777777', 'review_required', 'CONFLICT: Employer reports employed but trainee reports job ended. Both signals preserved. Requires manual resolution.', '2026-01-25')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ANJALI SHINDE — Apprentice
-- ============================================================
INSERT INTO events (trainee_id, event_type, event_date, source_type, source_label, status, description, provenance_note) VALUES
('88888888-8888-8888-8888-888888888888', 'training_completed', '2025-07-01', 'training_mis', 'Training MIS', 'verified', 'Training completed', 'Training centre record'),
('88888888-8888-8888-8888-888888888888', 'apprenticeship_started', '2025-08-15', 'employer_portal', 'Employer Portal (mock)', 'verified', 'Apprenticeship started', 'Employer-submitted record')
ON CONFLICT DO NOTHING;

INSERT INTO evidence_records (trainee_id, event_id, evidence_type, source, status, observed_value, observed_at, provenance, reviewer_state) VALUES
('88888888-8888-8888-8888-888888888888', NULL, 'Training completion', 'Training MIS', 'verified', 'Mechanical Fitting — completed', '2025-07-01', 'Training centre record', 'verified'),
('88888888-8888-8888-8888-888888888888', NULL, 'Apprenticeship evidence', 'Employer Portal (mock)', 'verified', 'Apprentice Fitter at Nagpur Industries', '2025-08-15', 'Employer-submitted record', 'verified')
ON CONFLICT DO NOTHING;

INSERT INTO outcome_states (trainee_id, state, rationale, as_of_date) VALUES
('88888888-8888-8888-8888-888888888888', 'verified', 'Apprenticeship confirmed and ongoing', '2025-08-15')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SANJAY PAWAR — Review Required (different case)
-- ============================================================
INSERT INTO events (trainee_id, event_type, event_date, source_type, source_label, status, description, provenance_note) VALUES
('99999999-9999-9999-9999-999999999999', 'training_completed', '2025-05-05', 'training_mis', 'Training MIS', 'verified', 'Training completed', 'Training centre record'),
('99999999-9999-9999-9999-999999999999', 'placement_reported', '2025-07-10', 'employer_portal', 'Employer Portal (mock)', 'verified', 'Placement reported', 'Employer-submitted record'),
('99999999-9999-9999-9999-999999999999', 'contact_changed', '2025-10-01', 'trainee_response', 'Trainee Response (mock)', 'changed', 'Phone number changed', 'Self-reported'),
('99999999-9999-9999-9999-999999999999', 'followup_missed', '2026-02-15', 'outreach_workflow', 'Outreach Workflow', 'unresolved', 'No response to follow-up', 'System outreach log')
ON CONFLICT DO NOTHING;

INSERT INTO evidence_records (trainee_id, event_id, evidence_type, source, status, observed_value, observed_at, provenance, reviewer_state) VALUES
('99999999-9999-9999-9999-999999999999', NULL, 'Training completion', 'Training MIS', 'verified', 'Electronics Repair — completed', '2025-05-05', 'Training centre record', 'verified'),
('99999999-9999-9999-9999-999999999999', NULL, 'Placement report', 'Employer Portal (mock)', 'verified', 'Mobile Repair at Nagpur Mobile Hub', '2025-07-10', 'Employer-submitted record', 'verified'),
('99999999-9999-9999-9999-999999999999', NULL, 'Contact update', 'Trainee Response (mock)', 'changed', 'Phone number changed', '2025-10-01', 'Self-reported', 'review'),
('99999999-9999-9999-9999-999999999999', NULL, 'Follow-up', 'Outreach Workflow', 'unresolved', 'No response', '2026-02-15', 'System outreach log', 'pending')
ON CONFLICT DO NOTHING;

INSERT INTO outreach (trainee_id, channel, sent_at, status, response, follow_up_due) VALUES
('99999999-9999-9999-9999-999999999999', 'Call', '2026-02-15', 'no_response', NULL, '2026-03-01')
ON CONFLICT DO NOTHING;

INSERT INTO outcome_states (trainee_id, state, rationale, as_of_date) VALUES
('99999999-9999-9999-9999-999999999999', 'review_required', 'Contact changed and follow-up missed. Current status unclear.', '2026-02-15')
ON CONFLICT DO NOTHING;

-- ============================================================
-- MEERA DESAI — Verified Employed
-- ============================================================
INSERT INTO events (trainee_id, event_type, event_date, source_type, source_label, status, description, provenance_note) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'training_completed', '2025-03-01', 'training_mis', 'Training MIS', 'verified', 'Training completed', 'Training centre record'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'placement_reported', '2025-04-15', 'employer_portal', 'Employer Portal (mock)', 'verified', 'Placement reported', 'Employer-submitted record'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'employment_verified', '2026-01-10', 'employer_confirmation', 'Employer Confirmation (mock)', 'verified', 'Employment confirmed', 'Employer-verified record')
ON CONFLICT DO NOTHING;

INSERT INTO evidence_records (trainee_id, event_id, evidence_type, source, status, observed_value, observed_at, provenance, reviewer_state) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 'Training completion', 'Training MIS', 'verified', 'Beauty & Wellness — completed', '2025-03-01', 'Training centre record', 'verified'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 'Placement report', 'Employer Portal (mock)', 'verified', 'Beautician at Aurangabad Salon', '2025-04-15', 'Employer-submitted record', 'verified'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 'Employment confirmation', 'Employer Confirmation (mock)', 'verified', 'Still employed as of Jan 2026', '2026-01-10', 'Employer-verified record', 'verified')
ON CONFLICT DO NOTHING;

INSERT INTO outcome_states (trainee_id, state, rationale, as_of_date) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'verified', 'Employment confirmed by employer verification in Jan 2026', '2026-01-10')
ON CONFLICT DO NOTHING;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_events_trainee_id ON events(trainee_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_evidence_trainee_id ON evidence_records(trainee_id);
CREATE INDEX IF NOT EXISTS idx_outcome_trainee_id ON outcome_states(trainee_id);
CREATE INDEX IF NOT EXISTS idx_outreach_trainee_id ON outreach(trainee_id);
CREATE INDEX IF NOT EXISTS idx_ai_trainee_id ON ai_extractions(trainee_id);
