import 'server-only';

import { auth } from '@repo/auth/server';
import { intakeRequest } from './intake-api';

export async function sellerIntakeToken(): Promise<string> {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    throw new Error('Sign in required.');
  }
  return token;
}

export function getSellerIntake<T>(path: string, token: string): Promise<T> {
  return intakeRequest<T>({ path, token });
}
