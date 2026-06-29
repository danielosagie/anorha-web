import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    success: true,
    session: null,
    message: 'No demo session provider configured. Falling back to scripted mode.',
  });
}
