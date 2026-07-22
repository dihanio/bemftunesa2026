# Agent Guidelines

1. **Auto Commit & Push:** Setiap kali ada perubahan kode atau konfigurasi yang berhasil diimplementasikan dan diverifikasi, AI agent WAJIB langsung melakukan `git commit` dan `git push` ke repository secara otomatis tanpa harus diminta.
2. **Pre-Commit Verification:** Sebelum melakukan `git commit`, agent WAJIB menjalankan `npm run lint` (jika tersedia) di direktori terkait (misal di folder `pkkmb` atau `backend`) untuk memastikan tidak ada error *linting* (seperti unused variables, implicit any, dsb).
3. **No Unused Variables/Imports:** Bersihkan semua *import* atau variabel yang didefinisikan namun tidak pernah digunakan.
4. **No Console Logs:** Hapus `console.log` yang tidak perlu sebelum *commit*.
---

# TypeScript Type Safety Policy (Mandatory)

Type safety is a non-negotiable requirement across the entire codebase.

## Rules

- Never use `any`.
- Never use `as any`.
- Never use `Array<any>`.
- Never use `Promise<any>`.
- Never use `Record<string, any>`.
- Never disable TypeScript errors to bypass typing.
- Never suppress type errors using `// @ts-ignore` or `// @ts-expect-error` unless explicitly approved.
- Never weaken existing types to make code compile.

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
