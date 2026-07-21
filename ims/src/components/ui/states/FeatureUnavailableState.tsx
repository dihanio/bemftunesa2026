import React from 'react';
import { BaseState } from './BaseState';
import { BaseStateProps } from '../../../types/state';

export function FeatureUnavailableState(props: BaseStateProps) {
  return (
    <BaseState 
      icon={props.icon || "construction"}
      title={props.title || "Fitur Dinonaktifkan"}
      message={props.message || "Fitur ini sedang tidak tersedia atau dalam masa perbaikan."}
      className={`border-zinc-500/20 bg-zinc-50/50 ${props.className || ''}`}
      {...props}
    />
  );
}
