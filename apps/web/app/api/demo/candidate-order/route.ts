import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const jobId = typeof payload?.jobId === 'string' ? payload.jobId : '';
    const orderedCandidateIds = Array.isArray(payload?.orderedCandidateIds)
      ? payload.orderedCandidateIds.filter((id: unknown) => typeof id === 'string')
      : [];

    if (!jobId || orderedCandidateIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      accepted: true,
      jobId,
      orderedCandidateIds,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to parse payload' },
      { status: 400 },
    );
  }
}
