"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/features/auth/api/auth.api';
import { API_BASE_URL } from '@/shared/api/axios';
import Image from 'next/image';
import './login.css';

function LoginContent() {
  const { setAuth, user, isLoading, fetchMe } = useAuthStore();
  const router = useRouter();
  
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await authApi.loginMaba(nim, password);
      await fetchMe();
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login gagal. Periksa kembali NIM dan password Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return null; // or a very minimal spinner, but null is fine to prevent flash
  }

  return (
    <div className="auth-layout">
      {/* Dynamic Animated Backgrounds */}
      <div className="auth-bg-image"></div>
      <div className="auth-ambient-light-1"></div>
      <div className="auth-ambient-light-2"></div>
      <div className="auth-hero-pattern"></div>

      <div className="auth-container">
        {/* Hero Left Side */}
        <div className="auth-hero">
          <div className="auth-logo animate-enter delay-1">
            <div className="logo-group">
              <Image src="/logobemft.png" alt="BEM FT UNESA" width={56} height={56} className="logo-img" />
              <Image src="/logo_kabinet.png" alt="Kabinet BEM FT" width={56} height={56} className="logo-img" />
            </div>
            <div className="auth-logo-text">
              <span className="auth-logo-main">BEM FT UNESA</span>
              <span className="auth-logo-sub">KABINET DANADYAKSA</span>
            </div>
          </div>
          
          <div className="auth-hero-title">
            <div className="flex items-center gap-6 mb-6">
              <Image src="/logo_adrata.png" alt="PKKMB Adrata" width={80} height={80} className="animate-enter delay-2 logo-img shrink-0" />
              <h1 className="animate-enter delay-3" style={{ margin: 0 }}><span>ADRATA</span></h1>
            </div>
            <p className="animate-enter delay-4">Portal Pengenalan Kehidupan Kampus bagi Mahasiswa Baru Fakultas Teknik Universitas Negeri Surabaya.</p>
          </div>
        </div>

        {/* Form Right Side */}
        <div className="auth-content">
          <div className="auth-form-wrapper animate-enter delay-2">
            <div className="auth-mobile-logo">
              <div className="logo-group">
                <Image src="/logobemft.png" alt="BEM FT UNESA" width={48} height={48} className="logo-img" />
                <Image src="/logo_kabinet.png" alt="Kabinet BEM FT" width={48} height={48} className="logo-img" />
                <Image src="/logo_adrata.png" alt="PKKMB Adrata" width={40} height={40} className="logo-img" />
              </div>
              <div className="auth-logo-text">
                <span className="auth-logo-main">BEM FT UNESA</span>
                <span className="auth-logo-sub">KABINET DANADYAKSA</span>
              </div>
            </div>
            
            <div className="auth-form-header animate-enter delay-3">
              <h2>Masuk Portal</h2>
              <p>Masukkan NIM Anda untuk melanjutkan.</p>
            </div>

            {errorMsg && (
              <div className="auth-error animate-enter delay-3">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group animate-enter delay-4">
                <label htmlFor="nim">Nomor Induk Mahasiswa (NIM)</label>
                <input 
                  type="text" 
                  id="nim" 
                  className="input-control"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  placeholder="24050001"
                  required 
                />
              </div>
              
              <div className="input-group animate-enter delay-5">
                <label htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  className="input-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required 
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary animate-enter delay-6">
                {isSubmitting ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
