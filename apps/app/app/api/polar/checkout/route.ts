import { Checkout } from "@polar-sh/nextjs";
import { keys } from '@repo/payments/keys';

export const GET = Checkout({
  accessToken: keys().POLAR_ACCESS_TOKEN,
  successUrl: keys().POLAR_SUCCESS_URL,
  server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
});
