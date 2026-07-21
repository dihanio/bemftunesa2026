import React from 'react';
import { BaseState } from './BaseState';
import { BaseStateProps } from '../../../types/state';

export function BackendNotReadyState(props: BaseStateProps) {
  return (
    <BaseState 
      icon={props.icon || "api"}
      title={props.title || "Menunggu Integrasi Backend"}
      message={props.message || "Endpoint API untuk fitur ini belum diimplementasikan di sisi server."}
      className={`border-blue-500/20 bg-blue-50/50 ${props.className || ''}`}
      {...props}
    />
  );
}
