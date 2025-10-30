'use client';

import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';

export function ClientToaster() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          border: '1px solid #334155',
        },
        className: 'sonner-toast',
        duration: 4000,
      }}
      richColors
    />
  );
}
