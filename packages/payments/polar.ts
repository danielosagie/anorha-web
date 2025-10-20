import 'server-only';
import { Polar } from '@polar-sh/sdk';
import { keys } from './keys';

export const polar = new Polar({
  accessToken: keys().POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
});

export type { Polar } from '@polar-sh/sdk';
