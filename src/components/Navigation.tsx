'use client';
import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button, Text } from '@fluentui/react-components';
import {
  Add24Regular,
  Tag24Regular,
  Home24Regular,
  Search24Regular,
} from '@fluentui/react-icons';
import { getAllAssets } from '@/lib/store';
import { groupAssetsByTag } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import type { Asset } from '@/lib/types';

function NavigationContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get('tag');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isDark, setIsDark] = useState(false);
  const lastPathnameRef = useRef<string | undefined>(undefined);
  const { isAuthenticated, logout } = useAuth();

  // Detect theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Load assets on client side only
  useEffect(() => {
    const loadAssets = async () => {
      const allAssets = await getAllAssets();
      setAssets(allAssets);
    };
    loadAssets();
    lastPathnameRef.current = pathname;
  }, []);

  // Refresh assets when navigating between pages
  useEffect(() => {
    if (pathname && pathname !== lastPathnameRef.current) {
      const loadAssets = async () => {
        const allAssets = await getAllAssets();
        setAssets(allAssets);
      };
      loadAssets();
      lastPathnameRef.current = pathname;
    }
  }, [pathname]);

  const grouped = groupAssetsByTag(assets);
  const tags = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  const isActivePath = (path: string) => pathname === path;

  return (
    <nav
      style={{
        width: 240,
        minHeight: '100vh',
        backgroundColor: 'var(--colorNeutralBackground2)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        borderRight: '1px solid var(--colorNeutralStroke2)',
      }}
    >
      <Text weight="semibold" size={500} style={{ marginBottom: 8 }}>
        River
      </Text>
      {isAuthenticated ? (
        <>
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            onClick={() => router.push('/dashboard?new=1')}
            style={{ marginBottom: 8 }}
          >
            New Asset
          </Button>
          <Button
            appearance={
              isActivePath('/dashboard') &&
              !activeTag &&
              !searchParams.get('search')
                ? 'primary'
                : 'subtle'
            }
            icon={<Home24Regular />}
            onClick={() => router.push('/dashboard')}
            style={{
              justifyContent: 'flex-start',
              ...(isActivePath('/dashboard') &&
                !activeTag &&
                !searchParams.get('search') && {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : '#E6F3FF',
                  color: isDark ? '#ffffff' : '#0066CC',
                }),
            }}
          >
            All
          </Button>
          <Button
            appearance={isActivePath('/search') ? 'primary' : 'subtle'}
            icon={<Search24Regular />}
            onClick={() => router.push('/search' as any)}
            style={{
              justifyContent: 'flex-start',
              ...(isActivePath('/search') && {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.1)'
                  : '#E6F3FF',
                color: isDark ? '#ffffff' : '#0066CC',
              }),
            }}
          >
            Search
          </Button>{' '}
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <Text
              weight="semibold"
              size={300}
              style={{ color: 'var(--colorNeutralForeground3)' }}
            >
              TAGS
            </Text>
          </div>
          {tags.map((tag) => (
            <Button
              key={tag}
              appearance={activeTag === tag ? 'primary' : 'subtle'}
              icon={<Tag24Regular />}
              onClick={() => {
                const params = new URLSearchParams();
                params.set('tag', tag);
                router.push(`/dashboard?${params.toString()}`);
              }}
              style={{
                justifyContent: 'flex-start',
                ...(activeTag === tag && {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : '#E6F3FF',
                  color: isDark ? '#ffffff' : '#0066CC',
                }),
              }}
            >
              {tag} ({grouped[tag].length})
            </Button>
          ))}
          {tags.length === 0 && (
            <Text
              size={200}
              style={{
                color: 'var(--colorNeutralForeground3)',
                fontStyle: 'italic',
              }}
            >
              No tags yet
            </Text>
          )}
          <div style={{ marginTop: 'auto' }}>
            <Button onClick={logout}>Logout</Button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button onClick={() => router.push('/auth')}>Authenticate</Button>
        </div>
      )}
    </nav>
  );
}

export default function Navigation() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: 240,
            minHeight: '100vh',
            backgroundColor: 'var(--colorNeutralBackground2)',
            padding: 16,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div className="d_loading" />
        </div>
      }
    >
      <NavigationContent />
    </Suspense>
  );
}
