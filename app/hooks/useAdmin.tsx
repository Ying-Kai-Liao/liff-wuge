'use client';

import { useMemo } from 'react';
import { useLiff } from '../components/LiffProvider';

export function useAdmin() {
  const { liff, isLoggedIn } = useLiff();
  
  // List of authorized LINE user IDs who can access admin
  const adminLineIds = useMemo(() => ['U673c35728bf8bc8da575d191956cb925'], []); // Replace with actual LINE user IDs
  
  // Check if current user is admin
  const isAdmin = useMemo(() => {
    if (!liff || !isLoggedIn) return false;
    const userId = liff.getDecodedIDToken()?.sub;
    return !!userId && adminLineIds.includes(userId);
  }, [liff, isLoggedIn, adminLineIds]);

  return { isAdmin };
}
