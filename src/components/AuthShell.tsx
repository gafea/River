'use client';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Navigation from '@/components/Navigation';
import { usePathname, useRouter } from 'next/navigation';
import NewAssetModal from './NewAssetModal';
import RiverTransition from './RiverTransition';

export default function AuthShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/auth') {
      // Preserve original destination for post-auth redirect
      const next = pathname || '/';
      router.replace(`/auth?next=${encodeURIComponent(next)}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <div className="d_loading" />
      </div>
    );
  }

  const showNavigation = isAuthenticated && pathname !== '/auth';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Navigation removed for immersive experience */}
      <main style={{ flex: 1, position: 'relative' }}>{children}</main>
      <NewAssetModal />
      <RiverTransition />
    </div>
  );
}
