import React from 'react';
import { BaseState } from './BaseState';
import { BaseStateProps } from '../../../types/state';

export function LoadingState(props: Omit<BaseStateProps, 'icon'>) {
  return (
    <BaseState 
      icon="hourglass_empty"
      title={props.title || "Memuat Data"}
      message={props.message || "Harap tunggu sebentar..."}
      {...props}
    />
  );
}
