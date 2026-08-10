import { parseWibDate, isWithinPeriod } from './wib-time';

describe('wib-time', () => {
  describe('parseWibDate', () => {
    it('menafsirkan string tanpa offset sebagai WIB (08:00 WIB = 01:00 UTC)', () => {
      const d = parseWibDate('2026-08-11T08:00');
      expect(d.toISOString()).toBe('2026-08-11T01:00:00.000Z');
    });

    it('23:59 WIB = 16:59 UTC', () => {
      const d = parseWibDate('2026-08-11T23:59');
      expect(d.toISOString()).toBe('2026-08-11T16:59:00.000Z');
    });

    it('menghargai offset eksplisit Z', () => {
      const d = parseWibDate('2026-08-11T08:00:00Z');
      expect(d.toISOString()).toBe('2026-08-11T08:00:00.000Z');
    });

    it('menghargai offset eksplisit +07:00', () => {
      const d = parseWibDate('2026-08-11T08:00+07:00');
      expect(d.toISOString()).toBe('2026-08-11T01:00:00.000Z');
    });
  });

  describe('isWithinPeriod', () => {
    const start = parseWibDate('2026-08-11T08:00'); // 01:00Z
    const end = parseWibDate('2026-08-11T23:59'); // 16:59Z

    it('BEFORE ketika sebelum start', () => {
      expect(isWithinPeriod(parseWibDate('2026-08-11T07:59'), start, end)).toBe('BEFORE');
    });

    it('ACTIVE tepat di start (inclusive)', () => {
      expect(isWithinPeriod(parseWibDate('2026-08-11T08:00'), start, end)).toBe('ACTIVE');
    });

    it('ACTIVE di tengah periode', () => {
      expect(isWithinPeriod(parseWibDate('2026-08-11T12:00'), start, end)).toBe('ACTIVE');
    });

    it('ACTIVE tepat di end (inclusive)', () => {
      expect(isWithinPeriod(parseWibDate('2026-08-11T23:59'), start, end)).toBe('ACTIVE');
    });

    it('AFTER setelah end', () => {
      expect(isWithinPeriod(parseWibDate('2026-08-12T00:00'), start, end)).toBe('AFTER');
    });
  });
});
