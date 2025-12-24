import { captureException as sentryCaptureException } from '@sentry/nextjs';
import { log } from './log';
import { keys } from './keys';

// Wrapper that only calls Sentry if configured
export const captureException = (error: unknown): void => {
  const dsn = keys().NEXT_PUBLIC_SENTRY_DSN;
  if (dsn) {
    sentryCaptureException(error);
  }
};

export const parseError = (error: unknown): string => {
  let message = 'An error occurred';

  if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = error.message as string;
  } else {
    message = String(error);
  }

  try {
    captureException(error);
    log.error(`Parsing error: ${message}`);
  } catch (newError) {
    // biome-ignore lint/suspicious/noConsole: Need console here
    console.error('Error parsing error:', newError);
  }

  return message;
};
