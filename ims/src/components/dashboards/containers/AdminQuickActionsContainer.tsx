import React from 'react';

import { QuickActionWidget } from '../widgets/QuickActionWidget';
import { QuickActionData } from '../../../types/dashboard-domains';
import { usePermissions } from '../../../hooks/usePermissions';

export function AdminQuickActionsContainer() {
  const { hasPermission } = usePermissions();

  const allActions: (QuickActionData & { permission: string })[] = [
    { id: 'create-user', label: 'Tambah Pengguna', icon: 'person_add', actionType: 'link', href: '/users/create', permission: 'users:create' },
    { id: 'system-settings', label: 'Pengaturan Sistem', icon: 'settings', actionType: 'link', href: '/settings', permission: 'settings:manage' },
    { id: 'audit-logs', label: 'Log Aktivitas', icon: 'history', actionType: 'link', href: '/audit', permission: 'audit:read' },
    { id: 'manage-roles', label: 'Kelola Role', icon: 'manage_accounts', actionType: 'link', href: '/roles', permission: 'roles:manage' },
  ];

  const permittedActions = allActions.filter(action => hasPermission(action.permission));

  if (permittedActions.length === 0) {
    return null; // Or a fallback state if needed, but returning null hides the widget naturally if empty
  }

  return <QuickActionWidget actions={permittedActions} />;
}
