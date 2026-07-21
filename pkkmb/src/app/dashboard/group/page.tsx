"use client";

import React from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { GroupHub } from '@/features/group/components/GroupHub';
import { Loader2 } from 'lucide-react';

export default function GroupPage() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage" />
      </div>
    );
  }

  // Hanya maba dan panitia (mentor) yang punya pkkmbGroupId yang valid
  if (!user.pkkmbGroupId) {
    return (
      <div className="flex flex-col h-[50vh] w-full items-center justify-center text-center space-y-3">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white text-2xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold">Belum Masuk Grup</h2>
        <p className="text-foreground/50 max-w-md">Anda belum dimasukkan ke dalam grup mana pun oleh panitia.</p>
      </div>
    );
  }

  return <GroupHub groupId={user.pkkmbGroupId} userRole={user.role} />;
}
