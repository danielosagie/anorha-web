export interface AdminPageResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export interface AdminBillingState {
  source: string;
  planKey: string | null;
  status: string;
  paidThrough: string | null;
  currentPeriodEnd: string | null;
}

export interface AdminOrgListItem {
  id: string;
  name: string;
  ownerEmail: string | null;
  createdAt: string;
  connectedPlatformsCount: number;
  billing: AdminBillingState | null;
}

export interface AdminConnectedPlatform {
  id: string;
  platform: string;
  name: string;
  status: string;
  enabled: boolean;
}

export interface AdminOrgDetail extends AdminOrgListItem {
  connectedPlatforms: AdminConnectedPlatform[];
}

export interface AdminTesterQueueItem {
  id: string;
  email: string;
  accountEmail: string | null;
  clerkUserId: string | null;
  source: string;
  status: string;
  notifiedAt: string | null;
  testerAddedAt: string | null;
  inviteSentAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminGdprRequest {
  id: string;
  webhookId: string;
  topic: string;
  platformConnectionId: string;
  shopDomain: string;
  status: string;
  receivedAt: string;
  dueBy: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminHealthCount {
  platform: string;
  status: string;
  count: number;
}

export interface AdminFailureReason extends AdminHealthCount {
  reason: string;
}

export interface AdminHealthProjection {
  total: number;
  counts: AdminHealthCount[];
  failureReasons: AdminFailureReason[];
  reasonGroupsTotal: number;
  reasonsTruncated: boolean;
}

export interface AdminWebhookHealth {
  webhookEvents: AdminHealthProjection;
  deadLetters: AdminHealthProjection;
}

export interface AdminFeatureUsage {
  count: number;
  costCents: number;
  inputTokens: number;
  outputTokens: number;
}

export interface AdminUserUsage {
  costCents: number;
  count: number;
}

export interface AdminUsageResponse {
  source: 'UsageEvents';
  summary: {
    orgId: string;
    totalCostCents: number;
    totalEvents: number;
    byFeature: Record<string, AdminFeatureUsage>;
    byUser: Record<string, AdminUserUsage>;
  };
}
