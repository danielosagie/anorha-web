// Detailed logging for Polar checkout
import { Checkout } from "@polar-sh/nextjs";
import { keys } from '@repo/payments/keys';
import { NextRequest } from 'next/server';

export const GET = async (req: NextRequest) => {
  // Parse URL outside try-catch for error handling
  const url = new URL(req.url);
  const products = url.searchParams.get('products');

  try {
    console.log('=== POLAR CHECKOUT DEBUG START ===');
    
    // Log request details
    console.log('[Polar Checkout] Request URL:', req.url);
    console.log('[Polar Checkout] Products param:', products);
    
    // Log all relevant env vars
    console.log('[Polar Checkout] Environment vars:');
    console.log('  POLAR_ACCESS_TOKEN:', !!process.env.POLAR_ACCESS_TOKEN ? 'PRESENT' : 'MISSING');
    console.log('  POLAR_API_SERVER:', process.env.POLAR_API_SERVER || 'DEFAULT (sandbox)');
    console.log('  POLAR_SUCCESS_URL:', process.env.POLAR_SUCCESS_URL || 'MISSING');
    console.log('  NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'MISSING');
    console.log('  STRIPE_SECRET_KEY:', !!process.env.STRIPE_SECRET_KEY ? 'PRESENT' : 'MISSING'); // Added for debugging Stripe validation
    
    // Try to load keys and log result
    let polarTokenFromKeys;
    try {
      const loadedKeys = keys();
      polarTokenFromKeys = !!loadedKeys.POLAR_ACCESS_TOKEN ? 'PRESENT' : 'MISSING';
      console.log('[Polar Checkout] keys().POLAR_ACCESS_TOKEN:', polarTokenFromKeys);
      console.log('[Polar Checkout] keys() success - all vars validated');
    } catch (keysError) {
      console.error('[Polar Checkout] keys() failed:', keysError);
      throw new Error(`Keys validation failed: ${keysError}`);
    }
    
    const serverMode = (process.env.POLAR_API_SERVER as 'production' | 'sandbox') || 'sandbox';
    console.log('[Polar Checkout] Server mode:', serverMode);
    
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing/success`;
    console.log('[Polar Checkout] Success URL:', successUrl);
    
    const checkout = Checkout({
      accessToken: keys().POLAR_ACCESS_TOKEN,
      successUrl: successUrl,
      server: serverMode,
      theme: 'light',
    });
    
    console.log('[Polar Checkout] Checkout object created successfully');
    
    const result = await checkout(req);
    console.log('[Polar Checkout] Checkout result status:', result.status);
    console.log('[Polar Checkout] Checkout result type:', result.type);
    console.log('[Polar Checkout] Checkout result ok:', result.ok);
    
    console.log('=== POLAR CHECKOUT DEBUG END ===');
    
    return result;
  } catch (error) {
    console.error('=== POLAR CHECKOUT ERROR START ===');
    console.error('[Polar Checkout] Full error:', error);
    console.error('[Polar Checkout] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[Polar Checkout] Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Log env vars again in error case
    console.log('[Polar Checkout] Env vars (error context):');
    console.log('  POLAR_ACCESS_TOKEN present:', !!process.env.POLAR_ACCESS_TOKEN);
    console.log('  POLAR_API_SERVER:', process.env.POLAR_API_SERVER);
    console.log('  Products param (error):', products);
    
    console.error('=== POLAR CHECKOUT ERROR END ===');
    
    return new Response(
      JSON.stringify({ 
        error: 'Checkout failed', 
        details: error instanceof Error ? error.message : String(error),
        statusCode: (error as any).status || 500,
        products: products,
        serverMode: (process.env.POLAR_API_SERVER as 'production' | 'sandbox') || 'sandbox'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
