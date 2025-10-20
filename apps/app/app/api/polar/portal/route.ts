import { CustomerPortal } from "@polar-sh/nextjs";
import { keys } from '@repo/payments/keys';

export const GET = CustomerPortal({
  accessToken: keys().POLAR_ACCESS_TOKEN,
  getCustomerId: async (req) => {
    // TODO: Get customer ID from your auth system
    // This should integrate with your current auth
    // For now, return a placeholder
    return 'customer-id-from-auth';
  },
  server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
});
