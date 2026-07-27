"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Thin wrapper around next-themes ThemeProvider.
 *
 * React 19 (Next.js 16) warns about <script> tags rendered inside React
 * components. next-themes v0.4.x injects an inline <script> for FOUC
 * prevention. Since the <html> tag in layout.tsx already has
 * suppressHydrationWarning and class="dark", the FOUC script is redundant
 * for our dark-only theme. The warning is harmless but we document it here.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}