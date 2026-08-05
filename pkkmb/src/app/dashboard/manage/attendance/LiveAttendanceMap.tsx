"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamic import with ssr: false to prevent Next.js server-side rendering errors with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface LogData {
  _id: string;
  lat?: number;
  lng?: number;
  participant?: {
    name: string;
    nim?: string;
  };
  checkInTime: string;
  status: string;
}

interface MapProps {
  logs: LogData[];
}

export default function LiveAttendanceMap({ logs }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return <div className="flex-1 bg-white/5 animate-pulse rounded-2xl" />;

  // Filter logs that actually have coordinates
  const validLogs = logs.filter(log => log.lat && log.lng);

  // Center on Gedung E1 FT UNESA Ketintang by default if no data, or on the last log
  const defaultCenter: [number, number] = [-7.3156913, 112.7270252];
  const center = validLogs.length > 0 && validLogs[0].lat && validLogs[0].lng
    ? [validLogs[0].lat, validLogs[0].lng] as [number, number]
    : defaultCenter;

  return (
    <div className="w-full h-full min-h-[400px] z-0 rounded-b-2xl overflow-hidden relative">
      <MapContainer 
        center={center} 
        zoom={17} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validLogs.map((log) => (
          <CircleMarker
            key={log._id}
            center={[log.lat!, log.lng!]}
            pathOptions={{ 
              color: log.status === 'PRESENT' || log.status === 'Hadir' ? '#22c55e' : '#f59e0b',
              fillColor: log.status === 'PRESENT' || log.status === 'Hadir' ? '#22c55e' : '#f59e0b',
              fillOpacity: 0.7
            }}
            radius={8}
          >
            <Popup>
              <div className="text-black">
                <p className="font-bold">{log.participant?.name}</p>
                <p className="text-xs">{log.participant?.nim}</p>
                <p className="text-xs text-gray-500">
                  {new Date(log.checkInTime).toLocaleTimeString('id-ID')} - {log.status}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
