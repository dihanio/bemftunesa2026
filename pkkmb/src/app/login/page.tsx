"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth/api/auth.api';
import Image from 'next/image';
import './login.css';

function AuthContent() {
  const { user, isLoading, fetchMe } = useAuthStore();
  const router = useRouter();
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await authApi.loginMaba(email, password);
      await fetchMe();
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setLoginError(error.response?.data?.message || 'Login gagal. Periksa kembali Email dan password Anda.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="auth-layout" style={{ overflowY: 'auto' }}>
      {/* Dynamic Animated Backgrounds */}
      <div className="auth-bg-image"></div>
      <div className="auth-ambient-light-1"></div>
      <div className="auth-ambient-light-2"></div>
      <div className="auth-hero-pattern"></div>

      <div className="auth-container" style={{ padding: '2rem 0' }}>
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
                <Image src="/logo_adrata.png" alt="PKKMB Adrata" width={32} height={32} className="logo-img" />
              </div>
              <div className="auth-logo-text">
                <span className="auth-logo-main">BEM FT UNESA</span>
                <span className="auth-logo-sub">KABINET DANADYAKSA</span>
              </div>
            </div>

            <div className="view-transition-wrapper">
              
              {/* --- LOGIN VIEW --- */}
              <div className="slide-content login-view active">
                <div className="auth-form-header">
                  <h2>Masuk Portal</h2>
                  <p>Masukkan Email Anda untuk melanjutkan.</p>
                </div>

                {loginError && (
                  <div className="auth-error">
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="auth-form">
                  <div className="input-group">
                    <label htmlFor="email_login">Email</label>
                    <input 
                      type="email" 
                      id="email_login" 
                      className="input-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@mhs.unesa.ac.id"
                      required
                    />
                  </div>
                  
                  <div className="input-group">
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

                  <button type="submit" disabled={isLoggingIn} className="btn-primary">
                    {isLoggingIn ? 'Memproses...' : 'Masuk'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthContent />
    </Suspense>
  );
}
