import { Checkout } from "@polar-sh/nextjs";
import { keys } from '@repo/payments/keys';
import { NextRequest } from 'next/server';

export const GET = async (req: NextRequest) => {
  try {
    console.log('Polar checkout route hit');
    console.log('Polar Token:', keys().POLAR_ACCESS_TOKEN);
    console.log('Polar Server:', (process.env.POLAR_API_SERVER as 'production' | 'sandbox') || 'sandbox');
    
    const checkout = Checkout({
      accessToken: keys().POLAR_ACCESS_TOKEN,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing/success`,
      server: (process.env.POLAR_API_SERVER as 'production' | 'sandbox') || 'sandbox',
      theme: 'light',
    });
    
    const result = await checkout(req);
    console.log('Polar checkout result:', result);
    
    return result;
  } catch (error) {
    console.error('Polar checkout error:', error);
    console.error('Full error object:', JSON.stringify(error));
    
    return new Response(
      JSON.stringify({ 
        error: 'Checkout failed', 
        details: error instanceof Error ? error.message : String(error),
        statusCode: (error as any).status || 500 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
