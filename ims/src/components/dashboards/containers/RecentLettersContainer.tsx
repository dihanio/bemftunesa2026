import React from 'react';
import { useRecentLetters } from '../../../hooks/useLetters';
import { ListWidget } from '../widgets/ListWidget';
import { LetterData } from '../../../types/letter';
import { LoadingState } from '../../ui/states/LoadingState';
import { ErrorState } from '../../ui/states/ErrorState';
import { BackendNotReadyState } from '../../ui/states/BackendNotReadyState';

export function RecentLettersContainer() {
  const { data, isLoading, error, isNotImplemented, refetch } = useRecentLetters(5);

  if (isNotImplemented) {
    return <BackendNotReadyState title="Daftar Surat Belum Tersedia" className="h-full min-h-[300px]" />;
  }

  if (isLoading) {
    return <LoadingState className="h-full min-h-[300px]" />;
  }

  if (error) {
    return <ErrorState error={error} retry={refetch} className="h-full min-h-[300px]" />;
  }

  return (
    <ListWidget<LetterData>
      title="Surat Terbaru"
      data={data}
      keyExtractor={(item) => item.id}
      columns={[
        { header: 'No. Surat', accessor: (item) => item.referenceNumber || '-' },
        { header: 'Perihal', accessor: 'subject', className: 'max-w-[200px] truncate' },
        { 
          header: 'Status', 
          accessor: (item) => (
            <span className={`px-2 py-1 text-xs rounded-full ${
              item.status === 'approved' ? 'bg-green-100 text-green-700' :
              (item.status === 'review_kadep' || item.status === 'review_ketua') ? 'bg-orange-100 text-orange-700' :
              'bg-zinc-100 text-zinc-700'
            }`}>
              {item.status.replace('_', ' ').toUpperCase()}
            </span>
          ) 
        },
        { 
          header: 'Tanggal', 
          accessor: (item) => new Date(item.createdAt).toLocaleDateString()
        }
      ]}
    />
  );
}
