export interface Person {
  id: string;
  name: string;
  role: string;
  org_path: string;
  location: string;
  seniority_level: 'IC1' | 'IC2' | 'IC3' | 'IC4' | 'IC5' | 'IC6' | 'M1' | 'M2' | 'D1' | 'VP';
  years_experience: number;
  domain_strength: Record<string, number>; // "privacy": 0.9
  risk_tolerance: 'low' | 'med' | 'high';
  decision_style: 'fast' | 'balanced' | 'conservative';
  past_decisions_count: number;
  latency_profile_ms: number;
  current_load: number;
  avatar_url?: string;
}

export interface Edge {
  source: string;
  target: string;
  type: 'project' | 'risk' | 'budget';
  weight: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  tags: string[];
  urgency: 'low' | 'medium' | 'high';
  cost_bucket: '0' | '<5m' | '<50m' | '>50m';
  scope: 'internal' | 'customer';
  created_at: string;
  status: 'open' | 'analyzing' | 'decided';
}

export interface RoutingResult {
  issue_id: string;
  candidates: Candidate[];
  decision_set: Candidate[];
}

export interface Candidate extends Person {
  score: number;
  score_breakdown: {
    participation: number;
    domain: number;
    tree: number;
    load: number;
  };
  reason: string;
}

export interface DecisionCard {
  id: string;
  issue_id: string;
  summary: string;
  options: string[];
  recommendation: string;
  conditions: string[];
  risks: string[];
  participants: Candidate[];
  owner: Person;
  status: 'draft' | 'approved' | 'rejected' | 'conditional';
  logs: DecisionLog[];
}

export interface DecisionLog {
  id: string;
  actor_id: string;
  action: string;
  comment: string;
  timestamp: string;
}
