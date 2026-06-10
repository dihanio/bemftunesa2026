import { z } from 'zod';

export const PkkmbAuthSchema = z.object({
  nim: z.string().min(5),
});

export const SubmitTaskSchema = z.object({
  contentUrl: z.string().optional(),
  textContent: z.string().optional(),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  deadline: z.coerce.date().optional(),
  type: z.enum(['individu', 'kelompok']).default('individu'),
  submissionType: z.enum(['File', 'Link', 'Text']).default('File'),
});

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(5),
  category: z.enum(['Umum', 'Urgent', 'Perubahan Jadwal']).default('Umum'),
  isUrgent: z.boolean().default(false),
});

export const GradeSubmissionSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().optional(),
});

export type PkkmbAuthDto = z.infer<typeof PkkmbAuthSchema>;
