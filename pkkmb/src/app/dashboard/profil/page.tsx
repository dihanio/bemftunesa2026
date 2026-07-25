"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { apiClient } from '@/shared/api/axios';
import {
  User as UserIcon,
  GraduationCap,
  Users,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Hash,
  ShieldCheck,
  Shield,
  Mail,
  Award,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function ProfilPage() {
  const { user } = useAuthStore();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extendedUser, setExtendedUser] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (user) {
      apiClient
        .get('/pkkmb/me')
        .then((res) => {
          setExtendedUser(res.data?.data);
        })
        .catch((err) => console.error('Failed to fetch extended profile', err));
    }
  }, [user]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter.', 'VALIDASI GAGAL');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok.', 'VALIDASI GAGAL');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/users/me/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password berhasil diubah!', 'SUKSES');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Gagal mengubah password.', 'GAGAL');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const isPanitia = user.role !== 'MABA';

  const groupName =
    (extendedUser?.pkkmbGroup as { name?: string })?.name ||
    (extendedUser?.pkkmbGroup as string) ||
    user.pkkmbGroup?.name;

  const profileFields = isPanitia
    ? [
        { label: 'NAMA LENGKAP', value: (extendedUser?.name as string) || user.name, icon: UserIcon },
        { label: 'DIVISI / SIE KEPANITIAAN', value: (extendedUser?.position as string) || user.position || (user.role as string) || 'PANITIA PKKMB FT', icon: Shield },
        { label: 'EMAIL RESMI', value: (extendedUser?.email as string) || user.email || '-', icon: Mail },
        {
          label: 'KELOMPOK BINAAN',
          value: groupName || 'BELUM DI-ASSIGN KELOMPOK',
          icon: Users,
        },
      ]
    : [
        { label: 'NAMA LENGKAP', value: (extendedUser?.name as string) || user.name, icon: UserIcon },
        { label: 'NIM MAHASISWA', value: (extendedUser?.nim as string) || user.nim, icon: Hash },
        { label: 'PROGRAM STUDI', value: (extendedUser?.studyProgram as string) || user.studyProgram || 'BELUM DIISI', icon: GraduationCap },
        {
          label: 'KELOMPOK PKKMB',
          value: groupName || 'MENUNGGU PENGACAKAN',
          icon: Users,
        },
      ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header Card */}
      <div className="surface-card p-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-[var(--bg-surface-elevated)] border-2 border-[var(--accent)] flex items-center justify-center text-[var(--accent)] text-2xl font-mono font-bold shrink-0 overflow-hidden relative shadow-lg shadow-[var(--accent-glow)]">
          {user.avatar && user.avatar !== '/pasfoto_default.png' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="Foto Profil" className="h-full w-full object-cover" />
          ) : (
            user.name?.charAt(0).toUpperCase() || 'P'
          )}
        </div>
        <div>
          <div className="text-[10px] font-mono text-[var(--accent)] uppercase font-bold tracking-wider flex items-center gap-1.5">
            {isPanitia ? (
              <>
                <Shield className="h-3.5 w-3.5" /> AKUN TERDAFTAR KEPANITIAAN PKKMB
              </>
            ) : (
              <>
                <Award className="h-3.5 w-3.5" /> AKUN TERDAFTAR MAHASISWA BARU
              </>
            )}
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mt-0.5">{user.name}</h1>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
            {isPanitia ? `ROLE: ${user.role || 'PANITIA'}` : `NIM: ${user.nim}`}
          </p>
        </div>
      </div>

      {/* Profile Detail Fields */}
      <div className="surface-card p-6 space-y-4">
        <h2 className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-3">
          DETAIL INFORMASI PROFIL
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profileFields.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="p-3.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1"
            >
              <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1.5 uppercase font-bold">
                <Icon className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>{label}</span>
              </div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)]">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="surface-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
          <Lock className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
            UBAH PASSWORD SESI
          </h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Password Saat Ini *
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] rounded outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Password Baru *
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                minLength={6}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] rounded outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Konfirmasi Password Baru *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang password baru"
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] rounded outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-accent py-2.5 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan Password...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Ubah Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
