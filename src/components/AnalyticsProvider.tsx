'use client';

import { useEffect } from 'react';
import { initBlasatTracker, destroyBlasatTracker } from '@/lib/analytics/tracker';

export default function AnalyticsProvider({ project }: { project: string }) {
  useEffect(() => {
    initBlasatTracker({ project });
    return () => destroyBlasatTracker();
  }, [project]);

  return null;
}
