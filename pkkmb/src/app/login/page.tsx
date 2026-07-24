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
  
  // State to toggle between Login and Register modes
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [regData, setRegData] = useState({
    name: '',
    nim: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

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

  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setRegData(prev => ({ ...prev, [id]: value }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (regData.password !== regData.confirmPassword) {
      setRegError('Password dan Konfirmasi Password tidak cocok.');
      return;
    }
    if (regData.password.length < 8) {
      setRegError('Password minimal 8 karakter.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regData.email)) {
      setRegError('Format email tidak valid.');
      return;
    }

    setIsRegistering(true);
    try {
      await authApi.registerMaba({
        name: regData.name,
        nim: regData.nim,
        email: regData.email,
        phone: regData.phone,
        password: regData.password
      });
      
      setRegSuccess('Pendaftaran berhasil! Silakan masuk.');
      setTimeout(() => {
        setIsLoginMode(true);
        // Pre-fill email for login convenience
        setEmail(regData.email);
        setPassword('');
        setRegSuccess('');
        setRegData({ name: '', nim: '', email: '', phone: '', password: '', confirmPassword: '' });
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const errorResponse = error?.response?.data;
      if (errorResponse?.message) {
        if (Array.isArray(errorResponse.message)) {
          setRegError(errorResponse.message.join(', '));
        } else {
          setRegError(errorResponse.message);
        }
      } else {
        setRegError('Registrasi gagal. Silakan coba lagi.');
      }
    } finally {
      setIsRegistering(false);
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
          <div className={`auth-form-wrapper animate-enter delay-2 ${!isLoginMode ? 'register-mode' : ''}`}>
            
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
              <div className={`slide-content login-view ${isLoginMode ? 'active' : 'inactive'}`}>
                <div className="auth-form-header">
                  <h2>Masuk Portal</h2>
                  <p>Masukkan Email Anda untuk melanjutkan.</p>
                </div>

                {loginError && (
                  <div className="auth-error">
                    {loginError}
                  </div>
                )}
                {regSuccess && (
                  <div className="auth-error" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                    {regSuccess}
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
                      required={isLoginMode}
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
                      required={isLoginMode}
                    />
                  </div>

                  <button type="submit" disabled={isLoggingIn} className="btn-primary">
                    {isLoggingIn ? 'Memproses...' : 'Masuk'}
                  </button>
                </form>

                <div className="auth-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <p style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>
                    Belum punya akun?{' '}
                    <button type="button" onClick={() => setIsLoginMode(false)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: '500', cursor: 'pointer', padding: 0 }}>
                      Daftar di sini
                    </button>
                  </p>
                </div>
              </div>

              {/* --- REGISTER VIEW --- */}
              <div className={`slide-content register-view ${!isLoginMode ? 'active' : 'inactive'}`}>
                <div className="auth-form-header">
                  <h2>Daftar Akun Baru</h2>
                  <p>Lengkapi data di bawah ini untuk mendaftar.</p>
                </div>

                {regError && (
                  <div className="auth-error">
                    {regError}
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="auth-form">
                  <div className="input-group">
                    <label htmlFor="name">Nama Lengkap</label>
                    <input 
                      type="text" 
                      id="name" 
                      className="input-control"
                      value={regData.name}
                      onChange={handleRegChange}
                      placeholder="John Doe"
                      required={!isLoginMode}
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="nim">Nomor Induk Mahasiswa (NIM) <span style={{fontSize: '0.8em', color: '#94a3b8'}}>(Opsional)</span></label>
                    <input 
                      type="text" 
                      id="nim" 
                      className="input-control"
                      value={regData.nim}
                      onChange={handleRegChange}
                      placeholder="Jika sudah ada"
                      required={false}
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      className="input-control"
                      value={regData.email}
                      onChange={handleRegChange}
                      placeholder="email@mhs.unesa.ac.id"
                      required={!isLoginMode}
                    />
                  </div>
                  
                  <div className="input-group">
                    <label htmlFor="phone">Nomor HP/WhatsApp</label>
                    <input 
                      type="text" 
                      id="phone" 
                      className="input-control"
                      value={regData.phone}
                      onChange={handleRegChange}
                      placeholder="081234567890"
                      required={!isLoginMode}
                    />
                  </div>
                  
                  <div className="input-group">
                    <label htmlFor="reg_password">Password</label>
                    <input 
                      type="password" 
                      id="password" 
                      className="input-control"
                      value={regData.password}
                      onChange={handleRegChange}
                      placeholder="Minimal 8 karakter"
                      required={!isLoginMode}
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="confirmPassword">Konfirmasi Password</label>
                    <input 
                      type="password" 
                      id="confirmPassword" 
                      className="input-control"
                      value={regData.confirmPassword}
                      onChange={handleRegChange}
                      placeholder="Ulangi password"
                      required={!isLoginMode}
                    />
                  </div>

                  <button type="submit" disabled={isRegistering} className="btn-primary">
                    {isRegistering ? 'Memproses...' : 'Daftar Sekarang'}
                  </button>
                </form>

                <div className="auth-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <p style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>
                    Sudah punya akun?{' '}
                    <button type="button" onClick={() => setIsLoginMode(true)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: '500', cursor: 'pointer', padding: 0 }}>
                      Masuk di sini
                    </button>
                  </p>
                </div>
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
