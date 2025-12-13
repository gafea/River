'use client';
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Card, Text } from '@fluentui/react-components';
import { useAuth } from '@/components/AuthProvider';
import { useUI } from '@/components/UIContext';

export default function AuthPage() {
  const { isAuthenticated, isLoading, login, register } = useAuth();
  const { triggerTransition } = useUI();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const requested = searchParams.get('next');
      // Basic validation to prevent open redirects
      const safe =
        requested && requested.startsWith('/') && !requested.startsWith('//')
          ? requested
          : '/';
      triggerTransition(safe, false, true);
    }
  }, [isAuthenticated, isLoading, searchParams, triggerTransition]);

  if (isLoading) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card style={{ width: 520, padding: 32 }}>
        <Text weight="semibold" size={600} style={{ marginBottom: 8 }}>
          Welcome!
        </Text>
        <Text
          size={300}
          style={{ marginBottom: 20, color: 'var(--colorNeutralForeground3)' }}
        >
          Login with your saved credentials or create a new bucket!
        </Text>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button appearance="primary" onClick={() => login().catch(() => {})}>
            Login
          </Button>
          <Button onClick={() => register().catch(() => {})}>Create</Button>
        </div>
      </Card>
    </div>
  );
}
