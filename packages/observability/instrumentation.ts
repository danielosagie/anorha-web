import { init } from '@sentry/nextjs';
import { keys } from './keys';
import { dropPrivateIntakeEvent } from './privacy';

export const initializeSentry = () => {
  const dsn = keys().NEXT_PUBLIC_SENTRY_DSN;

  // Skip initialization if no DSN is configured
  if (!dsn) {
    return;
  }

  const opts = {
    beforeSend: dropPrivateIntakeEvent,
    beforeSendTransaction: dropPrivateIntakeEvent,
    dsn,
  };

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    init(opts);
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    init(opts);
  }
};
