import { useState, useEffect } from 'react';
import { UserProfileBase, ActiveContext } from '../../types/rbac';
import { AuthService } from './auth.service';
import { determineActiveContext } from '../rbac/role-resolver';

interface UseAuthResult {
  profile: UserProfileBase | null;
  activeContext: ActiveContext | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [profile, setProfile] = useState<UserProfileBase | null>(null);
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  const fetchProfile = async () => {
    // Don't fetch if we're already redirecting to prevent loops
    if (isRedirecting) {
      console.log('Already redirecting, skipping profile fetch');
      return;
    }

    // Don't fetch profile on login or pending pages - user needs to authenticate first
    // Pending page is for users waiting for admin approval (no auth cookies yet)
    const publicPages = ['/login', '/pending'];
    if (typeof window !== 'undefined' && publicPages.includes(window.location.pathname)) {
      console.log(`On ${window.location.pathname} page, skipping profile fetch`);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const loadedProfile = await AuthService.getProfile();
      setProfile(loadedProfile);
      
      const context = determineActiveContext(loadedProfile);
      setActiveContext(context);
    } catch (err: unknown) {
      console.error("Failed to load user profile:", err);
      
      // Check if it's a 401 Unauthorized error
      const error = err instanceof Error ? err : new Error(String(err));
      const is401 = error.message.includes('Unauthorized') || error.message.includes('401');
      
      if (is401) {
        // Only redirect if not already on login page to prevent redirect loop
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          console.log('Redirecting to login page...');
          setIsRedirecting(true); // Prevent any further fetch attempts
          window.location.href = '/login';
          return; // Don't set error state, we're redirecting
        }
        
        // If already on login page, don't redirect but don't show error either
        // The login page will handle authentication
        console.log('Already on login page, skipping redirect');
        return; // Don't set error state on login page
      }
      
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    activeContext,
    isLoading,
    error,
    reload: fetchProfile,
  };
}
