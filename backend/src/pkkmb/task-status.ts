export type SubmissionStatus = 'SUBMITTED' | 'LATE' | 'GRADED';

// Menentukan status submission baru berdasarkan waktu & status existing.
// - Existing graded -> tetap GRADED (nilai tidak di-reset ke belakang).
// - Existing non-graded -> SUBMITTED (sedang dalam periode; bukan telat).
// - Baru + lewat deadline -> LATE.
// - Baru + dalam periode -> SUBMITTED.
export function resolveSubmissionStatus(
  existing: { status: string } | null,
  isLate: boolean,
): SubmissionStatus {
  if (existing) return existing.status === 'GRADED' ? 'GRADED' : 'SUBMITTED';
  return isLate ? 'LATE' : 'SUBMITTED';
}
