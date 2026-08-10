import { PkkmbService } from './pkkmb.service';
import { Types } from 'mongoose';
import { ForbiddenException } from '@nestjs/common';

// ─── Helper: instantiate PkkmbService dengan mock minimal ──────────────────
// Constructor 17 param — mock hanya untuk dependency yang dipakai method yang
// ditest (userModel, sessionModel, logModel, redis). Sisanya null.

interface TestUser {
  _id: Types.ObjectId;
  division?: string;
  role?: {
    slug: string;
    permissions?: { name: string }[];
  };
}

function buildService(overrides: {
  user?: TestUser | null;
  session?: unknown;
  record?: unknown;
}) {
  const userModel = {
    findById: jest.fn().mockImplementation((id?: string) => ({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(
            // userId kosong/undefined -> user tak ditemukan (Forbidden).
            id ? (overrides.user ?? null) : null,
          ),
        }),
      }),
    })),
  } as never;

  // findById: service ada yang memanggil langsung `await findById()`
  // (updateAttendanceSessionStatus) dan ada yang `findById().exec()`
  // (checkIn). Mock resolve langsung (bukan chain {exec}) agar keduanya
  // berperilaku sama: await -> overrides.session.
  const sessionModel = {
    create: jest.fn().mockResolvedValue(overrides.session ?? {}),
    findById: jest.fn().mockResolvedValue(overrides.session ?? null),
  };

  const logModel = {
    findByIdAndDelete: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(overrides.record ?? null),
    }),
    findById: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(overrides.record ?? null),
      }),
    }),
  };

  const redis = {
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(1),
  } as never;

  const svc = new PkkmbService(
    userModel,
    {} as never,
    {} as never,
    sessionModel as never,
    logModel as never,
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
  return { svc: svc, sessionModel, logModel };
}

// ─── Data helper ───────────────────────────────────────────────────────────

const OID = () => new Types.ObjectId();

function panitia(division: string): TestUser {
  return {
    _id: OID(),
    division,
    role: { slug: 'panitia', permissions: [{ name: 'pkkmb.monitoring.read' }] },
  };
}

const sekretaris: TestUser = {
  _id: OID(),
  division: 'Inti',
  role: {
    slug: 'sekretaris',
    permissions: [{ name: 'pkkmb.attendance.session_create' }],
  },
};

const superAdmin: TestUser = {
  _id: OID(),
  division: 'SuperAdmin',
  role: { slug: 'super_admin', permissions: [{ name: 'manage:all' }] },
};

const maba: TestUser = {
  _id: OID(),
  division: 'Peserta',
  role: { slug: 'user', permissions: [] },
};

const pimpinan: TestUser = {
  _id: OID(),
  division: 'Pimpinan',
  role: { slug: 'pimpinan', permissions: [{ name: 'pkkmb.monitoring.read' }] },
};

const bendahara: TestUser = {
  _id: OID(),
  division: 'Inti',
  role: { slug: 'bendahara', permissions: [{ name: 'pkkmb.monitoring.read' }] },
};

const sessionDto = {
  title: 'Sesi Uji RBAC',
  date: '2026-08-11',
  startTime: '2026-08-11T08:00',
  endTime: '2026-08-11T09:00',
  location: 'Gedung Dekanat',
  isOnline: true,
} as never;

const newSession = () => ({
  _id: OID(),
  title: 'Sesi Uji RBAC',
  status: 'PUBLISHED',
});

// ─── MATRIX: CREATE (POST /attendance/sessions) ────────────────────────────

describe('RBAC Absensi Panitia — CREATE sesi', () => {
  it('KSK (panitia + division Sie KSK) boleh membuat sesi', async () => {
    const { svc, sessionModel } = buildService({
      user: panitia('Sie KSK'),
      session: newSession(),
    });
    await expect(
      svc.createAttendanceSession(OID().toString(), sessionDto),
    ).resolves.toBeTruthy();
    expect(sessionModel.create).toHaveBeenCalled();
  });

  it('Panitia Sie Acara -> 403 Forbidden', async () => {
    const { svc, sessionModel } = buildService({ user: panitia('Sie Acara') });
    await expect(
      svc.createAttendanceSession(OID().toString(), sessionDto),
    ).rejects.toThrow(ForbiddenException);
    expect(sessionModel.create).not.toHaveBeenCalled();
  });

  it('Panitia Sie Humas -> 403 Forbidden', async () => {
    const { svc } = buildService({ user: panitia('Sie Humas') });
    await expect(
      svc.createAttendanceSession(OID().toString(), sessionDto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('Panitia Sie Pendamping -> 403 Forbidden', async () => {
    const { svc } = buildService({ user: panitia('Sie Pendamping') });
    await expect(
      svc.createAttendanceSession(OID().toString(), sessionDto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('Sekretaris tetap boleh (permission existing tidak rusak)', async () => {
    const { svc } = buildService({ user: sekretaris, session: newSession() });
    await expect(
      svc.createAttendanceSession(OID().toString(), sessionDto),
    ).resolves.toBeTruthy();
  });

  it('Super Admin boleh', async () => {
    const { svc } = buildService({ user: superAdmin, session: newSession() });
    await expect(
      svc.createAttendanceSession(OID().toString(), sessionDto),
    ).resolves.toBeTruthy();
  });

  it('Pimpinan -> 403 (tidak punya hak kelola)', async () => {
    const { svc } = buildService({ user: pimpinan });
    await expect(
      svc.createAttendanceSession(OID().toString(), sessionDto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('Bendahara -> 403', async () => {
    const { svc } = buildService({ user: bendahara });
    await expect(
      svc.createAttendanceSession(OID().toString(), sessionDto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('Maba -> 403', async () => {
    const { svc } = buildService({ user: maba });
    await expect(
      svc.createAttendanceSession(OID().toString(), sessionDto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('User tidak ditemukan (unauthenticated) -> 403', async () => {
    const { svc } = buildService({ user: null });
    await expect(
      svc.createAttendanceSession(OID().toString(), sessionDto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('Division manipulation via body TIDAK berpengaruh (division dari DB)', async () => {
    // Panitia Sie Acara mengirim body berisi division KSK — service TIDAK
    // menerima division dari body; identity dari JWT, division dari DB.
    // Catatan: `role: 'ksk'` di body adalah PERCOBAAN SPOOF — TIDAK ada role
    // 'ksk' di sistem (KSK = division dalam role panitia); service mengabaikannya.
    const { svc, sessionModel } = buildService({ user: panitia('Sie Acara') });
    const evilDto = {
      ...(sessionDto as object),
      division: 'Sie KSK',
      role: 'ksk',
    } as never;
    await expect(
      svc.createAttendanceSession(OID().toString(), evilDto),
    ).rejects.toThrow(ForbiddenException);
    expect(sessionModel.create).not.toHaveBeenCalled();
  });

  it('Role manipulation via body TIDAK berpengaruh (role dari DB)', async () => {
    const { svc } = buildService({ user: panitia('Sie Humas') });
    const evilDto = { ...(sessionDto as object), role: 'super_admin' } as never;
    await expect(
      svc.createAttendanceSession(OID().toString(), evilDto),
    ).rejects.toThrow(ForbiddenException);
  });
});

// ─── MATRIX: UPDATE status sesi ────────────────────────────────────────────

describe('RBAC Absensi Panitia — UPDATE status sesi', () => {
  const sessionDoc = () => ({
    _id: OID(),
    title: 'Sesi',
    status: 'DRAFT',
    save: jest
      .fn()
      .mockResolvedValue({ _id: OID(), title: 'Sesi', status: 'PUBLISHED' }),
  });

  it('KSK boleh mengubah status', async () => {
    const { svc } = buildService({
      user: panitia('Sie KSK'),
      session: sessionDoc(),
    });
    await expect(
      svc.updateAttendanceSessionStatus(
        OID().toString(),
        'PUBLISHED',
        OID().toString(),
      ),
    ).resolves.toBeTruthy();
  });

  it('Panitia non-KSK -> 403', async () => {
    const { svc } = buildService({
      user: panitia('Sie Acara'),
      session: sessionDoc(),
    });
    await expect(
      svc.updateAttendanceSessionStatus(
        OID().toString(),
        'PUBLISHED',
        OID().toString(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});

// ─── MATRIX: VERIFY izin/sakit ─────────────────────────────────────────────

describe('RBAC Absensi Panitia — VERIFY izin/sakit', () => {
  const izinRecord = () => ({
    _id: OID(),
    izinStatus: 'PENDING',
    status: 'Izin',
    save: jest.fn().mockResolvedValue({}),
  });

  it('KSK boleh approve izin', async () => {
    const { svc } = buildService({
      user: panitia('Sie KSK'),
      record: izinRecord(),
    });
    const res = await svc.verifyIzin(
      OID().toString(),
      'APPROVED',
      OID().toString(),
    );
    expect(res.izinStatus).toBe('APPROVED');
  });

  it('KSK boleh reject izin (status jadi Tidak Hadir)', async () => {
    const { svc } = buildService({
      user: panitia('Sie KSK'),
      record: izinRecord(),
    });
    const res = await svc.verifyIzin(
      OID().toString(),
      'REJECTED',
      OID().toString(),
    );
    expect(res.izinStatus).toBe('REJECTED');
    expect(res.status).toBe('Tidak Hadir');
  });

  it('Panitia non-KSK -> 403 (read-only)', async () => {
    const { svc } = buildService({
      user: panitia('Sie Humas'),
      record: izinRecord(),
    });
    await expect(
      svc.verifyIzin(OID().toString(), 'APPROVED', OID().toString()),
    ).rejects.toThrow(ForbiddenException);
  });

  it('Sekretaris boleh verify (existing tidak rusak)', async () => {
    const { svc } = buildService({ user: sekretaris, record: izinRecord() });
    await expect(
      svc.verifyIzin(OID().toString(), 'APPROVED', OID().toString()),
    ).resolves.toBeTruthy();
  });
});

// ─── MATRIX: DELETE record presensi ────────────────────────────────────────

describe('RBAC Absensi Panitia — DELETE record presensi', () => {
  it('KSK (panitia + division Sie KSK) TIDAK boleh hapus — delete = admin only', async () => {
    const { svc, logModel } = buildService({
      user: panitia('Sie KSK'),
      record: { _id: OID(), status: 'Hadir' },
    });
    await expect(
      svc.deleteAttendanceRecord(OID().toString(), OID().toString()),
    ).rejects.toThrow(ForbiddenException);
    expect(logModel.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('Panitia non-KSK -> 403', async () => {
    const { svc, logModel } = buildService({
      user: panitia('Sie Acara'),
      record: { _id: OID(), status: 'Hadir' },
    });
    await expect(
      svc.deleteAttendanceRecord(OID().toString(), OID().toString()),
    ).rejects.toThrow(ForbiddenException);
    expect(logModel.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('Super Admin boleh menghapus record', async () => {
    const { svc } = buildService({
      user: superAdmin,
      record: { _id: OID(), status: 'Hadir' },
    });
    await expect(
      svc.deleteAttendanceRecord(OID().toString(), OID().toString()),
    ).resolves.toBeTruthy();
  });
});

// ─── IDOR / MANIPULATION ───────────────────────────────────────────────────

describe('RBAC Absensi Panitia — IDOR & manipulasi identitas', () => {
  it('Tanpa actorId (identitas JWT) semua aksi write DITOLAK — bukan dilewati', async () => {
    // Defense-in-depth: actorId adalah parameter WAJIB. Jika caller lupa
    // mengirim identitas, service harus menolak (bukan menjalankan aksi tanpa
    // otorisasi). Cast untuk menguji panggilan tanpa actorId.
    const { svc, sessionModel, logModel } = buildService({
      user: panitia('Sie KSK'),
      session: newSession(),
      record: { _id: OID(), status: 'Hadir', izinStatus: 'PENDING' },
    });
    const svcAny = svc as unknown as {
      createAttendanceSession: (u: string, d: unknown) => Promise<unknown>;
      updateAttendanceSessionStatus: (
        s: string,
        st: string,
        a?: string,
      ) => Promise<unknown>;
      verifyIzin: (r: string, d: string, a?: string) => Promise<unknown>;
      deleteAttendanceRecord: (id: string, a?: string) => Promise<unknown>;
    };

    // createAttendanceSession selalu butuh userId (sudah required) — cek 403
    // saat user tak dikenal, bukan eksekusi.
    await expect(
      svcAny.createAttendanceSession('', sessionDto),
    ).rejects.toThrow(ForbiddenException);
    // Method lain: actorId undefined -> Forbidden, dan tidak ada efek pada model.
    await expect(
      svcAny.updateAttendanceSessionStatus(OID().toString(), 'PUBLISHED'),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      svcAny.verifyIzin(OID().toString(), 'APPROVED'),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      svcAny.deleteAttendanceRecord(OID().toString()),
    ).rejects.toThrow(ForbiddenException);
    expect(sessionModel.create).not.toHaveBeenCalled();
    expect(logModel.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('KSK check case-insensitive (division "ksk" / "Sie KSK" / "KSK")', async () => {
    for (const div of ['KSK', 'ksk', 'Sie KSK']) {
      const { svc } = buildService({
        user: panitia(div),
        session: newSession(),
      });
      await expect(
        svc.createAttendanceSession(OID().toString(), sessionDto),
      ).resolves.toBeTruthy();
    }
  });
});
