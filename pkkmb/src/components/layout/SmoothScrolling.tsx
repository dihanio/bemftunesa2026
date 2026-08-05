"use client";

import Lenis from "lenis";
import { useEffect } from "react";

export default function SmoothScrolling({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // ponytail: expose instance so modals can lock scroll via lenis.stop()
    (window as { __lenis?: Lenis | undefined }).__lenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      (window as { __lenis?: Lenis | undefined }).__lenis = undefined;
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
