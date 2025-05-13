
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/types'; // Ensure this path is correct

export function useRoleGuard(expectedRoleOrRoles: UserRole | UserRole[]): { isAuthorized: boolean; isLoading: boolean } {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole') as UserRole | null;
      const expectedRoles = Array.isArray(expectedRoleOrRoles) ? expectedRoleOrRoles : [expectedRoleOrRoles];

      if (storedRole && expectedRoles.includes(storedRole)) {
        if (mounted) {
          setIsAuthorized(true);
        }
      } else {
        if (mounted) {
          setIsAuthorized(false);
          // Redirect to login if not authorized.
          // Consider redirecting to a generic dashboard or an access denied page for better UX.
          router.replace('/login');
        }
      }
      if (mounted) {
        setIsLoading(false);
      }
    }
    return () => {
      mounted = false;
    };
  }, [router, expectedRoleOrRoles]);

  return { isAuthorized, isLoading };
}
