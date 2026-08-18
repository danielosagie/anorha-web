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

export type LinkLimits = {
  maxSubmissionsPerLink: number;
  maxMediaPerSubmission: number;
  imageMaxBytes: number;
};

export type SellerIntakeLink = {
  Id: string;
  Name: string;
  Slug: string | null;
  Status: IntakeLinkStatus;
  AnalysisActorUserId: string | null;
  CreatedByUserId: string;
  CreatedAt: string;
  UpdatedAt: string;
  RevokedByUserId: string | null;
  RevokedAt: string | null;
  metrics: LinkMetrics;
  bytes: LinkBytes;
  // The slug address. Named storeUrl and never publicUrl: publicUrl is the
  // token capability, which a list response must never carry.
  storeUrl: string | null;
};

// The one link a seller prints. Derived server-side from the slugged active
// link, falling back to the oldest active one.
export type SellerStoreLink = {
  // Rendered as given. The client never guesses the public host.
  storeUrlPrefix: string;
  linkId: string | null;
  name: string | null;
  slug: string | null;
  storeUrl: string | null;
  suggestedSlug: string | null;
  otherLinkCount: number;
};

export type SlugCheckResponse = {
  slug: string;
  available: boolean;
  reason: string | null;
  message: string | null;
  suggestions: string[];
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
  storeLink: SellerStoreLink;
  links: SellerIntakeLink[];
  metrics: LinkMetrics;
};

export type SellerSubmissionListResponse = {
  items: SellerSubmissionListItem[];
  nextCursor: string | null;
};

export type SellerLinkDetailResponse = SellerIntakeLink & {
  limits?: LinkLimits;
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
  slug: string | null;
  status: 'active';
  publicToken: string;
  publicUrl: string;
  storeUrl: string | null;
  createdAt: string;
};

export type UpdatedIntakeLinkSlug = {
  id: string;
  name: string;
  slug: string;
  status: IntakeLinkStatus;
  storeUrl: string;
  updatedAt: string;
};

export type RevealedIntakeLink = {
  publicUrl: string;
};

export type DecisionResponse = {
  submissionId: string;
  status: 'accepted' | 'declined';
  decisionAt: string;
  conversionStatus: 'not_requested';
};
