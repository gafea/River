'use client';
import { Suspense } from 'react';
import River from '@/components/River';

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="d_loading" />
        </main>
      }
    >
      <div style={{ height: '100vh', width: '100vw' }}>
        <River />
      </div>
    </Suspense>
  );
}
