import { withVercelToolbar } from '@vercel/toolbar/plugins/next';
// packages/feature-flags/lib/toolbar.ts
import { keys } from '../keys';

export const withToolbar = (config: object) => {
  if (!keys().FLAGS_SECRET) return config;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { withVercelToolbar } = require('@vercel/toolbar/plugins/next');
    return withVercelToolbar()(config);
  } catch {
    return config; // safe fallback
  }
};