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
  triggerTransition: (path: string) => void;
  isNavigating: boolean;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [isNavigating, startTransition] = useTransition();
  const router = useRouter();

  const openNewAssetModal = useCallback(() => setIsNewAssetModalOpen(true), []);
  const closeNewAssetModal = useCallback(
    () => setIsNewAssetModalOpen(false),
    [],
  );

  const triggerTransition = useCallback(
    (path: string) => {
      startTransition(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(path as any);
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
