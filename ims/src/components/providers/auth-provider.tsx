"use client";

import { useEffect, useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@bemft/api-client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { token, isAuthenticated, user, setPermissions, logout, _hasHydrated } =
    useAuth();

  // Use a fallback clientId if not defined, so the app doesn't crash in development
  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy-client-id";

  useEffect(() => {
    setMounted(true);

    // Register PWA Service Worker client-side
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(
        (registration) => {
          console.log(
            "👷 [PWA SW] ServiceWorker registration successful with scope: ",
            registration.scope,
          );
        },
        (err) => {
          console.warn("👷 [PWA SW] ServiceWorker registration failed: ", err);
        },
      );
    }

    if (googleClientId === "dummy-client-id") {
      console.warn(
        "⚠️ [Auth] NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing in .env. Google Login will fail.",
      );
    }

    const handleUnauthorized = async () => {
      console.warn(
        "⚠️ [Auth] Access token expired or invalid. Attempting silent refresh...",
      );
      const state = useAuth.getState();
      const currentRefreshToken = state.refreshToken;

      if (!currentRefreshToken) {
        console.warn("⚠️ [Auth] No refresh token available. Logging out...");
        logout();
        return;
      }

      try {
        const refreshResponse = await apiClient.post<any>("/auth/refresh", {
          refreshToken: currentRefreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } =
          refreshResponse.data;

        // Update store with new tokens
        state.login(state.user!, accessToken, newRefreshToken);
        apiClient.setAuthToken(accessToken);

        console.log("✅ [Auth] Silent refresh succeeded. Sesi dilanjutkan.");
      } catch (error) {
        console.error("❌ [Auth] Silent refresh failed. Logging out...", error);
        logout();
      }
    };

    window.addEventListener(
      "auth:unauthorized",
      handleUnauthorized as EventListener,
    );

    // Auto-hydrate API Client with token on mount or token change
    if (_hasHydrated) {
      if (isAuthenticated && token) {
        apiClient.setAuthToken(token);
        if (!user?.permissions?.length) {
          apiClient
            .get<any>("/ims/permissions/me")
            .then((response) => {
              const permissions = response.data?.permissions;
              if (Array.isArray(permissions)) {
                setPermissions(permissions);
              }
            })
            .catch((error) => {
              console.warn("[Auth] Failed to hydrate permissions", error);
            });
        }
      } else {
        apiClient.removeAuthToken();
      }
    }

    return () => {
      window.removeEventListener(
        "auth:unauthorized",
        handleUnauthorized as EventListener,
      );
    };
  }, [
    token,
    isAuthenticated,
    user?.permissions?.length,
    setPermissions,
    logout,
    _hasHydrated,
  ]);

  if (!mounted) {
    return null; // or a loading spinner to prevent hydration mismatch for Zustand persists
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
