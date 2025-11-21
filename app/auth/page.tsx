"use client";
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Text } from '@fluentui/react-components';
import { useAuth } from '@/components/AuthProvider';

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated, login, register } = useAuth();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (isAuthenticated) {
      const requested = searchParams.get('next');
      // Basic validation to prevent open redirects
      const safe = requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : '/dashboard';
      router.replace(safe as any);
    }
  }, [isAuthenticated, router, searchParams]);

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
          Passkey Authentication
        </Text>
        <Text size={300} style={{ marginBottom: 20, color: 'var(--colorNeutralForeground3)' }}>
          Login with an existing passkey or create a new one to register.
        </Text>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button appearance="primary" onClick={() => login().catch(() => {})}>Login</Button>
          <Button onClick={() => register().catch(() => {})}>Register</Button>
        </div>
      </Card>
    </div>
  );
}
