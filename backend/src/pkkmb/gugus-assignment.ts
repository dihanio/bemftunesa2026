// Algoritma pemilihan gugus untuk penempatan maba (onboarding & rebalance).
//
// Kebijakan PKKMB FT UNESA 2026:
//   1. Setiap gugus harus berisi anggota dari semua Program Studi yang ada
//      (persebaran prodi adalah prioritas tertinggi).
//   2. Komposisi cowo/cewe di SETIAP gugus harus seimbang (rata global per
//      gugus, bukan hanya per prodi).  Untuk itu skor memakai `genderGapN`
//      yang BERARAH sesuai gender maba yang sedang ditempatkan:
//        genderGapN = (jumlah sesama gender) - (jumlah lawan gender) di gugus
//      Semakin kecil (bisa negatif) → gugus sedang "kekurangan" gender maba
//      → maba ditempatkan ke sana, sehingga selisih cowo-cewe tiap gugus
//      mengecil.  Contoh: gugus dengan 5 cowo 0 cewe → untuk maba cewe
//      genderGapN = 0 - 5 = -5 (sangat menarik); untuk maba cowo = +5.
//   3. Total anggota per gugus tetap seimbang (tie-break terakhir).
//
// Skor lebih kecil = gugus lebih seimbang:
//   score = prodiN * PRODI_WEIGHT
//         + genderGapN * GENDER_GAP_WEIGHT
//         + sameGenderProdiN * SAME_GENDER_PRODI_WEIGHT
//         + totalN * TOTAL_WEIGHT
//   - prodiN           : jumlah anggota sesama prodi di gugus (bobot tertinggi)
//   - genderGapN       : selisih berarah (sesamaGender - lawanGender), dihitung
//                        pemanggil sesuai gender maba (bobot #2 → rata per gugus)
//   - sameGenderProdiN : jumlah anggota sesama prodi DAN sesama gender
//                        (fine-tuning agar dalam satu prodi juga tersebar)
//   - totalN           : total anggota gugus (tie-break)
//
// Bobot dibuat LEXIKOGRAFIS ketat (dengan kapasitas gugus ≤ 99 anggota):
//   - 1 unit prodiN (10000) > selisih maksimum genderGapN (99 × 100 = 9900)
//   - 1 unit genderGapN (100) > selisih maksimum sameGenderProdiN/totalN
//     (99 × 1 = 99)
// sehingga prioritas #1, #2, dan tie-break tidak pernah saling mendahului.

export interface GugusBalanceCounts {
  prodiN: number;
  sameGenderProdiN: number;
  /** Selisih berarah: (sesama gender) - (lawan gender) di gugus, relatif gender maba. */
  genderGapN: number;
  totalN: number;
}

export const PRODI_WEIGHT = 10_000;
export const GENDER_GAP_WEIGHT = 100;
export const SAME_GENDER_PRODI_WEIGHT = 1;
export const TOTAL_WEIGHT = 1;

export const EMPTY_COUNTS: GugusBalanceCounts = {
  prodiN: 0,
  sameGenderProdiN: 0,
  genderGapN: 0,
  totalN: 0,
};

export function gugusBalanceScore(counts: GugusBalanceCounts): number {
  return (
    counts.prodiN * PRODI_WEIGHT +
    counts.genderGapN * GENDER_GAP_WEIGHT +
    counts.sameGenderProdiN * SAME_GENDER_PRODI_WEIGHT +
    counts.totalN * TOTAL_WEIGHT
  );
}

/**
 * Pilih gugus dengan skor keseimbangan terkecil dari daftar kandidat.
 *
 * Kebijakan distribusi: jangan pernah menumpuk maba ke gugus dengan nomor
 * kecil hanya karena urutannya kebetulan lebih dulu. Karena itu, bila beberapa
 * gugus memiliki skor keseimbangan TERENDAH yang sama (mis. saat semua masih
 * kosong), kita memilih secara ACAK di antara kandidat terbaik tsb — bukan
 * selalu kandidat pertama. Keseimbangan prodi & gender tetap terjaga karena
 * pilihan selalu dibatasi pada gugus dengan skor minimum.
 *
 * `random` (Math.random secara default) memungkinkan pengujian yang
 * deterministik lewat injeksi seed/urutan tetap.
 *
 * Kandidat wajib memiliki `id` (string). Mengembalikan kandidat asli (supaya
 * pemanggil tetap memegang referensi `_id`), atau `null` bila daftar kosong.
 */
export function pickBestGugus<T extends { id: string }>(
  candidates: T[],
  countsByGugus: Map<string, GugusBalanceCounts>,
  random: () => number = Math.random,
): T | null {
  if (!candidates || candidates.length === 0) return null;
  let bestScore = Infinity;
  let bestCandidates: T[] = [];
  for (const g of candidates) {
    const counts = countsByGugus.get(g.id) ?? EMPTY_COUNTS;
    const score = gugusBalanceScore(counts);
    if (score < bestScore) {
      bestScore = score;
      bestCandidates = [g];
    } else if (score === bestScore) {
      bestCandidates.push(g);
    }
  }
  if (bestCandidates.length === 0) return null;
  // Random tie-break: pilih satu di antara gugus dengan skor minimum.
  const idx = Math.min(
    bestCandidates.length - 1,
    Math.floor(random() * bestCandidates.length),
  );
  return bestCandidates[idx];
}

// ─── HELPERS BERBAGI (dipakai pkkmb.service.ts & health.service.ts) ────────

/** Bentuk baris agregasi hitungan (total / per-prodi / per-prodi+gender). */
export interface CountAggRow {
  _id: { toString(): string };
  n: number;
}

/** Bentuk baris agregasi hitungan per (gugus, gender). */
export interface GenderCountAggRow {
  _id: { g: { toString(): string }; gender: string };
  n: number;
}

/**
 * Bangun peta `gugusId -> GugusBalanceCounts` dari 4 hasil agregasi MongoDB.
 * `gender` adalah gender maba yang sedang ditempatkan ('L'/'P') — menentukan
 * arah `genderGapN` (sesama gender − lawan gender). Pemakaian helper ini di
 * kedua service menjamin kedua salinan `assignMabaToGroup` selalu identik.
 */
export function buildCountsByGugus(params: {
  totalAgg: CountAggRow[];
  prodiAgg: CountAggRow[];
  genderProdiAgg: CountAggRow[];
  genderAgg: GenderCountAggRow[];
  gender: 'L' | 'P';
}): Map<string, GugusBalanceCounts> {
  const { totalAgg, prodiAgg, genderProdiAgg, genderAgg, gender } = params;

  const toMap = (agg: CountAggRow[]): Map<string, number> => {
    const map = new Map<string, number>();
    agg.forEach((r) => map.set(r._id.toString(), r.n));
    return map;
  };

  const totalMap = toMap(totalAgg);
  const prodiMap = toMap(prodiAgg);
  const genderProdiMap = toMap(genderProdiAgg);

  const maleMap = new Map<string, number>();
  const femaleMap = new Map<string, number>();
  genderAgg.forEach((r) => {
    const gid = r._id.g.toString();
    if (r._id.gender === 'P') femaleMap.set(gid, r.n);
    else maleMap.set(gid, r.n);
  });

  // Union semua id gugus yang muncul di agregasi mana pun.
  const allIds = new Set<string>([
    ...totalMap.keys(),
    ...prodiMap.keys(),
    ...genderProdiMap.keys(),
    ...maleMap.keys(),
    ...femaleMap.keys(),
  ]);

  const result = new Map<string, GugusBalanceCounts>();
  allIds.forEach((gid) => {
    const maleN = maleMap.get(gid) || 0;
    const femaleN = femaleMap.get(gid) || 0;
    const sameGenderN = gender === 'P' ? femaleN : maleN;
    const oppositeN = gender === 'P' ? maleN : femaleN;
    result.set(gid, {
      prodiN: prodiMap.get(gid) || 0,
      sameGenderProdiN: genderProdiMap.get(gid) || 0,
      genderGapN: sameGenderN - oppositeN,
      totalN: totalMap.get(gid) || 0,
    });
  });

  return result;
}

/**
 * Simulasi penempatan sekumpulan maba ke gugus (algoritma sama persis dengan
 * penempatan satu-per-satu di `assignMabaToGroup`), dipakai `rebalanceGugus`
 * dan `autoDistributeGugus` supaya semua jalur menghasilkan komposisi yang
 * sama: semua prodi tersebar + cowo/cewe rata per gugus.
 *
 * Mengembalikan peta `mabaId -> value gugus` (mis. Types.ObjectId).
 */
export function simulateGugusAssignment<T>(
  gugus: Array<{ id: string; value: T }>,
  maba: Array<{ id: string; prodi: string; gender: 'L' | 'P' }>,
): Map<string, T> {
  const assignments = new Map<string, T>();
  if (gugus.length === 0) return assignments;

  type GugusState = {
    male: number;
    female: number;
    total: number;
    prodi: Map<string, number>;
    prodiGender: Map<string, number>;
  };
  const state = new Map<string, GugusState>();
  gugus.forEach((g) => {
    state.set(g.id, {
      male: 0,
      female: 0,
      total: 0,
      prodi: new Map(),
      prodiGender: new Map(),
    });
  });

  for (const m of maba) {
    const countsByGugus = new Map<string, GugusBalanceCounts>();
    gugus.forEach((g) => {
      const s = state.get(g.id);
      if (!s) return;
      const sameGenderN = m.gender === 'P' ? s.female : s.male;
      const oppositeN = m.gender === 'P' ? s.male : s.female;
      countsByGugus.set(g.id, {
        prodiN: s.prodi.get(m.prodi) || 0,
        sameGenderProdiN: s.prodiGender.get(`${m.prodi}__${m.gender}`) || 0,
        genderGapN: sameGenderN - oppositeN,
        totalN: s.total,
      });
    });

    const best = pickBestGugus(gugus, countsByGugus);
    if (!best) continue;
    assignments.set(m.id, best.value);

    const s = state.get(best.id);
    if (!s) continue;
    s.total += 1;
    if (m.gender === 'P') s.female += 1;
    else s.male += 1;
    s.prodi.set(m.prodi, (s.prodi.get(m.prodi) || 0) + 1);
    s.prodiGender.set(
      `${m.prodi}__${m.gender}`,
      (s.prodiGender.get(`${m.prodi}__${m.gender}`) || 0) + 1,
    );
  }

  return assignments;
}
