'use client';
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useTransition,
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
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [isPageLoading, setPageLoading] = useState(false);
  const [showTransitionOverlay, setShowTransitionOverlay] = useState(false);
  const [isNavigating, startTransition] = useTransition();
  const router = useRouter();

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
