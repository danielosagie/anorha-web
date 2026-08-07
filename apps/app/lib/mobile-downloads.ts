import { env } from '@/env';

export const IOS_DOWNLOAD_URL =
  env.NEXT_PUBLIC_TESTFLIGHT_URL ||
  'https://testflight.apple.com/join/7QAEgvUj';

export const ANDROID_DOWNLOAD_URL =
  env.NEXT_PUBLIC_ANDROID_ACCESS_URL ||
  'https://play.google.com/apps/testing/anorha.alpha';
