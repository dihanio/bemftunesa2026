import React from 'react';
import { useSystemActivities } from '../../../hooks/useActivities';
import { TimelineWidget } from '../widgets/TimelineWidget';
import { LoadingState } from '../../ui/states/LoadingState';
import { ErrorState } from '../../ui/states/ErrorState';
import { BackendNotReadyState } from '../../ui/states/BackendNotReadyState';

export function SystemTimelineContainer() {
  const { data, isLoading, error, isNotImplemented, refetch } = useSystemActivities();

  if (isNotImplemented) {
    return <BackendNotReadyState title="Log Aktivitas Belum Tersedia" className="h-full min-h-[300px]" />;
  }

  if (isLoading) {
    return <LoadingState className="h-full min-h-[300px] p-6" />;
  }

  if (error) {
    return <ErrorState error={error} retry={refetch} className="h-full min-h-[300px] p-6" />;
  }

  return <TimelineWidget activities={data} />;
}
