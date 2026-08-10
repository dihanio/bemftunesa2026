// NEXT_PUBLIC_API_URL shared across apps may include the trailing /api/v1
// (used by frontend/ims). pkkmb appends /api/v1 itself, so strip it here to
// avoid a doubled prefix (e.g. /api/v1/api/v1/auth/google).
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/api\/v1\/?$/, "");

// ─── apiFetch: fetch dengan auto-refresh pada 401/403 ─────────────────────
// Permissions di-embed ke JWT saat login. Jika admin menambah/mengubah
// permission role setelah user login (mis. pkkmb.quiz.read untuk maba),
// token lama belum membawanya → backend balas 403 "Akses ditolak: Anda tidak
// memiliki izin [...]". Endpoint /auth/refresh membaca permission FRESH dari
// database, jadi refresh sekali lalu retry menyelesaikan kasus ini tanpa
// user harus logout/login ulang.
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const doFetch = () =>
    fetch(`${API_URL}/api/v1${path}`, {
      credentials: "include",
      ...options,
    });

  let res = await doFetch();

  // 401 = token kadaluarsa/hilang, 403 = permission belum ada di token lama.
  // Coba refresh sekali (single-flight untuk request konkuren) lalu retry.
  // Jika masih 401/403 setelah retry, biarkan respons asli — halaman yang
  // menangani (mis. redirect ke /login atau tampilkan error permission).
  if (res.status === 401 || res.status === 403) {
    if (await refreshSession()) {
      res = await doFetch();
    }
  }
  return res;
}
