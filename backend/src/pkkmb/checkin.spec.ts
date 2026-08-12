import { PkkmbService } from './pkkmb.service';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

// Helper: instantiate PkkmbService dengan mock untuk dependency yang dipakai
// method checkIn. Param lain null (tidak dipakai jalur yang ditest).
function buildService(overrides: {
  session?: unknown;
  logFindOne?: unknown;
  logCreate?: unknown;
}) {
  const logModel = {
    findOne: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(overrides.logFindOne ?? null),
        }),
      }),
    }),
    create: jest.fn().mockResolvedValue(overrides.logCreate ?? {}),
  } as never;

  const sessionModel = {
    findById: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(overrides.session ?? null),
    }),
  } as never;

  const userModel = {
    findById: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          role: { slug: 'user' },
        }),
      }),
    }),
  } as never;

  const roleModel = { findOne: jest.fn().mockResolvedValue(null) } as never;
  const groupModel = {} as never;
  const redis = { incr: jest.fn().mockResolvedValue(1) } as never;

  const svc = new PkkmbService(
    userModel,
    roleModel,
    groupModel,
    sessionModel,
    logModel,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    redis,
  );
  return svc;
}

const WIB = (s: string) => new Date(`${s}+07:00`);

function session(startISO: Date, endISO: Date, status = 'PUBLISHED') {
  return {
    _id: new Types.ObjectId(),
    status,
    startTime: startISO,
    endTime: endISO,
    qrCode: 'QR',
    qrExpiry: endISO,
  };
}

describe('checkIn — validasi periode & duplicate', () => {
  const start = WIB('2026-08-11T08:00');
  const end = WIB('2026-08-11T23:59');

  const dto = {
    sessionId: new Types.ObjectId().toString(),
    method: 'SELF_CHECKIN',
    photoUrl: 'x',
  } as never;

  const opId = new Types.ObjectId().toString();

  it('Tolak sebelum start (07:59 WIB) -> Presensi belum dibuka', async () => {
    const svc = buildService({ session: session(start, end) });
    jest.useFakeTimers();
    jest.setSystemTime(WIB('2026-08-11T07:59').getTime());
    try {
      await svc.checkIn(dto, opId);
      fail('harus ditolak');
    } catch (e) {
      expect((e as BadRequestException).message).toContain('belum dibuka');
    } finally {
      jest.useRealTimers();
    }
  });

  it('Terima tepat di start (08:00 WIB)', async () => {
    const svc = buildService({ session: session(start, end) });
    jest.useFakeTimers();
    jest.setSystemTime(WIB('2026-08-11T08:00').getTime());
    try {
      await expect(svc.checkIn(dto, opId)).resolves.toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('Terima di tengah (12:00 WIB)', async () => {
    const svc = buildService({ session: session(start, end) });
    jest.useFakeTimers();
    jest.setSystemTime(WIB('2026-08-11T12:00').getTime());
    try {
      await expect(svc.checkIn(dto, opId)).resolves.toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('Terima tepat di end (23:59 WIB, inclusive)', async () => {
    const svc = buildService({ session: session(start, end) });
    jest.useFakeTimers();
    jest.setSystemTime(WIB('2026-08-11T23:59').getTime());
    try {
      await expect(svc.checkIn(dto, opId)).resolves.toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('Tolak setelah end (00:00 WIB tgl 12) -> Presensi telah ditutup', async () => {
    const svc = buildService({ session: session(start, end) });
    jest.useFakeTimers();
    jest.setSystemTime(WIB('2026-08-12T00:00').getTime());
    try {
      await svc.checkIn(dto, opId);
      fail('harus ditolak');
    } catch (e) {
      expect((e as BadRequestException).message).toContain('ditutup');
    } finally {
      jest.useRealTimers();
    }
  });

  it('Tolak duplicate -> Anda sudah melakukan presensi', async () => {
    const svc = buildService({
      session: session(start, end),
      logFindOne: { status: 'Hadir' },
    });
    jest.useFakeTimers();
    jest.setSystemTime(WIB('2026-08-11T12:00').getTime());
    try {
      await svc.checkIn(dto, opId);
      fail('harus ditolak');
    } catch (e) {
      expect((e as BadRequestException).message).toContain('sudah melakukan');
    } finally {
      jest.useRealTimers();
    }
  });

  it('Tolak saat session tidak PUBLISHED', async () => {
    const svc = buildService({ session: session(start, end, 'CLOSED') });
    jest.useFakeTimers();
    jest.setSystemTime(WIB('2026-08-11T12:00').getTime());
    try {
      await svc.checkIn(dto, opId);
      fail('harus ditolak');
    } catch (e) {
      expect((e as BadRequestException).message).toContain('tidak aktif');
    } finally {
      jest.useRealTimers();
    }
  });
});
