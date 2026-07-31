import { database } from '@repo/database';

/**
 * Vercel sends `Authorization: Bearer $CRON_SECRET` on scheduled invocations.
 * Without that check this was a public endpoint that wrote to the database on
 * every hit, so anyone could amplify writes, connections, and log volume just by
 * curling it in a loop. A read is also all a keep-alive needs: the point is to
 * keep the connection warm, not to churn rows.
 */
export const GET = async (request: Request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response('Not configured', { status: 500 });
  }

  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await database.page.count();

  return new Response('OK', { status: 200 });
};
