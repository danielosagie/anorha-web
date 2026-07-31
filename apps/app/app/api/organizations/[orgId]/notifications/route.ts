import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@repo/auth/server';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
  syncErrors: {
    enabled: true,
    channels: { inApp: true, email: true },
  },
  lowStock: {
    enabled: true,
    threshold: 10,
    channels: { inApp: true, email: true },
    frequency: 'immediate' as const,
  },
  reports: {
    enabled: true,
    cadence: 'daily' as const,
    timeUtc: '09:00',
    channels: { inApp: true, email: true },
  },
};

// The role on the session belongs to the caller's ACTIVE org, not to whatever
// org id the URL carries. Checking one and then acting on the other let an admin
// of any org read or overwrite another org's settings just by editing the path,
// so both have to refer to the same organization.
function authorize(orgId: string, activeOrgId: string | null | undefined, orgRole: string | null | undefined) {
  if (!activeOrgId || activeOrgId !== orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  if (orgRole !== 'org:admin' && orgRole !== 'org:owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  return null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params;
    const { orgId: activeOrgId, orgRole } = await auth();

    const denied = authorize(orgId, activeOrgId, orgRole);
    if (denied) return denied;

    const client = await clerkClient();
    const organization = await client.organizations.getOrganization({ organizationId: orgId });
    
    const settings = (organization.privateMetadata?.notifications_settings as any) || DEFAULT_SETTINGS;
    
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('[notifications/GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params;
    const { orgId: activeOrgId, orgRole } = await auth();

    const denied = authorize(orgId, activeOrgId, orgRole);
    if (denied) return denied;

    const body = await request.json();
    
    // Validate settings structure
    if (!body.syncErrors || !body.lowStock || !body.reports) {
      return NextResponse.json({ error: 'Invalid settings structure' }, { status: 400 });
    }

    const client = await clerkClient();
    await client.organizations.updateOrganizationMetadata(orgId, {
      privateMetadata: {
        notifications_settings: body,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[notifications/PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}


