import 'server-only';

import { z } from 'zod';

const intakeServerEnvSchema = z.object({
  apiUrl: z.string().url(),
  publicServiceSecret: z.string().min(1),
  rateLimitSecret: z.string().min(1),
  requestsPerHour: z.coerce.number().int().positive().default(240),
});

export type IntakeServerConfig = z.infer<typeof intakeServerEnvSchema>;

export function getIntakeServerConfig(): IntakeServerConfig | null {
  const result = intakeServerEnvSchema.safeParse({
    apiUrl: process.env.INTAKE_API_URL,
    publicServiceSecret: process.env.INTAKE_PUBLIC_SERVICE_SECRET,
    rateLimitSecret: process.env.INTAKE_RATE_LIMIT_SECRET,
    requestsPerHour: process.env.INTAKE_PUBLIC_REQUESTS_PER_HOUR,
  });

  return result.success ? result.data : null;
}
