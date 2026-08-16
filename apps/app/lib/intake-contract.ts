import type {
  IntakeAnalysisStatus,
  IntakeCondition,
  IntakeConversionStatus,
  IntakeLinkStatus,
  IntakeSubmissionStatus,
  SignedIntakeMedia,
} from '@repo/design-system/components/intake/types';

export type LinkMetrics = {
  items: number;
  new: number;
  reviewed: number;
};

export type LinkBytes = {
  reserved: number;
  actual: number;
};

export type SellerIntakeLink = {
  Id: string;
  Name: string;
  Status: IntakeLinkStatus;
  AnalysisActorUserId: string | null;
  CreatedByUserId: string;
  CreatedAt: string;
  UpdatedAt: string;
  RevokedByUserId: string | null;
  RevokedAt: string | null;
  metrics: LinkMetrics;
  bytes: LinkBytes;
};

export type SellerSubmissionListItem = {
  id: string;
  link: { Id: string; Name: string } | null;
  customer: { id: string; name: string; email: string } | null;
  description: string;
  quantity: number;
  condition: IntakeCondition;
  status: Exclude<IntakeSubmissionStatus, 'draft'>;
  media: {
    count: number;
    imageCount: number;
    videoCount: number;
    cover: SignedIntakeMedia | null;
  };
  analysisStatus: IntakeAnalysisStatus;
  conversionStatus: IntakeConversionStatus;
  submittedAt: string;
};

export type SellerLinkListResponse = {
  period: {
    kind: 'all_time';
    start: null;
    end: string;
    timezone: 'UTC';
  };
  links: SellerIntakeLink[];
  metrics: LinkMetrics;
};

export type SellerSubmissionListResponse = {
  items: SellerSubmissionListItem[];
  nextCursor: string | null;
};

export type SellerLinkDetailResponse = SellerIntakeLink & {
  recentSubmissions: SellerSubmissionListItem[];
};

export type SellerSubmissionDetailResponse = {
  id: string;
  link: { Id: string; Name: string } | null;
  customer: { id: string; name: string; email: string } | null;
  description: string;
  quantity: number;
  condition: IntakeCondition;
  status: Exclude<IntakeSubmissionStatus, 'draft'>;
  media: SignedIntakeMedia[];
  analysis: {
    status: IntakeAnalysisStatus;
    version: number | null;
    result: unknown | null;
    error: string | null;
    completedAt: string | null;
  };
  conversion: {
    status: IntakeConversionStatus;
    error: string | null;
    productId: string | null;
    variantId: string | null;
    convertedAt: string | null;
  };
  decision: {
    at: string;
    byUserId: string;
    reason: string | null;
    draftTitle: string | null;
  } | null;
  submittedAt: string;
  reviewStartedAt: string | null;
};

export type CreatedIntakeLink = {
  id: string;
  name: string;
  status: 'active';
  publicToken: string;
  publicUrl: string;
  createdAt: string;
};

export type DecisionResponse = {
  submissionId: string;
  status: 'accepted' | 'declined';
  decisionAt: string;
  conversionStatus: 'not_requested';
};
