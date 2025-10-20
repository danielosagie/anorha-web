import { Webhooks } from "@polar-sh/nextjs";
import { keys } from '@repo/payments/keys';

export const POST = Webhooks({
  webhookSecret: keys().POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    // Handle Polar webhook events
    console.log('Polar webhook received:', payload);
    
    // TODO: Forward to your backend if needed
    // await fetch('/api/billing/polar-webhook', {
    //   method: 'POST',
    //   body: JSON.stringify(payload),
    // });
  },
});
