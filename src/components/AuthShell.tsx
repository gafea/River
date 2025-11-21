'use client';
import React, { ReactNode, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Navigation from '@/components/Navigation';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthShell({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && pathname !== '/auth') {
      // Preserve original destination for post-auth redirect
      const next = pathname || '/';
      router.replace(`/auth?next=${encodeURIComponent(next)}`);
    }
  }, [isAuthenticated, pathname, router]);

  const showNavigation = isAuthenticated && pathname !== '/auth';

  return (
    <div style={{ display: 'flex' }}>
      {showNavigation && <Navigation />}
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  );
}
