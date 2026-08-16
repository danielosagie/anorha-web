export type IntakeLinkStatus = 'active' | 'revoked';

export type IntakeSubmissionStatus =
  | 'draft'
  | 'new'
  | 'reviewing'
  | 'accepted'
  | 'declined';

export type IntakeCondition =
  | 'unknown'
  | 'new'
  | 'like_new'
  | 'good'
  | 'fair'
  | 'poor';

export type IntakeMediaKind = 'image' | 'video';

export type IntakeMediaStatus =
  | 'reserved'
  | 'uploaded'
  | 'inspecting'
  | 'ready'
  | 'rejected'
  | 'failed'
  | 'deleted';

export type IntakeAnalysisStatus =
  | 'not_requested'
  | 'queued'
  | 'processing'
  | 'complete'
  | 'failed';

export type IntakeConversionStatus = IntakeAnalysisStatus;

export type PublicIntakeLink = {
  seller: {
    displayName: string;
    logoUrl: string | null;
    locationLabel: string | null;
  };
  accepting: boolean;
  mediaPolicy: {
    maxItems: number;
    imageMaxBytes: number;
    videoMaxBytes: number | null;
    allowedTypes: string[];
  };
};

export type BudgetFailure = {
  code: string;
  budget: string;
  limit: number;
  unit: string;
  ask: string;
  message: string;
  retryAt?: string;
};

export type SignedIntakeMedia = {
  id: string;
  position: number;
  kind: IntakeMediaKind;
  status: IntakeMediaStatus;
  url: string | null;
  posterUrl?: string | null;
  contentType: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  failureCode: string | null;
};

export type UploadQueueItem = {
  clientId: string;
  name: string;
  kind: IntakeMediaKind;
  bytes: number;
  uploadedBytes: number;
  progress: number;
  status:
    | 'selected'
    | 'reserved'
    | 'uploading'
    | 'uploaded'
    | 'inspecting'
    | 'ready'
    | 'rejected'
    | 'failed';
  reason?: string;
};
