import { resolveSubmissionStatus } from './task-status';

describe('resolveSubmissionStatus', () => {
  it('baru + dalam periode -> SUBMITTED', () => {
    expect(resolveSubmissionStatus(null, false)).toBe('SUBMITTED');
  });

  it('baru + lewat deadline -> LATE', () => {
    expect(resolveSubmissionStatus(null, true)).toBe('LATE');
  });

  it('existing non-graded -> SUBMITTED (resubmit dalam periode)', () => {
    expect(resolveSubmissionStatus({ status: 'SUBMITTED' }, false)).toBe(
      'SUBMITTED',
    );
  });

  it('existing GRADED tetap GRADED', () => {
    expect(resolveSubmissionStatus({ status: 'GRADED' }, true)).toBe('GRADED');
    expect(resolveSubmissionStatus({ status: 'GRADED' }, false)).toBe('GRADED');
  });
});
