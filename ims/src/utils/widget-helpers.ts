import { BarChart3, Activity, Users, FileText, Settings, Calendar } from 'lucide-react';

export const widgetGroupTitles: Record<string, { title: string; icon: typeof BarChart3 }> = {
  'overview': {
    title: 'Ringkasan',
    icon: BarChart3,
  },
  'activity': {
    title: 'Aktivitas Terbaru',
    icon: Activity,
  },
  'team': {
    title: 'Tim & Anggota',
    icon: Users,
  },
  'documents': {
    title: 'Dokumen',
    icon: FileText,
  },
  'events': {
    title: 'Kegiatan',
    icon: Calendar,
  },
  'settings': {
    title: 'Pengaturan',
    icon: Settings,
  },
};

export function getWidgetGroupTitle(groupId: string): { title: string; icon: typeof BarChart3 } {
  return widgetGroupTitles[groupId] || { title: groupId, icon: BarChart3 };
}
