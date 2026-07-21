import React from 'react';
import { BaseState } from './BaseState';
import { ErrorStateProps } from '../../../types/state';

export function ErrorState(props: ErrorStateProps) {
  // Try to extract message if error object is provided
  const errorMessage = props.error instanceof Error 
    ? props.error.message 
    : typeof props.error === 'string' 
      ? props.error 
      : props.message || "Terjadi kesalahan saat memuat data.";

  return (
    <BaseState 
      icon={props.icon || "error_outline"}
      title={props.title || "Gagal Memuat"}
      message={errorMessage}
      actionLabel={props.retry ? (props.actionLabel || "Coba Lagi") : undefined}
      onAction={props.retry}
      className={`border-red-500/20 bg-red-50/50 ${props.className || ''}`}
    />
  );
}
