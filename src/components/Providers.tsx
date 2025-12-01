'use client';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  Theme,
} from '@fluentui/react-components';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { UIProvider } from './UIContext';

// Custom dark theme with pure black background and #eee text
const customDarkTheme: Theme = {
  ...webDarkTheme,
  colorNeutralBackground1: '#000000', // Pure black background
  colorNeutralForeground1: '#eeeeee', // #eee for text
  colorNeutralBackground2: '#1a1a1a', // Sidebar background (reverted to original)
  colorNeutralBackground3: '#2a2a2a', // Card backgrounds - brighter than background
  colorNeutralBackground4: '#3a3a3a', // Even brighter for elevated surfaces
  colorNeutralStroke1: '#404040', // Subtle borders
};

export default function Providers({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <FluentProvider
      theme={isDark ? customDarkTheme : webLightTheme}
      style={{ minHeight: '100vh' }}
    >
      <UIProvider>{children}</UIProvider>
    </FluentProvider>
  );
}
