import React from 'react';
import { BaseState } from './BaseState';
import { BaseStateProps } from '../../../types/state';

export function EmptyState(props: BaseStateProps) {
  return (
    <BaseState 
      icon={props.icon || "inbox"}
      title={props.title || "Tidak Ada Data"}
      message={props.message || "Belum ada data yang dapat ditampilkan di sini."}
      {...props}
    />
  );
}
