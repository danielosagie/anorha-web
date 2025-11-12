import { NextResponse } from 'next/server';
import { auth, clerkClient, currentUser } from '@repo/auth/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const user = await currentUser();
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    const overrides = (clerkUser.privateMetadata?.notification_overrides as any) || null;
    
    return NextResponse.json({ overrides });
  } catch (error: any) {
    console.error('[user-notifications/GET] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch notification overrides' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const user = await currentUser();
    
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        notification_overrides: body.overrides || null,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[user-notifications/PUT] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update notification overrides' },
      { status: 500 }
    );
  }
}


