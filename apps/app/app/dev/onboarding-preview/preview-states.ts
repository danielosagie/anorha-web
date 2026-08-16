// Shared by the server page and the client harness. Kept out of the
// 'use client' module because plain values do not cross the RSC boundary.
export const PREVIEW_STATES = [
  'loading',
  'create',
  'ready',
  'ready-ios',
  'android-idle',
  'android-loading',
  'android-error',
  'android-saved',
  'android-sent',
] as const;

export type PreviewState = (typeof PREVIEW_STATES)[number];
