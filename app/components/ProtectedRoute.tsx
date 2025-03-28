'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLiff } from './LiffProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { liff, liffError, isLoggedIn } = useLiff();
  const router = useRouter();
  
  // List of authorized LINE user IDs who can access admin
  const adminLineIds = useMemo(() => ['U673c35728bf8bc8da575d191956cb925'], []); // Replace with actual LINE user IDs
  
  // Development bypass - set to true to bypass admin checks during development
  const DEV_MODE = true;
  
  // Check if current user is admin
  const isAdmin = useMemo(() => {
    // Always return true in dev mode
    if (DEV_MODE) return true;
    
    if (!liff || !isLoggedIn) return false;
    const userId = liff.getDecodedIDToken()?.sub;
    return !!userId && adminLineIds.includes(userId);
  }, [liff, isLoggedIn, adminLineIds]);

  useEffect(() => {
    // Development bypass - skip all authentication checks
    if (DEV_MODE) return;
    
    if (liff) {
      if (!isLoggedIn) {
        // User is not authenticated, redirect to login
        router.push('/admin/login');
      } else if (adminOnly && !isAdmin) {
        // User is authenticated but not an admin, redirect to unauthorized page
        router.push('/unauthorized');
      }
    }
  }, [liff, isLoggedIn, isAdmin, adminOnly, router]);

  // Show loading state while checking authentication
  if (!liff || liffError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // In development mode, always render children
  if (DEV_MODE) {
    return <>{children}</>;
  }
  
  // In production, only render when authenticated
  if (!liff || !isLoggedIn) {
    return null;
  }

  if (adminOnly && !isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
