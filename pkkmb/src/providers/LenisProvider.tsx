"use client";

import React from "react";

/**
 * Lenis Provider
 * 
 * Disabled smooth scroll library globally in favor of 100% native GPU-accelerated
 * browser scrolling. This eliminates floaty interpolation lag and choppy frame drops
 * on mouse wheel, trackpad, and touch drag gestures.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
