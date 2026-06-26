'use client';

import { useState } from 'react';
import ImsApiService from '@/lib/api';

interface AbsenScannerProps {
  rapatId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function AbsenScanner({ rapatId, onSuccess, onError }: AbsenScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState('');

  const getLocation = (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      })
    );

  const handleQrScan = async (token: string) => {
    setScanning(true);
    try {
      const pos = await getLocation();
      await ImsApiService.attendByQr(rapatId, {
        token,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      onSuccess('Absensi berhasil dicatat!');
    } catch (err: any) {
      if (err.code === 1) {
        onError('Akses lokasi ditolak. Aktifkan GPS untuk absensi.');
      } else {
        onError(err?.message || 'Absensi gagal. Coba lagi.');
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-xl border">
      <h3 className="font-semibold text-gray-700">Absensi via QR Code</h3>

      {/* Manual token input for testing or fallback */}
      <div className="flex gap-2">
        <input
          type="text"
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          placeholder="Masukkan token QR..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
        />
        <button
          onClick={() => handleQrScan(manualToken)}
          disabled={scanning || !manualToken}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50 cursor-pointer"
        >
          {scanning ? 'Memproses...' : 'Absen'}
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Scan QR Code yang ditampilkan di layar proyektor, atau masukkan token secara manual.
      </p>
    </div>
  );
}
