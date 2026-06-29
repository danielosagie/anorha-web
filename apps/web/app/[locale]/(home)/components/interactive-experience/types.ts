export type DemoStage = 'analyze' | 'match' | 'generate';

export type DemoMode = 'scripted' | 'live' | 'hybrid';

export type DemoEventType =
  | 'info'
  | 'stage_update'
  | 'candidate_update'
  | 'success'
  | 'warning'
  | 'error';

export type DemoCandidate = {
  id: string;
  title: string;
  confidence: 'low' | 'medium' | 'high';
  source: 'mock' | 'live';
  imageUrl?: string;
  rank: number;
};

export type DemoEvent = {
  id: string;
  ts: number;
  stage: DemoStage;
  type: DemoEventType;
  message: string;
  progress?: number;
};

export type DemoSessionState = {
  mode: DemoMode;
  currentStage: DemoStage;
  progress: number;
  candidates: DemoCandidate[];
  events: DemoEvent[];
  isDragging: boolean;
};

export type LiveSnapshot = {
  status?: string;
  currentStage?: string;
  progress?: number;
  results?: Array<{ title?: string; confidence?: 'low' | 'medium' | 'high' }>;
  error?: string;
};

export type StageDropAction = {
  stage: DemoStage;
  source: 'lane-drop';
};
