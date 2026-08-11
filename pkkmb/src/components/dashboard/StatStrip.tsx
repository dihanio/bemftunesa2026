"use client";

import Link from "next/link";
import { FileText, ClipboardList, Trophy } from "lucide-react";

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
      icon: <FileText className="w-5 h-5" />,
      href: "/dashboard/assignments",
      accent: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/25",
    },
    {
      label: "Quiz",
      value: `${quizDone}/${quizTotal}`,
      icon: <ClipboardList className="w-5 h-5" />,
      href: "/dashboard/assignments",
      accent: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/25",
    },
    {
      label: "Poin",
      value: points === null ? "…" : String(points),
      icon: <Trophy className="w-5 h-5" />,
      href: "/dashboard/poin",
      accent: "text-gold-400",
      bg: "bg-gold-500/10 border-gold-500/25",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => (
        <Link
          key={it.label}
          href={it.href}
          className={`rounded-2xl border p-4 transition-colors hover:bg-white/[0.06] ${it.bg}`}
        >
          <div className={`flex items-center gap-2 ${it.accent}`}>
            {it.icon}
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              {it.label}
            </span>
          </div>
          <p className={`mt-2 font-display text-2xl font-black ${it.accent}`}>
            {it.value}
          </p>
        </Link>
      ))}
    </div>
  );
}
