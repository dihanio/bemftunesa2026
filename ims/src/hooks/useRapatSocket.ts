'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface AttendeeEvent {
  userId: string;
  name: string;
  attendedAt: string;
  method: 'qr' | 'manual';
  distanceFromTarget?: number;
  note?: string;
}

export function useRapatSocket(rapatId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [newAttendee, setNewAttendee] = useState<AttendeeEvent | null>(null);
  const [rapatStatus, setRapatStatus] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!rapatId) return;

    const socket = io(
      `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/rapat`,
      { transports: ['websocket'] }
    );

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_rapat', { rapatId });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new_attendee', (attendee: AttendeeEvent) => {
      setNewAttendee(attendee);
    });

    socket.on('status_changed', ({ status }: { status: string }) => {
      setRapatStatus(status);
    });

    return () => {
      socket.disconnect();
    };
  }, [rapatId]);

  return { newAttendee, rapatStatus, connected };
}
