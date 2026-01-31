export type ApiIssueCreateRequest = {
  text: string;
  title?: string | null;
  tags?: string[];
  urgency?: string | null;
  cost_impact?: 'NONE' | 'LOW' | 'MID' | 'HIGH' | null;
  impact_scope?: 'INDIVIDUAL' | 'TEAM' | 'DEPARTMENT' | 'COMPANY' | 'EXTERNAL' | null;
  budget_estimate?: number | null;
  timeline_days?: number | null;
  rollback_possible?: boolean | null;
  submitter_id?: string | null;
};

export type ApiIssueCreateResponse = {
  issue_id: string;
  run_id: string;
  status?: string;
};

export type ApiPersonResponse = {
  id: string;
  name: string;
  email?: string | null;
  role?: string;
  team?: string | null;
  department?: string | null;
  expertise?: string | null;
};

export type ApiIssueResponse = {
  id: string;
  title?: string | null;
  text: string;
  tags?: string[];
  urgency?: string | null;
  cost_impact?: string | null;
  impact_scope?: string | null;
  status: string;
  risk_tier?: string | null;
  budget_estimate?: number | null;
  timeline_days?: number | null;
  rollback_possible?: boolean | null;
  submitter_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiGraphNode = {
  id: string;
  type?: string;
  name: string;
  properties?: Record<string, unknown>;
};

export type ApiGraphEdge = {
  source: string;
  target: string;
  type?: string;
  properties?: Record<string, unknown>;
};

export type RoutingCandidate = {
  id: string;
  name: string;
  role?: string;
  level?: string;
  team?: string;
  department?: string;
  org_path?: string;
  score?: number;
  match_score?: number;
  reason?: string;
  source?: 'graph' | 'vector' | 'owner' | 'meeting' | 'reference';
};

export type DecisionCardStreamData = {
  action: 'APPROVE' | 'REJECT' | 'DEFER';
  summary: string;
  execution_path: 'AUTO_APPROVE' | 'SOFT_GATE' | 'HARD_GATE';
  risk_tier: 'LOW' | 'MID' | 'HIGH';
  budget_estimate?: number | null;
  timeline_days?: number | null;
  rollback_conditions?: string | null;
  next_steps?: string[] | null;
};

export type DecisionCardAssigned = {
  card_id?: string;
  owner_id?: string;
  owner_name?: string;
  co_reviewer_ids?: string[];
  approval_status?: string;
};

export type MeetingParticipant = {
  id?: string;
  person_id?: string;
  name: string;
  role: string;
  perspective?: string;
};

export type MeetingInput = {
  notes?: string | null;
  utterances: Array<{
    turn: number;
    speaker_role: string;
    text: string;
    perspective?: string | null;
    speaker_id?: string | null;
    speaker_name?: string | null;
  }>;
  replace_existing?: boolean;
};

export type AuditLogResponse = {
  id: string;
  event_type: string;
  event_timestamp: string;
  resource_type?: string;
  resource_id?: string;
  actor_id?: string | null;
  actor_type?: string | null;
  detail?: Record<string, unknown> | null;
  run_id?: string | null;
  issue_id?: string | null;
  card_id?: string | null;
};

export type VirtualMeetingRequest = {
  issue_id: string;
  participants: Array<{
    name: string;
    role: string;
    persona_description: string;
  }>;
  meeting_config?: {
    target_turns?: number;
    tone?: string;
    conflict_level?: string;
  };
};
