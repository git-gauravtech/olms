
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Changed from next/navigation
import type { UserRole } from '@/types'; 

export function useRoleGuard(expectedRoleOrRoles: UserRole | UserRole[]): { isAuthorized: boolean; isLoading: boolean } {
  const navigate = useNavigate(); // Changed from useRouter
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
          navigate('/login', { replace: true }); // Changed from router.replace
        }
      }
      if (mounted) {
        setIsLoading(false);
      }
    }
    return () => {
      mounted = false;
    };
  }, [navigate, expectedRoleOrRoles]); // Added navigate to dependencies

  return { isAuthorized, isLoading };
}
