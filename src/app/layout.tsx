import type { Metadata } from 'next';
import { StompProvider } from '@/lib/stomp-provider';
import { getAccessToken } from '@/lib/api-client';

export const metadata: Metadata = {
  title: 'Q-In',
  description: 'Queue management for cohorts — live positions, wait estimates, and admin tools.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = getAccessToken();

  return (
    <html lang="en">
      <body className="antialiased bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <StompProvider token={token}>
          {children}
        </StompProvider>
      </body>
    </html>
  );
}
