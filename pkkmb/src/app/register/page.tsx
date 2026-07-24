"use client";

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth/api/auth.api';
import Image from 'next/image';
import '../login/login.css'; // Reuse login CSS for consistent UI

function RegisterContent() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    nim: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Frontend Validations
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Password dan Konfirmasi Password tidak cocok.');
      return;
    }
    if (formData.password.length < 8) {
      setErrorMsg('Password minimal 8 karakter.');
      return;
    }
    
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMsg('Format email tidak valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.registerMaba({
        name: formData.name,
        nim: formData.nim,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      
      setSuccessMsg('Pendaftaran berhasil! Mengalihkan ke halaman login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const errorResponse = error?.response?.data;
      if (errorResponse?.message) {
        if (Array.isArray(errorResponse.message)) {
          setErrorMsg(errorResponse.message.join(', '));
        } else {
          setErrorMsg(errorResponse.message);
        }
      } else {
        setErrorMsg('Registrasi gagal. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
            
            <div className="auth-form-header animate-enter delay-3">
              <h2>Daftar Akun Baru</h2>
              <p>Masukkan data diri Anda untuk mendaftar.</p>
            </div>

            {errorMsg && (
              <div className="auth-error animate-enter delay-3">
                {errorMsg}
              </div>
            )}
            
            {successMsg && (
              <div className="auth-error animate-enter delay-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group animate-enter delay-4">
                <label htmlFor="name">Nama Lengkap</label>
                <input 
                  type="text" 
                  id="name" 
                  className="input-control"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required 
                />
              </div>

              <div className="input-group animate-enter delay-4">
                <label htmlFor="nim">Nomor Induk Mahasiswa (NIM)</label>
                <input 
                  type="text" 
                  id="nim" 
                  className="input-control"
                  value={formData.nim}
                  onChange={handleChange}
                  placeholder="24050001"
                  required 
                />
              </div>

              <div className="input-group animate-enter delay-4">
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  className="input-control"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@mhs.unesa.ac.id"
                  required 
                />
              </div>
              
              <div className="input-group animate-enter delay-4">
                <label htmlFor="phone">Nomor HP/WhatsApp</label>
                <input 
                  type="text" 
                  id="phone" 
                  className="input-control"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="081234567890"
                  required 
                />
              </div>
              
              <div className="input-group animate-enter delay-5">
                <label htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  className="input-control"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimal 8 karakter"
                  required 
                />
              </div>

              <div className="input-group animate-enter delay-5">
                <label htmlFor="confirmPassword">Konfirmasi Password</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  className="input-control"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ulangi password"
                  required 
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary animate-enter delay-6" style={{ marginTop: '1rem' }}>
                {isSubmitting ? 'Memproses...' : 'Daftar'}
              </button>
            </form>

            <div className="auth-footer animate-enter delay-7" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Sudah punya akun?{' '}
                <a href="/login" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: '500' }}>
                  Masuk di sini
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
// Trigger rebuild
