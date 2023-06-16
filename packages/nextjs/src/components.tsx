'use client';
import { usePathname } from 'next/navigation';
import { parentLogger, useReportWebVitals } from './hooks';
import { useEffect } from 'react';

export function AxiomWebVitals() {
  useReportWebVitals();

  // TODO: this could be used to flush logger whenever route changes
  const pathname = usePathname();
  useEffect(() => {
    return () => {
      parentLogger.flush();
    };
  }, [pathname]);
  return null;
}
