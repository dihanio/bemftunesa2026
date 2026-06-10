import { z } from 'zod';

export const CreateProkerSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().optional(),
  departmentId: z.string(),
  pjId: z.string().optional(),
  status: z
    .enum([
      'Planning',
      'Active',
      'Event Finished',
      'LPJ Revision',
      'LPJ Approved',
      'Archived',
      'In Progress',
      'Completed',
      'Cancelled',
    ])
    .default('Planning'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budget: z.number().optional(),
  location: z.string().optional(),
  tasks: z.array(z.any()).optional(),
  ledger: z.array(z.any()).optional(),
  assets: z.array(z.any()).optional(),
  comments: z.array(z.any()).optional(),
  milestones: z.array(z.any()).optional(),
  kpiTargets: z.array(z.any()).optional(),
  logs: z.array(z.string()).optional(),
  lpjChecklist: z
    .object({
      rundown: z.boolean().default(false),
      rab: z.boolean().default(false),
      spj: z.boolean().default(false),
      presensi: z.boolean().default(false),
      kwitansi: z.boolean().default(false),
      dokumentasi: z.boolean().default(false),
    })
    .optional(),
});

export const UpdateProkerSchema = CreateProkerSchema.partial();

export const UpdateProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  status: z
    .enum(['Planning', 'In Progress', 'Completed', 'Cancelled'])
    .optional(),
});

export const AssignMemberSchema = z.object({
  userId: z.string(),
  roleInProker: z.string().min(1),
  division: z.string().optional(),
});

export type CreateProkerDto = z.infer<typeof CreateProkerSchema>;
export type UpdateProkerDto = z.infer<typeof UpdateProkerSchema>;
export type UpdateProgressDto = z.infer<typeof UpdateProgressSchema>;
export type AssignMemberDto = z.infer<typeof AssignMemberSchema>;
