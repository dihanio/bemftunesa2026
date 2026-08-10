"use client";

import React from "react";

export const WIB_TZ = "Asia/Jakarta";

export function formatWIB(
  iso: string | number | Date,
  opts: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB_TZ,
    timeZoneName: "short",
    ...opts,
  }).format(new Date(iso));
}

export function formatWIBLong(iso: string | number | Date): string {
  return formatWIB(iso, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type PeriodStatus = "belum" | "aktif" | "tutup";

export function getPeriodStatus(
  now: number,
  startTime?: string,
  endTime?: string
): PeriodStatus {
  if (!startTime || !endTime) return "tutup";
  if (now < Date.parse(startTime)) return "belum";
  if (now > Date.parse(endTime)) return "tutup";
  return "aktif";
}

export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = React.useState(Date.now);
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
