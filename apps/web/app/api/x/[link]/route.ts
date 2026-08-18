import { proxyIntakeRequest } from '../_lib/intake-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ link: string }> }
) {
  const { link } = await context.params;
  return proxyIntakeRequest({ request, segment: link });
}
