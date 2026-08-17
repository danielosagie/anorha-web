import { proxyIntakeRequest } from '../../../../_lib/intake-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string; id: string }> }
) {
  const { id, token } = await context.params;
  return proxyIntakeRequest({
    request,
    token,
    suffix: `submissions/${encodeURIComponent(id)}/finalize`,
  });
}
