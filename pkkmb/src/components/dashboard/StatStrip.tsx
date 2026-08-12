"use client";

import Link from "next/link";

interface StatStripProps {
  taskSubmitted: number;
  taskTotal: number;
  quizDone: number;
  quizTotal: number;
  points: number | null;
}

export default function StatStrip({
  taskSubmitted,
  taskTotal,
  quizDone,
  quizTotal,
  points,
}: StatStripProps) {
  const items = [
    {
      label: "Tugas",
      value: `${taskSubmitted}/${taskTotal}`,
      href: "/dashboard/assignments",
      accent: "text-blue-400",
      bar: "bg-blue-400",
      border: "border-blue-500/20",
    },
    {
      label: "Quiz",
      value: `${quizDone}/${quizTotal}`,
      href: "/dashboard/assignments",
      accent: "text-purple-300",
      bar: "bg-purple-400",
      border: "border-purple-500/20",
    },
    {
      label: "Poin",
      value: points === null ? "…" : String(points),
      href: "/dashboard/poin",
      accent: "text-gold-400",
      bar: "bg-gold-400",
      border: "border-gold-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => (
        <Link
          key={it.label}
          href={it.href}
          className={`relative overflow-hidden rounded-2xl border p-4 transition-colors hover:bg-white/[0.06] ${it.border}`}
        >
          <span
            className={`absolute left-0 top-0 h-full w-1 ${it.bar}`}
            aria-hidden="true"
          />
          <p
            className={`text-xs font-bold uppercase tracking-wider ${it.accent}`}
          >
            {it.label}
          </p>
          <p className={`mt-2 font-display text-2xl font-black ${it.accent}`}>
            {it.value}
          </p>
        </Link>
      ))}
    </div>
  );
}
