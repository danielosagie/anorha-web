import { Webhooks } from "@polar-sh/nextjs";
import { keys } from '@repo/payments/keys';

export const POST = Webhooks({
  webhookSecret: keys().POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    // Handle Polar webhook events by forwarding to backend
    console.log('Polar webhook received:', payload.type);
    
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const rawBody = JSON.stringify(payload);
      
      // Forward webhook to backend for processing
      const response = await fetch(`${apiBase}/api/billing/polar-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: rawBody,
      });
      
      if (!response.ok) {
        console.error('Failed to forward Polar webhook to backend:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error forwarding Polar webhook:', error);
    }
  },
});
