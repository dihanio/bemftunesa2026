"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { apiClient } from '@/shared/api/axios';
import {
  User,
  GraduationCap,
  Users,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Hash,
} from 'lucide-react';

export default function ProfilPage() {
  const { user: maba } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 6) {
      setFeedback({ type: 'error', text: 'Password baru minimal 6 karakter' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'Konfirmasi password tidak cocok' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/users/me/change-password', {
        currentPassword,
        newPassword,
      });
      setIsSubmitting(false);
      setFeedback({ type: 'success', text: 'Password berhasil diubah!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setIsSubmitting(false);
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Gagal mengubah password' });
    }
  };

  const [extendedUser, setExtendedUser] = useState<any>(null);
  
  useEffect(() => {
    if (maba) {
      apiClient.get('/pkkmb/me').then(res => {
        setExtendedUser(res.data?.data);
      }).catch(err => console.error("Failed to fetch extended profile", err));
    }
  }, [maba]);

  if (!maba) return null;

  const profileFields = [
    { label: 'Nama Lengkap', value: extendedUser?.name || maba.name, icon: User },
    { label: 'NIM', value: extendedUser?.nim || maba.nim, icon: Hash },
    { label: 'Program Studi', value: extendedUser?.studyProgram || '-', icon: GraduationCap },
    { label: 'Kelompok PKKMB', value: extendedUser?.pkkmbGroup?.name || extendedUser?.pkkmbGroup || maba.pkkmbGroupId || '-', icon: Users },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-extrabold">Profil Saya</h2>

      {/* Profile Info Card */}
      <div className="glass-subtle rounded-2xl p-6 border border-white/10 space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b border-white/5">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/20 shrink-0">
            {maba.name?.charAt(0).toUpperCase() || 'M'}
          </div>
          <div>
            <h3 className="text-lg font-extrabold">{maba.name}</h3>
            <p className="text-sm text-foreground/50 font-mono">{maba.nim}</p>
          </div>
        </div>

        <div className="grid gap-4">
          {profileFields.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
                <Icon className="h-4.5 w-4.5 text-sage" />
              </div>
              <div>
                <div className="text-xs text-foreground/40">{label}</div>
                <div className="text-sm font-semibold">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password Card */}
      <div className="glass-subtle rounded-2xl p-6 border border-white/10 space-y-5">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-sage" />
          <h3 className="text-base font-bold">Ubah Password</h3>
        </div>

        {feedback && (
          <div className={`flex items-center gap-3 rounded-xl p-3.5 text-sm font-medium border animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-sage/10 text-sage border-sage/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {feedback.type === 'success' ? <CheckCircle className="h-4.5 w-4.5 shrink-0" /> : <AlertTriangle className="h-4.5 w-4.5 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="field-label">Password Saat Ini</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                className="input-field pr-11"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-foreground/30 hover:text-foreground/60 transition-colors"
                aria-label={showCurrent ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="field-label">Password Baru</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                minLength={6}
                className="input-field pr-11"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-foreground/30 hover:text-foreground/60 transition-colors"
                aria-label={showNew ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="field-label">Konfirmasi Password Baru</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang password baru"
              className="input-field"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-sm mt-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Ubah Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
