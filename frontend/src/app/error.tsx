'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center p-6 bg-slate-50 dark:bg-[#040914] text-foreground">
      <h2 className="text-2xl font-bold text-red-600 dark:text-red-500">Terjadi Kesalahan</h2>
      <p className="text-sm text-foreground/70 max-w-md">{error.message || "Terdapat masalah pada sistem."}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-md"
      >
        Coba Lagi
      </button>
    </div>
  );
}
