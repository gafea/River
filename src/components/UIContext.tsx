'use client';
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useTransition,
  useEffect,
} from 'react';
import { useRouter } from 'next/navigation';

interface UIContextType {
  isNewAssetModalOpen: boolean;
  openNewAssetModal: () => void;
  closeNewAssetModal: () => void;
  triggerTransition: (
    path: string,
    waitForPageLoad?: boolean,
    replace?: boolean,
  ) => void;
  isNavigating: boolean;
  isPageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
  showTransitionOverlay: boolean;
  setShowTransitionOverlay: (show: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  actualTheme: 'light' | 'dark';
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [isPageLoading, setPageLoading] = useState(false);
  const [showTransitionOverlay, setShowTransitionOverlay] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  const [isNavigating, startTransition] = useTransition();
  const router = useRouter();

  // Handle system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Load saved theme preference
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
    if (saved) setTheme(saved);
  }, []);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const actualTheme = theme === 'system' ? systemTheme : theme;

  const openNewAssetModal = useCallback(() => setIsNewAssetModalOpen(true), []);
  const closeNewAssetModal = useCallback(
    () => setIsNewAssetModalOpen(false),
    [],
  );

  const triggerTransition = useCallback(
    (path: string, waitForPageLoad?: boolean, replace?: boolean) => {
      if (waitForPageLoad) {
        setPageLoading(true);
      }
      startTransition(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (replace) {
          router.replace(path as any);
        } else {
          router.push(path as any);
        }
      });
    },
    [router],
  );

  return (
    <UIContext.Provider
      value={{
        isNewAssetModalOpen,
        openNewAssetModal,
        closeNewAssetModal,
        triggerTransition,
        isNavigating,
        isPageLoading,
        setPageLoading,
        showTransitionOverlay,
        setShowTransitionOverlay,
        theme,
        setTheme,
        actualTheme,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
