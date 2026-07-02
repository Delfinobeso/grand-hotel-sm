'use client';

import { useEffect } from 'react';
import { initTracker, destroyTracker } from '@/lib/analytics/tracker';

export default function AnalyticsProvider({ project }: { project: string }) {
  useEffect(() => {
    initTracker(project);
    return () => destroyTracker();
  }, [project]);

  return null;
}
