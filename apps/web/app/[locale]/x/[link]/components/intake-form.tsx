'use client';

import {
  type IntakeActionResult,
  type IntakeFinalizePayload,
  type IntakeFinalizeResponse,
  IntakeForm as IntakeFormComposite,
  type IntakeReservation,
  type IntakeReservationPayload,
} from '@repo/design-system/components/intake/intake-form';
import type {
  BudgetFailure,
  PublicIntakeLink,
} from '@repo/design-system/components/intake/types';
import { useParams } from 'next/navigation';

function isBudgetFailure(value: unknown): value is BudgetFailure {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<BudgetFailure>;
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.budget === 'string' &&
    typeof candidate.limit === 'number' &&
    typeof candidate.unit === 'string' &&
    typeof candidate.ask === 'string'
  );
}

async function responseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function bffAction<Data>(input: {
  path: string;
  payload: Record<string, unknown>;
  fallback: string;
}): Promise<IntakeActionResult<Data>> {
  let response: Response;
  try {
    response = await fetch(input.path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input.payload),
    });
  } catch {
    return { failure: { message: input.fallback } };
  }

  const body = await responseJson(response);
  if (!response.ok) {
    return {
      failure: {
        ...(isBudgetFailure(body) ? { budget: body } : {}),
        message: isBudgetFailure(body) ? body.message : input.fallback,
      },
    };
  }
  return { data: body as Data };
}

export function IntakeForm({
  mediaPolicy,
}: {
  mediaPolicy: PublicIntakeLink['mediaPolicy'];
}) {
  const params = useParams<{ link: string }>();
  const linkPath = encodeURIComponent(params.link);

  const reserveSubmission = (payload: IntakeReservationPayload) =>
    bffAction<IntakeReservation>({
      path: `/api/x/${linkPath}/submissions`,
      payload,
      fallback: 'Submission could not start. Check the fields and try again.',
    });

  const finalizeSubmission = (payload: IntakeFinalizePayload) =>
    bffAction<IntakeFinalizeResponse>({
      path: `/api/x/${linkPath}/submissions/${encodeURIComponent(payload.submissionId)}/finalize`,
      payload: {
        finalizeToken: payload.finalizeToken,
        media: payload.media,
      },
      fallback: 'Submission could not be checked. Try again.',
    });

  return (
    <IntakeFormComposite
      finalizeSubmission={finalizeSubmission}
      mediaPolicy={mediaPolicy}
      reserveSubmission={reserveSubmission}
    />
  );
}
