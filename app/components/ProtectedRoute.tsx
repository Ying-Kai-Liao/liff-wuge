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
  const adminLineIds = useMemo(() => ['U12345678901234567890123456789012'], []); // Replace with actual LINE user IDs
  
  // Check if current user is admin
  const isAdmin = useMemo(() => {
    if (!liff || !isLoggedIn) return false;
    const userId = liff.getDecodedIDToken()?.sub;
    return !!userId && adminLineIds.includes(userId);
  }, [liff, isLoggedIn, adminLineIds]);

  useEffect(() => {
    if (liff) {
      if (!isLoggedIn) {
        // User is not authenticated, redirect to login
        router.push('/admin/login');
      } else if (adminOnly && !isAdmin) {
        // User is authenticated but not an admin, redirect to unauthorized page
        router.push('/unauthorized');
      }
    }
  }, [liff, isLoggedIn, adminOnly, isAdmin, router]);

  // Show loading state while checking authentication
  if (!liff || liffError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is authenticated (and is admin if adminOnly is true), render children
  if (isLoggedIn && (!adminOnly || isAdmin)) {
    return <>{children}</>;
  }

  // Otherwise, render nothing while redirecting
  return null;
};

export default ProtectedRoute;
