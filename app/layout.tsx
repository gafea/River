import './globals.css';
import type { ReactNode } from 'react';
import Providers from '@/components/Providers';
import { AuthProvider } from '@/components/AuthProvider';
import AuthShell from '@/components/AuthShell';

export const metadata = {
  title: 'River',
  description: 'Track assets with depreciation and tags',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <AuthProvider>
          <Providers>
            <AuthShell>{children}</AuthShell>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
