"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../store/useAuthStore";
import { Role } from "../types/auth.types";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const emptySubscribe = () => () => {};

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    if (!isMounted || isLoading) return;

    if (!isAuthenticated) {
      // Redirect to login and save the attempted URL
      const searchParams = new URLSearchParams();
      searchParams.set("callbackUrl", pathname);
      router.replace(`/login?${searchParams.toString()}`);
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // User doesn't have permission, redirect to their default dashboard
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router, pathname, isMounted]);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!isMounted || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Only render if authenticated and (if specified) has allowed role
  if (isAuthenticated && (!allowedRoles || (user && allowedRoles.includes(user.role)))) {
    return <>{children}</>;
  }

  return null;
}
