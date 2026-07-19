export type SproutSession = {
  id: string;
  status?: string;
  goal?: {
    targetRevenue?: number;
    timeframeDays?: number;
  };
  updatedAt?: string;
  lastActiveAt?: string;
};

export type SproutThread = {
  id: string;
  title?: string;
  status?: string;
  isPrimary?: boolean;
  updatedAt?: string;
};

export type ToolActivity = {
  id: string;
  label: string;
  status: 'complete' | 'pending' | 'failed';
  summary?: string;
};

export type SproutMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  deliveryState: 'sending' | 'streaming' | 'sent' | 'failed';
  metadata: Record<string, unknown>;
  activities: ToolActivity[];
  imageUrls: string[];
  clientMessageId?: string;
  serverMessageId?: string;
};

export type PlanStep = {
  title: string;
  detail?: string;
};

export type SproutPlan = {
  id: string;
  threadId?: string;
  title: string;
  summary?: string;
  steps: PlanStep[];
};

export type SproutBootstrap = {
  session: SproutSession | null;
  thread: SproutThread | null;
  messages: SproutMessage[];
  plan: SproutPlan | null;
};

export type StreamEvent = {
  type: string;
  payload: Record<string, unknown>;
};
