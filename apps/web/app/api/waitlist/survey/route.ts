export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // TODO: Persist survey answers alongside the waitlist entry (Supabase row id)
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}




