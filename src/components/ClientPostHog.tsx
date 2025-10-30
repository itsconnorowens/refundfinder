'use client';

import { useEffect, useState } from 'react';
import { PostHogProvider, PostHogPageView } from '@/components/PostHogProvider';

export function ClientPostHogProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider>
      <PostHogPageView />
      {children}
    </PostHogProvider>
  );
}
