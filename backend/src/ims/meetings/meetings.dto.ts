import { z } from 'zod';

export const CreateMeetingSchema = z.object({
  title: z.string().min(3),
  prokerId: z.string().optional(),
  date: z.coerce.date(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().optional(),
});

export const AddMeetingNoteSchema = z.object({
  content: z.string().min(1),
  authorId: z.string(),
});

export const AttendMeetingSchema = z.object({
  userId: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type CreateMeetingDto = z.infer<typeof CreateMeetingSchema>;
export type AddMeetingNoteDto = z.infer<typeof AddMeetingNoteSchema>;
export type AttendMeetingDto = z.infer<typeof AttendMeetingSchema>;
