'use client';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  Theme,
} from '@fluentui/react-components';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { UIProvider, useUI } from './UIContext';

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

function ThemedFluentProvider({ children }: { children: ReactNode }) {
  const { actualTheme } = useUI();
  
  return (
    <FluentProvider
      theme={actualTheme === 'dark' ? customDarkTheme : webLightTheme}
      style={{ minHeight: '100vh' }}
    >
      {children}
    </FluentProvider>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <ThemedFluentProvider>{children}</ThemedFluentProvider>
    </UIProvider>
  );
}
