export type PaperStatus =
  | 'Drafting'
  | 'Pre-print'
  | 'Submitted'
  | 'Under Review'
  | 'Accepted';

export interface ResearchPaper {
  id: string; // UUID
  title: string;
  status: PaperStatus;
  user_id: string; // UUID of the author
  updated_at: string; // ISO timestamp
}

export interface ActivityLog {
  id: string;
  paper_id: string;
  user_id: string;
  action: 'CREATED' | 'MOVED' | string;
  from_status?: PaperStatus;
  to_status?: PaperStatus;
  user_name?: string;
  created_at: string;
  paper_title?: string;
}

export type ClaimVerdict = 'Supported' | 'Partially Supported' | 'Unsupported' | 'Inconclusive';

export interface ResearchClaim {
  id: string;
  project_id: string;
  claim_text: string;
  ai_verdict: ClaimVerdict | null;
  confidence_score: number | null; // 0-100
  evidence_summary: string | null;
  attachment_urls: string[] | null;
  attachment_names: string[] | null;
  created_at: string;
}

