'use client';

import { useEffect, useState, useCallback } from 'react';
import QRCode from 'react-qr-code';
import ImsApiService from '@/lib/api';

interface QrDisplayProps {
  rapatId: string;
}

export default function QrDisplay({ rapatId }: QrDisplayProps) {
  const [token, setToken] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ImsApiService.getQrToken(rapatId);
      if (res?.data) {
        setToken(res.data.token);
        setExpiresAt(new Date(res.data.expiresAt));
        setCountdown(Math.ceil((new Date(res.data.expiresAt).getTime() - Date.now()) / 1000));
      }
    } catch (err) {
      console.error('Failed to fetch QR token', err);
    } finally {
      setLoading(false);
    }
  }, [rapatId]);

  // Fetch token on mount and every 30s
  useEffect(() => {
    fetchToken();
    const interval = setInterval(fetchToken, 30000);
    return () => clearInterval(interval);
  }, [fetchToken]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold text-gray-700">Scan untuk Absen</h3>

      {loading ? (
        <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
          <span className="text-gray-500 text-sm">Memuat QR...</span>
        </div>
      ) : token ? (
        <div className="p-3 bg-white border-4 border-blue-600 rounded-lg">
          <QRCode value={token} size={192} />
        </div>
      ) : null}

      {/* Countdown ring */}
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white
            ${countdown > 10 ? 'bg-green-500' : countdown > 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
        >
          {countdown}
        </div>
        <span className="text-sm text-gray-500">detik tersisa</span>
      </div>

      <p className="text-xs text-gray-400 text-center">
        QR Code diperbarui otomatis setiap 30 detik
      </p>
    </div>
  );
}
