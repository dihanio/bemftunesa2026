import React from 'react';
import { StatProkerContainer } from '../containers/StatProkerContainer';
import { StatSuratContainer } from '../containers/StatSuratContainer';
import { AdminQuickActionsContainer } from '../containers/AdminQuickActionsContainer';
import { SystemTimelineContainer } from '../containers/SystemTimelineContainer';
import { RecentLettersContainer } from '../containers/RecentLettersContainer';

export function WidgetFactory({ componentName }: { componentName: string }) {
  switch (componentName) {
    case 'StatProkerContainer':
      return <StatProkerContainer />;
    case 'StatSuratContainer':
      return <StatSuratContainer />;
    case 'AdminQuickActionsContainer':
      return <AdminQuickActionsContainer />;
    case 'SystemTimelineContainer':
      return <SystemTimelineContainer />;
    case 'RecentLettersContainer':
      return <RecentLettersContainer />;
    default:
      console.warn(`Widget Component ${componentName} not found in WidgetFactory`);
      return null;
  }
}
