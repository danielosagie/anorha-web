import { proxyIntakeRequest } from '../_lib/intake-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  return proxyIntakeRequest({ request, token });
}
