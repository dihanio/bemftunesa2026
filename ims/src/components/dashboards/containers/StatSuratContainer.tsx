import React from 'react';
import { useSuratStats } from '../../../hooks/useStats';
import { StatWidget } from '../widgets/StatWidget';
import { LoadingState } from '../../ui/states/LoadingState';
import { ErrorState } from '../../ui/states/ErrorState';
import { BackendNotReadyState } from '../../ui/states/BackendNotReadyState';

export function StatSuratContainer() {
  const { data, isLoading, error, isNotImplemented, refetch } = useSuratStats();

  if (isNotImplemented) {
    return <BackendNotReadyState title="Statistik Surat Belum Tersedia" className="h-full min-h-[150px]" />;
  }

  if (isLoading) {
    return <LoadingState className="h-full min-h-[150px] p-4" />;
  }

  if (error || !data) {
    return <ErrorState error={error} retry={refetch} className="h-full min-h-[150px] p-4" />;
  }

  return <StatWidget data={data} />;
}
