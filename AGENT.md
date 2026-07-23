# Agent Guidelines

1. **Auto Commit & Push:** Setiap kali ada perubahan kode atau konfigurasi yang berhasil diimplementasikan dan diverifikasi, AI agent WAJIB langsung melakukan `git commit` dan `git push` ke repository secara otomatis tanpa harus diminta.
2. **Pre-Commit Verification:** Sebelum melakukan `git commit`, agent WAJIB menjalankan `npm run lint` (jika tersedia) di direktori terkait (misal di folder `pkkmb` atau `backend`) untuk memastikan tidak ada error *linting* (seperti unused variables, implicit any, dsb).
3. **No Unused Variables/Imports:** Bersihkan semua *import* atau variabel yang didefinisikan namun tidak pernah digunakan.
4. **No Console Logs:** Hapus `console.log` yang tidak perlu sebelum *commit*.
---

# TypeScript Type Safety Policy (Mandatory)

Type safety is a non-negotiable requirement across the entire codebase.

## Dilarang menggunakan `as any`

- Jangan pernah menggunakan `as any` untuk mengatasi error TypeScript.
- Jangan menonaktifkan type checking dengan `// @ts-ignore` atau `// @ts-expect-error` kecuali benar-benar diperlukan dan disertai alasan yang jelas.
- Selalu selesaikan masalah tipe dengan pendekatan yang type-safe.

### Alternatif yang wajib digunakan

Prioritaskan pendekatan berikut (urut berdasarkan preferensi):

1. Perbaiki definisi tipe agar sesuai.
2. Gunakan type narrowing (`if`, `in`, `instanceof`, type predicate).
3. Gunakan Generic Type.
4. Gunakan Union atau Discriminated Union.
5. Gunakan `unknown` kemudian lakukan validasi sebelum digunakan.
6. Buat interface atau type baru apabila diperlukan.
7. Gunakan assertion yang spesifik (misalnya `as User`) hanya jika memang dapat dibuktikan aman.

### Review Rule

Setiap penggunaan:
- `as any`
- `: any`
- `@ts-ignore`
- `@ts-expect-error`

dianggap sebagai code smell dan tidak boleh dimasukkan ke dalam implementasi kecuali tidak ada alternatif yang memungkinkan. Jika memang terpaksa digunakan, agen wajib menjelaskan alasan teknisnya pada hasil implementasi.

**Goal:** Seluruh kode baru harus mempertahankan type safety dan tetap lolos `strict` TypeScript tanpa menggunakan `as any` sebagai jalan pintas.

## Required Practices

- Always define explicit interfaces or types.
- Prefer `interface` for object contracts.
- Use `type` where appropriate for unions, intersections, and utility types.
- Prefer `unknown` over `any` when the type cannot be known immediately.
- Narrow `unknown` using proper type guards before use.
- Create reusable shared types instead of duplicating definitions.
- Infer types whenever TypeScript can safely infer them.
- Use generics instead of `any`.
- Use discriminated unions when handling multiple object variants.
- Ensure every exported function has explicit parameter and return types.
- Ensure every public API has well-defined types.
- Ensure every React component has properly typed props.
- Ensure every hook has explicit return types where beneficial.
- Ensure every async function returns a concrete `Promise<T>`.

## Existing Code

If `any` already exists:

1. Identify every occurrence.
2. Replace it with the correct type.
3. Create new interfaces if necessary.
4. Refactor the surrounding code to preserve full type safety.
5. Do not leave temporary `TODO` types.

## Pull Request Standard

Every implementation must pass the following checklist before completion:

- Zero `any`
- Zero `as any`
- Zero ignored TypeScript errors
- Zero unsafe casts
- Zero weakened types
- Strict TypeScript compatibility
- No regression in type safety

Code is not considered complete until these conditions are satisfied.

This policy is mandatory and applies to every file in the repository without exception.
