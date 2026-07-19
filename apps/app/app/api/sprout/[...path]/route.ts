import { auth } from '@repo/auth/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const READ_ROUTES = [
  /^sessions$/,
  /^sessions\/[^/]+\/(?:threads|messages|pending-actions)$/,
];

const WRITE_ROUTES = [
  /^sessions\/[^/]+\/turns\/stream$/,
  /^sessions\/[^/]+\/messages$/,
  /^sessions\/[^/]+\/pending-actions\/[^/]+\/(?:approve|reject)$/,
];

function getAgentApiBase() {
  const configured = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
  ).replace(/\/+$/, '');
  const apiBase = configured.endsWith('/api')
    ? configured
    : `${configured}/api`;
  return `${apiBase}/agent`;
}

function isAllowed(path: string, method: 'GET' | 'POST') {
  const routes = method === 'GET' ? READ_ROUTES : WRITE_ROUTES;
  return routes.some((route) => route.test(path));
}

async function proxyAgentRequest(
  request: Request,
  context: RouteContext,
  method: 'GET' | 'POST'
) {
  const { getToken, userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await getToken();
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { path: segments } = await context.params;
  const path = segments.join('/');
  if (!isAllowed(path, method)) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const incomingUrl = new URL(request.url);
  const backendUrl = `${getAgentApiBase()}/${path}${incomingUrl.search}`;
  const body = method === 'POST' ? await request.arrayBuffer() : undefined;
  const response = await fetch(backendUrl, {
    method,
    headers: {
      Accept: request.headers.get('accept') || 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': request.headers.get('content-type') || 'application/json',
    },
    body: body && body.byteLength > 0 ? body : undefined,
    cache: 'no-store',
    signal: request.signal,
  });

  const headers = new Headers();
  headers.set(
    'Content-Type',
    response.headers.get('content-type') || 'application/json'
  );
  headers.set(
    'Cache-Control',
    response.headers.get('cache-control') || 'no-store, no-transform'
  );
  const buffering = response.headers.get('x-accel-buffering');
  if (buffering) {
    headers.set('X-Accel-Buffering', buffering);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function GET(request: Request, context: RouteContext) {
  return proxyAgentRequest(request, context, 'GET');
}

export function POST(request: Request, context: RouteContext) {
  return proxyAgentRequest(request, context, 'POST');
}
