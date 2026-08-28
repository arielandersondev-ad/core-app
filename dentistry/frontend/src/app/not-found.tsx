'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/');
    }, 2000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background p-8">
      <h1 className="font-display text-4xl font-bold text-foreground">404</h1>
      <p className="text-muted-foreground mt-2">Esta página no existe</p>
      <p className="text-sm text-muted-foreground mt-4">Serás redirigido al inicio en unos segundos...</p>
    </div>
  );
}