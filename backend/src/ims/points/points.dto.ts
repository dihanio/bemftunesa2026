import { z } from 'zod';

export const AwardPointsSchema = z.object({
  userId: z.string(),
  amount: z.number().int(),
  reason: z.string().min(3),
  type: z.enum(['EARN', 'DEBIT']).default('EARN'),
  category: z
    .enum(['rapat', 'panitia', 'proker', 'kontribusi', 'lainnya'])
    .default('lainnya'),
});

export type AwardPointsDto = z.infer<typeof AwardPointsSchema>;
