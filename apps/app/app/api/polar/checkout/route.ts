import { Checkout } from "@polar-sh/nextjs";
import { keys } from '@repo/payments/keys';
import { NextRequest } from 'next/server';

export const GET = Checkout({
  accessToken: keys().POLAR_ACCESS_TOKEN,
  // Success URL: After checkout, redirect to /billing/success
  // Polar appends ?checkout_id={CHECKOUT_ID} automatically
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing/success`,
  server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  theme: 'light',
});
