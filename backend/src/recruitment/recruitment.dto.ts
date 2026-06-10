import { z } from 'zod';

export const ApplyRecruitmentSchema = z.object({
  fullName: z.string().min(3),
  nim: z.string().min(5),
  email: z.string().email(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  applyType: z.enum(['Fungsionaris', 'Panitia', 'Magang']).default('Panitia'),
  firstChoiceDeptId: z.string().optional(),
  secondChoiceDeptId: z.string().optional(),
  firstChoiceProkerId: z.string().optional(),
  secondChoiceProkerId: z.string().optional(),
  motivation: z.string().min(20).optional(),
});

export const ScoreApplicantSchema = z.object({
  applicantId: z.string(),
  score: z.number().min(0).max(100),
  criteria: z.record(z.string(), z.number()).optional(),
  notes: z.string().optional(),
});

export type ApplyRecruitmentDto = z.infer<typeof ApplyRecruitmentSchema>;
export type ScoreApplicantDto = z.infer<typeof ScoreApplicantSchema>;

export const UploadBerkasSchema = z.object({
  nim: z.string().min(5),
  cvUrl: z.string().url().optional(),
  photoUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
});

export type UploadBerkasDto = z.infer<typeof UploadBerkasSchema>;
