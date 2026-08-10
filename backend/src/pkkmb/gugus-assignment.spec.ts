import {
  gugusBalanceScore,
  pickBestGugus,
  EMPTY_COUNTS,
  PRODI_WEIGHT,
  GENDER_GAP_WEIGHT,
  SAME_GENDER_PRODI_WEIGHT,
  TOTAL_WEIGHT,
  GugusBalanceCounts,
} from './gugus-assignment';

describe('gugus-assignment — skor keseimbangan', () => {
  it('prodiN memiliki bobot tertinggi (persebaran prodi prioritas #1)', () => {
    // Gugus dengan 0 anggota prodi sama tetapi total besar HARUS lebih baik
    // daripada gugus dengan 1 anggota prodi sama walau total kecil.
    const emptyProdi = gugusBalanceScore({
      prodiN: 0,
      sameGenderProdiN: 0,
      genderGapN: 0,
      totalN: 60,
    });
    const sameProdi = gugusBalanceScore({
      prodiN: 1,
      sameGenderProdiN: 0,
      genderGapN: 0,
      totalN: 2,
    });
    expect(emptyProdi).toBeLessThan(sameProdi);
  });

  it('genderGapN berarah (bisa negatif) berada di urutan kedua (rata cowo/cewe per gugus)', () => {
    // Prodi sama, total sama → gugus yang "kekurangan" gender maba (gap negatif)
    // menang atas gugus yang sudah kebanyakan gender maba (gap positif).
    const gapNegatif = gugusBalanceScore({
      prodiN: 2,
      sameGenderProdiN: 1,
      genderGapN: -5,
      totalN: 10,
    });
    const gapPositif = gugusBalanceScore({
      prodiN: 2,
      sameGenderProdiN: 1,
      genderGapN: 5,
      totalN: 10,
    });
    expect(gapNegatif).toBeLessThan(gapPositif);
  });

  it('gap negatif lebih baik walau sameGenderProdiN lebih besar (gender global > fine-tuning prodi)', () => {
    // Gugus A: 1 sesama prodi+gender tapi gap -3 → menang atas gugus B yang
    // 0 sesama prodi+gender tapi gap +2, karena gap berarah mendominasi.
    const a = gugusBalanceScore({
      prodiN: 1,
      sameGenderProdiN: 1,
      genderGapN: -3,
      totalN: 5,
    });
    const b = gugusBalanceScore({
      prodiN: 1,
      sameGenderProdiN: 0,
      genderGapN: 2,
      totalN: 5,
    });
    expect(a).toBeLessThan(b);
  });

  it('sameGenderProdiN sebagai fine-tuning setelah genderGapN', () => {
    // Prodi & gap sama → gugus dengan sesama prodi+gender lebih sedikit menang.
    const a = gugusBalanceScore({
      prodiN: 2,
      sameGenderProdiN: 0,
      genderGapN: 1,
      totalN: 10,
    });
    const b = gugusBalanceScore({
      prodiN: 2,
      sameGenderProdiN: 2,
      genderGapN: 1,
      totalN: 10,
    });
    expect(a).toBeLessThan(b);
  });

  it('totalN sebagai tie-break terakhir', () => {
    const a = gugusBalanceScore({
      prodiN: 1,
      sameGenderProdiN: 1,
      genderGapN: 0,
      totalN: 5,
    });
    const b = gugusBalanceScore({
      prodiN: 1,
      sameGenderProdiN: 1,
      genderGapN: 0,
      totalN: 9,
    });
    expect(a).toBeLessThan(b);
  });

  it('bobot eksplisit: score = prodiN*10000 + gapN*100 + sameProdi*10 + totalN', () => {
    const counts: GugusBalanceCounts = {
      prodiN: 2,
      sameGenderProdiN: 3,
      genderGapN: -4,
      totalN: 4,
    };
    expect(gugusBalanceScore(counts)).toBe(
      2 * PRODI_WEIGHT +
        -4 * GENDER_GAP_WEIGHT +
        3 * SAME_GENDER_PRODI_WEIGHT +
        4 * TOTAL_WEIGHT,
    );
  });

  it('EMPTY_COUNTS bernilai nol semua', () => {
    expect(EMPTY_COUNTS).toEqual({
      prodiN: 0,
      sameGenderProdiN: 0,
      genderGapN: 0,
      totalN: 0,
    });
  });
});

describe('gugus-assignment — pickBestGugus', () => {
  const g1 = { id: 'g1', nomor: 1 };
  const g2 = { id: 'g2', nomor: 2 };
  const g3 = { id: 'g3', nomor: 3 };

  const counts = new Map<string, GugusBalanceCounts>([
    ['g1', { prodiN: 2, sameGenderProdiN: 2, genderGapN: 0, totalN: 30 }],
    ['g2', { prodiN: 0, sameGenderProdiN: 0, genderGapN: 0, totalN: 25 }],
    ['g3', { prodiN: 1, sameGenderProdiN: 0, genderGapN: 1, totalN: 20 }],
  ]);

  it('memilih gugus dengan skor terkecil (g2)', () => {
    expect(pickBestGugus([g1, g2, g3], counts)?.id).toBe('g2');
  });

  it('memilih gugus dengan genderGapN negatif (kekurangan gender maba)', () => {
    const skewed = new Map<string, GugusBalanceCounts>([
      ['g1', { prodiN: 1, sameGenderProdiN: 0, genderGapN: -3, totalN: 10 }],
      ['g2', { prodiN: 1, sameGenderProdiN: 0, genderGapN: 2, totalN: 10 }],
    ]);
    expect(pickBestGugus([g1, g2], skewed)?.id).toBe('g1');
  });

  it('kandidat tanpa entri counts diperlakukan sebagai kosong (bisa menang)', () => {
    const onlyG1 = pickBestGugus([g1], new Map());
    expect(onlyG1?.id).toBe('g1');
  });

  it('mengembalikan kandidat asli (referensi objek)', () => {
    const chosen = pickBestGugus([g1, g2], counts);
    expect(chosen).toBe(g2);
  });

  it('daftar kosong → null', () => {
    expect(pickBestGugus([], counts)).toBeNull();
  });

  it('tie-break deterministik: skor sama → kandidat pertama yang dipilih', () => {
    const same = new Map<string, GugusBalanceCounts>([
      ['g1', { prodiN: 1, sameGenderProdiN: 1, genderGapN: 0, totalN: 5 }],
      ['g2', { prodiN: 1, sameGenderProdiN: 1, genderGapN: 0, totalN: 5 }],
    ]);
    expect(pickBestGugus([g1, g2], same)?.id).toBe('g1');
  });
});

// ─── SIMULASI DISTRIBUSI GLOBAL ────────────────────────────────────────────
//
// Mensimulasikan alur nyata di service (menjaga hitungan per gugus di memori,
// lalu per maba memilih gugus via pickBestGugus). Verifikasi kebijakan:
//   (1) setiap gugus berisi semua prodi;
//   (2) komposisi cowo/cewe RATA di SETIAP gugus (selisih <= 1).
type SimMaba = { prodi: string; gender: 'L' | 'P' };

function simulate(maba: SimMaba[], gugusCount: number) {
  const gugus = Array.from({ length: gugusCount }, (_, i) => ({
    id: `g${i + 1}`,
    nomor: i + 1,
    male: 0,
    female: 0,
    total: 0,
    prodi: new Map<string, number>(),
    prodiGender: new Map<string, number>(),
  }));
  const assigned: string[] = [];

  for (const m of maba) {
    const countsByGugus = new Map<string, GugusBalanceCounts>();
    gugus.forEach((g) => {
      const sameGender = m.gender === 'P' ? g.female : g.male;
      const opposite = m.gender === 'P' ? g.male : g.female;
      countsByGugus.set(g.id, {
        prodiN: g.prodi.get(m.prodi) || 0,
        sameGenderProdiN: g.prodiGender.get(`${m.prodi}__${m.gender}`) || 0,
        genderGapN: sameGender - opposite,
        totalN: g.total,
      });
    });
    const best = pickBestGugus(gugus, countsByGugus);
    if (!best) throw new Error('tidak ada gugus');
    assigned.push(best.id);
    best.total += 1;
    if (m.gender === 'P') best.female += 1;
    else best.male += 1;
    best.prodi.set(m.prodi, (best.prodi.get(m.prodi) || 0) + 1);
    best.prodiGender.set(
      `${m.prodi}__${m.gender}`,
      (best.prodiGender.get(`${m.prodi}__${m.gender}`) || 0) + 1,
    );
  }

  return { gugus, assigned };
}

describe('gugus-assignment — simulasi distribusi global', () => {
  it('rata cowo/cewe SETIAP gugus walau prodi didominasi satu gender (masalah skor lama)', () => {
    // Prodi X: 8 cowo + 2 cewe; Prodi Y: 2 cowo + 8 cewe → 10 gugus.
    // Dengan skor lama (prodi→sameGenderProdi→total) hasil akhir beberapa
    // gugus menjadi timpang (2 cowo vs 2 cewe). Skor baru (genderGapN berarah)
    // harus menghasilkan selisih cowo-cewe <= 1 di SETIAP gugus.
    const maba: SimMaba[] = [
      ...Array.from({ length: 8 }, () => ({
        prodi: 'X',
        gender: 'L' as const,
      })),
      ...Array.from({ length: 2 }, () => ({
        prodi: 'X',
        gender: 'P' as const,
      })),
      ...Array.from({ length: 2 }, () => ({
        prodi: 'Y',
        gender: 'L' as const,
      })),
      ...Array.from({ length: 8 }, () => ({
        prodi: 'Y',
        gender: 'P' as const,
      })),
    ];
    const { gugus } = simulate(maba, 10);

    gugus.forEach((g) => {
      expect(Math.abs(g.male - g.female)).toBeLessThanOrEqual(1);
      expect(g.prodi.get('X') || 0).toBeGreaterThan(0);
      expect(g.prodi.get('Y') || 0).toBeGreaterThan(0);
    });

    // Sanity: total tetap.
    const total = gugus.reduce((acc, g) => acc + g.total, 0);
    expect(total).toBe(maba.length);
  });

  it('seimbang sempurna untuk komposisi 50:50', () => {
    const maba: SimMaba[] = [
      ...Array.from({ length: 20 }, () => ({
        prodi: 'Teknik Informatika',
        gender: 'L' as const,
      })),
      ...Array.from({ length: 20 }, () => ({
        prodi: 'Teknik Mesin',
        gender: 'P' as const,
      })),
    ];
    const { gugus } = simulate(maba, 10);
    gugus.forEach((g) => {
      expect(Math.abs(g.male - g.female)).toBeLessThanOrEqual(1);
    });
  });

  it('semua prodi tersebar ke semua gugus', () => {
    const prodis = ['A', 'B', 'C'];
    const maba: SimMaba[] = [];
    for (const p of prodis) {
      for (let i = 0; i < 6; i++) {
        maba.push({ prodi: p, gender: i % 2 === 0 ? 'L' : 'P' });
      }
    }
    const { gugus } = simulate(maba, 5);
    gugus.forEach((g) => {
      prodis.forEach((p) => expect(g.prodi.get(p) || 0).toBeGreaterThan(0));
    });
  });

  it('deterministik: input sama → hasil sama', () => {
    const build = () =>
      simulate(
        [
          ...Array.from({ length: 6 }, (_, i) => ({
            prodi: 'X',
            gender: i % 2 === 0 ? ('L' as const) : ('P' as const),
          })),
        ],
        4,
      );
    const a = build();
    const b = build();
    expect(a.assigned).toEqual(b.assigned);
  });
});
