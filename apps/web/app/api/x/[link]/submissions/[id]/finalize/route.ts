import { proxyIntakeRequest } from '../../../../_lib/intake-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ link: string; id: string }> }
) {
  const { id, link } = await context.params;
  return proxyIntakeRequest({
    request,
    segment: link,
    suffix: `submissions/${encodeURIComponent(id)}/finalize`,
  });
}
