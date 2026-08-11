import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value;
  const { pathname } = req.nextUrl;

  let res: NextResponse;

  // Protect /dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      res = NextResponse.redirect(loginUrl);
    } else {
      res = NextResponse.next();
    }
  }
  // Redirect authenticated users away from /login
  else if (pathname.startsWith("/login")) {
    if (token) {
      res = NextResponse.redirect(new URL("/dashboard", req.url));
    } else {
      res = NextResponse.next();
    }
  }
  // Halaman lain (landing, dll) — biarkan apa adanya
  else {
    res = NextResponse.next();
  }

  // Halaman auth TIDAK boleh di-cache (shared/browser). Tanpa header ini,
  // Next.js mengirim `Cache-Control: s-maxage=31536000` (1 tahun) untuk
  // halaman yang dirender statis. Jika browser/proxy menyimpan HTML lama yang
  // mereferensikan chunk dari build lama yang sudah dihapus dari image baru,
  // JS gagal dimuat → layar hitam. no-store memaksa selalu ambil HTML fresh.
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
