import React from 'react';
import { BaseState } from './BaseState';
import { BaseStateProps } from '../../../types/state';

export function NoPermissionState(props: BaseStateProps) {
  return (
    <BaseState 
      icon={props.icon || "lock"}
      title={props.title || "Akses Ditolak"}
      message={props.message || "Anda tidak memiliki izin (permission) yang diperlukan untuk melihat konten ini."}
      className={`border-orange-500/20 bg-orange-50/50 ${props.className || ''}`}
      {...props}
    />
  );
}
