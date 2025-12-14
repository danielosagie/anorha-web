import { currentUser, auth } from '@clerk/nextjs/server';
import { getSupabaseToken } from '../../billing/_utils';

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    const clerkUser = await currentUser();
    
    if (!clerkUserId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use the same token resolution as billing routes
    const { token, apiBase } = await getSupabaseToken();

    // Call backend to get the mapping info
    const res = await fetch(`${apiBase}/debug/billing-mapping`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const error = await res.text();
      return Response.json({ error }, { status: res.status });
    }

    const data = await res.json();

    return Response.json({
      clerkUserId,
      clerkEmail: clerkUser?.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
        || clerkUser?.emailAddresses?.[0]?.emailAddress,
      backendData: data,
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || 'Failed to fetch mapping' }, { status: 500 });
  }
}



