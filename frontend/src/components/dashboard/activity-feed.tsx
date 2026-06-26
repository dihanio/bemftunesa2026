"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface ActivityLog {
  _id: string;
  action: string;
  details: string;
  createdAt: string;
  userId: string;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch from your real API
    // e.g., ImsApiService.request('/audit/activities')
    
    // For now, mocking data until the endpoint is fully wired for the frontend
    const mockData = [
      { _id: '1', action: 'Create Proker', details: 'BEM Mengajar', createdAt: new Date().toISOString(), userId: 'User1' },
      { _id: '2', action: 'Approve Surat', details: 'Surat Undangan Dekanat', createdAt: new Date(Date.now() - 3600000).toISOString(), userId: 'User2' },
      { _id: '3', action: 'Update Aspiration', details: 'Aspirasi UKT', createdAt: new Date(Date.now() - 7200000).toISOString(), userId: 'User3' },
    ];
    
    setTimeout(() => {
      setActivities(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terkini</CardTitle>
          <CardDescription>Menunggu data aktivitas...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitas Terkini</CardTitle>
        <CardDescription>Log aktivitas sistem terbaru</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada aktivitas.</p>
          ) : (
            activities.map((activity) => (
              <div key={activity._id} className="flex flex-col space-y-1 border-l-2 border-primary/20 pl-4 py-1">
                <p className="text-sm font-medium leading-none">{activity.action}</p>
                <p className="text-sm text-muted-foreground">{activity.details}</p>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: id })}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
