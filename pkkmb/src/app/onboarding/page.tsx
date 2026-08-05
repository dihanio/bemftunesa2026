"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Info, CheckCircle2, LogOut } from "lucide-react";

import PhotoCropDialog from "@/components/onboarding/PhotoCropDialog";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [croppedAvatarBlob, setCroppedAvatarBlob] = useState<Blob | null>(null);
  const [croppedAvatarUrl, setCroppedAvatarUrl] = useState<string | null>(null);
  const [ktmFile, setKtmFile] = useState<File | null>(null);
  const [ktmPreviewUrl, setKtmPreviewUrl] = useState<string | null>(null);

  const handleImageCropped = (blob: Blob, url: string) => {
    setCroppedAvatarBlob(blob);
    setCroppedAvatarUrl(url);
  };

  const toBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const [formData, setFormData] = useState({
    nim: "",
    name: "",
    department: "",
    gender: "",
    phone: "",
    emergencyContact: "",

  });

  const [searchDept, setSearchDept] = useState("");

  useEffect(() => {
    // 1. Try to load from localStorage first for immediate UI update
    const saved = localStorage.getItem('onboardingFormData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData(parsed);
        if (parsed.department) setSearchDept(parsed.department);
      } catch (e) {
        console.error("Failed to parse saved form data", e);
      }
    }

    const savedAvatar = localStorage.getItem('onboardingAvatarBase64');
    if (savedAvatar) {
       fetch(savedAvatar).then(r => r.blob()).then(blob => {
           setCroppedAvatarBlob(blob);
           setCroppedAvatarUrl(savedAvatar);
       }).catch(console.error);
    }

    const savedKtm = localStorage.getItem('onboardingKtmBase64');
    if (savedKtm) {
       fetch(savedKtm).then(r => r.blob()).then(blob => {
           setKtmFile(new File([blob], blob.type === 'application/pdf' ? 'ktm.pdf' : 'ktm.png', { type: blob.type }));
           setKtmPreviewUrl(savedKtm);
       }).catch(console.error);
    }

    const savedStep = localStorage.getItem('onboardingStep');
    if (savedStep) {
      setStep(Number(savedStep));
    }

    // 2. Fetch from backend to ensure we have the latest server truth
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            const p = data.data;
            if (p.isOnboarded) {
              router.push('/dashboard');
              return;
            }
            // Merge backend data with local data if backend has it
            setFormData(prev => {
              const updated = {
                nim: p.nim || prev.nim,
                name: p.name || prev.name,
                department: p.studyProgram || prev.department, // Use studyProgram from DB
                gender: p.gender || prev.gender,
                phone: p.phone || prev.phone,
                emergencyContact: p.emergencyContact || prev.emergencyContact,
              };
              return updated;
            });
            
            if (p.studyProgram && !saved) setSearchDept(p.studyProgram);
            if (p.avatar && !p.avatar.startsWith('blob:')) setCroppedAvatarUrl(p.avatar);
            if (p.ktmUrl) setKtmPreviewUrl(p.ktmUrl);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, [router]);

  // Auto-save to localStorage whenever formData changes
  useEffect(() => {
    localStorage.setItem('onboardingFormData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (croppedAvatarBlob) {
      toBase64(croppedAvatarBlob).then(b64 => {
        try { localStorage.setItem('onboardingAvatarBase64', b64); } catch (e) { console.error("Storage full?", e); }
      }).catch(console.error);
    } else {
      localStorage.removeItem('onboardingAvatarBase64');
    }
  }, [croppedAvatarBlob]);

  useEffect(() => {
    if (ktmFile) {
      toBase64(ktmFile).then(b64 => {
        try { localStorage.setItem('onboardingKtmBase64', b64); } catch (e) { console.error("Storage full?", e); }
      }).catch(console.error);
    } else {
      localStorage.removeItem('onboardingKtmBase64');
    }
  }, [ktmFile]);

  useEffect(() => {
    localStorage.setItem('onboardingStep', step.toString());
  }, [step]);
  
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const departments = [
    "S1 Teknik Elektro",
    "S1 Pendidikan Teknik Elektro",
    "S1 Teknik Informatika", 
    "S1 Sistem Informasi", 
    "S1 Pendidikan Teknologi Informasi", 
    "S1 Teknik Mesin", 
    "S1 Pendidikan Teknik Mesin",
    "S1 Pendidikan Vokasional Teknologi Otomotif",
    "S1 Teknik Sipil", 
    "S1 Pendidikan Teknik Bangunan",
    "S1 Teknik Pertambangan",
    "S1 Teknik Metalurgi",
    "S1 Perencanaan Wilayah dan Kota",
    "S1 Pendidikan Tata Boga",
    "S1 Pendidikan Tata Busana",
    "S1 Pendidikan Tata Rias",
    "S1 Gizi",
    "S1 Pariwisata",
    "S1 Pendidikan Kesejahteraan Keluarga"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = () => {
    if (!formData.nim || !formData.name || !formData.department || !formData.gender || !formData.phone || !formData.emergencyContact) {
      setError("Mohon lengkapi semua data diri sebelum melanjutkan.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    setError(null);
    setStep(2);
    // Optionally also save the step index to local storage if desired, but form data is enough.
  };

  const handleSaveAndContinue = async () => {
    setIsLoading(true);
    try {
      let finalAvatarKey = croppedAvatarUrl || '';
      
      if (croppedAvatarBlob) {
        const uploadForm = new FormData();
        uploadForm.append("file", croppedAvatarBlob, "avatar.webp");
        const uploadRes = await fetch(`${API_URL}/api/v1/contents/upload`, {
          method: "POST",
          body: uploadForm,
          credentials: "include",
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalAvatarKey = uploadData.fileUrl;
        } else {
          alert("Gagal mengunggah foto.");
          setIsLoading(false);
          return;
        }
      }

      let finalKtmKey = ktmPreviewUrl || '';
      if (ktmFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", ktmFile, ktmFile.name);
        const uploadRes = await fetch(`${API_URL}/api/v1/contents/upload`, {
          method: "POST",
          body: uploadForm,
          credentials: "include",
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalKtmKey = uploadData.fileUrl;
        } else {
          alert("Gagal mengunggah KTM.");
          setIsLoading(false);
          return;
        }
      }

      const payload = {
        ...formData,
        avatarObjectKey: finalAvatarKey,
        ktmObjectKey: finalKtmKey,
      };

      const res = await fetch(`${API_URL}/api/v1/pkkmb/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (res.ok) {
        localStorage.removeItem('onboardingFormData'); // clear saved data on success
        localStorage.removeItem('onboardingAvatarBase64');
        localStorage.removeItem('onboardingKtmBase64');
        localStorage.removeItem('onboardingStep');
        setStep(4);
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Terjadi kesalahan saat menyimpan data.");
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("Gagal terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
      router.push("/login");
    } catch (e) {
      console.error(e);
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-body relative overflow-x-hidden p-4 sm:p-8 py-12">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <Image src="/images/gedung_ft_new.jpeg" alt="Background" fill priority className="object-cover opacity-[0.03] mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black" />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gold-500/20 blur-[150px] rounded-full mix-blend-screen" 
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.1, 0.05] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-blue-500/10 blur-[150px] rounded-full mix-blend-screen" 
        />
      </div>

      {/* Main Glass Container */}
      <div className="relative z-10 w-full max-w-5xl my-auto mx-auto flex flex-col lg:flex-row bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Left Pane - Branding & Steps */}
        <div className="w-full lg:w-[40%] p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 bg-gradient-to-br from-white/[0.05] to-transparent relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-500 to-transparent" />
          
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 relative mb-6">
              <Image src="/logo_adrata.png" alt="Logo Adrata" fill sizes="80px" priority className="object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
            </div>
            
            <h1 className="font-display text-3xl font-bold mb-4">
              Selamat Datang di <br />
              <span className="text-gold-500">Keluarga Teknik!</span>
            </h1>
            <p className="text-white/50 text-sm leading-relaxed mb-12">
              Sebelum memulai perjalanan luar biasamu di Fakultas Teknik UNESA, mari kita lengkapi profil identitasmu.
            </p>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px before:h-full before:w-[2px] before:bg-white/10">
            {/* Step 1 */}
            <div className={`relative flex items-start gap-5 transition-all duration-500 ${step >= 1 ? "opacity-100" : "opacity-40 grayscale"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 z-10 transition-colors duration-500 ${step > 1 ? "bg-gold-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" : step === 1 ? "bg-black border-2 border-gold-500 text-gold-500" : "bg-black border-2 border-white/20 text-white/40"}`}>
                {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : "1"}
              </div>
              <div className="pt-1">
                <h3 className={`font-bold transition-colors ${step >= 1 ? "text-white" : "text-white/40"}`}>Data Diri</h3>
                <p className="text-xs text-white/40 mt-1">Identitas resmi akademik</p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className={`relative flex items-start gap-5 transition-all duration-500 ${step >= 2 ? "opacity-100" : "opacity-40 grayscale"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 z-10 transition-colors duration-500 ${step > 2 ? "bg-gold-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" : step === 2 ? "bg-black border-2 border-gold-500 text-gold-500" : "bg-black border-2 border-white/20 text-white/40"}`}>
                {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : "2"}
              </div>
              <div className="pt-1">
                <h3 className={`font-bold transition-colors ${step >= 2 ? "text-white" : "text-white/40"}`}>Pasfoto Resmi</h3>
                <p className="text-xs text-white/40 mt-1">Unggah pasfoto 3x4 formal</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`relative flex items-start gap-5 transition-all duration-500 ${step >= 3 ? "opacity-100" : "opacity-40 grayscale"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 z-10 transition-colors duration-500 ${step > 3 ? "bg-gold-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" : step === 3 ? "bg-black border-2 border-gold-500 text-gold-500" : "bg-black border-2 border-white/20 text-white/40"}`}>
                {step > 3 ? <CheckCircle2 className="w-5 h-5" /> : "3"}
              </div>
              <div className="pt-1">
                <h3 className={`font-bold transition-colors ${step >= 3 ? "text-white" : "text-white/40"}`}>Unggah KTM</h3>
                <p className="text-xs text-white/40 mt-1">Kartu Tanda Mahasiswa Sementara</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className={`relative flex items-start gap-5 transition-all duration-500 ${step >= 4 ? "opacity-100" : "opacity-40 grayscale"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 z-10 transition-colors duration-500 ${step === 4 ? "bg-gold-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" : "bg-black border-2 border-white/20 text-white/40"}`}>
                4
              </div>
              <div className="pt-1">
                <h3 className={`font-bold transition-colors ${step >= 4 ? "text-white" : "text-white/40"}`}>Penetapan Adrista</h3>
                <p className="text-xs text-white/40 mt-1">Sistem mengatur kelompok gugus</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-3 text-sm text-blue-200">
            <Info className="w-5 h-5 shrink-0 text-blue-400" />
            <p className="leading-relaxed text-xs">Pastikan data sesuai dengan KTM. Data ini krusial untuk penilaian akhir PKKMB.</p>
          </div>

          <div className="mt-6 flex justify-center lg:justify-start">
            <button 
              onClick={handleLogout}
              className="text-white/40 hover:text-red-400 text-xs font-semibold flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
            >
              <LogOut className="w-4 h-4" /> Keluar dari Akun
            </button>
          </div>
        </div>

        {/* Right Pane - Dynamic Form Content */}
        <div className="w-full lg:w-[60%] p-8 lg:p-12 relative overflow-y-auto custom-scrollbar max-h-[85vh]">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="flex lg:hidden justify-between items-center mb-8">
            <div className="text-sm font-bold text-gold-500">
              Langkah {step} dari 4
            </div>
            <button 
              onClick={handleLogout}
              className="text-white/40 hover:text-red-400 text-xs font-semibold flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 flex flex-col h-full"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Konfirmasi Data Diri</h2>
                  <p className="text-white/50 text-sm">Harap periksa dan lengkapi rincian informasi di bawah ini.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
                  {/* Floating Label Inputs */}
                  <div className="relative group">
                    <input type="text" name="nim" id="nim" value={formData.nim} onChange={handleChange} placeholder=" " className="peer block w-full px-5 pt-7 pb-2 text-white bg-white/5 border border-white/10 rounded-xl appearance-none focus:outline-none focus:ring-0 focus:border-gold-500 focus:bg-white/10 transition-all" />
                    <label htmlFor="nim" className="absolute text-xs font-bold text-white/50 uppercase tracking-wider duration-300 transform -translate-y-2.5 scale-90 top-4 z-10 origin-[0] left-5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-90 peer-focus:-translate-y-2.5 peer-focus:text-gold-500">
                      NIM (Nomor Induk)
                    </label>
                  </div>

                  <div className="relative group">
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} placeholder=" " className="peer block w-full px-5 pt-7 pb-2 text-white bg-white/5 border border-white/10 rounded-xl appearance-none focus:outline-none focus:ring-0 focus:border-gold-500 focus:bg-white/10 transition-all" />
                    <label htmlFor="name" className="absolute text-xs font-bold text-white/50 uppercase tracking-wider duration-300 transform -translate-y-2.5 scale-90 top-4 z-10 origin-[0] left-5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-90 peer-focus:-translate-y-2.5 peer-focus:text-gold-500">
                      Nama Lengkap
                    </label>
                  </div>

                  <div className="relative group sm:col-span-2">
                    {isDeptDropdownOpen && (
                      <div className="fixed inset-0 z-40" onClick={() => setIsDeptDropdownOpen(false)} />
                    )}
                    <input
                      type="text"
                      value={searchDept}
                      onChange={(e) => {
                        setSearchDept(e.target.value);
                        setIsDeptDropdownOpen(true);
                        if (formData.department && e.target.value !== formData.department) {
                           setFormData({ ...formData, department: "" });
                        }
                      }}
                      onFocus={() => setIsDeptDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsDeptDropdownOpen(false), 200)}
                      onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                      placeholder=" "
                      className={`peer relative w-full px-5 pt-7 pb-2 text-white bg-white/5 border rounded-xl appearance-none transition-all z-50 focus:outline-none focus:ring-0 cursor-text ${isDeptDropdownOpen ? 'border-gold-500 bg-white/10' : 'border-white/10 focus:border-gold-500'}`}
                    />
                    <label className={`absolute text-xs font-bold uppercase tracking-wider duration-300 transform origin-[0] left-5 z-50 pointer-events-none ${searchDept || isDeptDropdownOpen ? 'scale-90 -translate-y-2.5 top-4 text-gold-500' : 'scale-100 translate-y-1.5 top-4 text-white/50 peer-focus:scale-90 peer-focus:-translate-y-2.5 peer-focus:text-gold-500 group-hover:scale-90 group-hover:-translate-y-2.5 group-hover:text-gold-500'}`}>
                      Program Studi
                    </label>
                    <div className={`absolute top-[18px] right-5 flex items-center pointer-events-none z-50 transition-transform duration-300 ${isDeptDropdownOpen ? 'rotate-180 text-gold-500' : 'text-white/40'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>

                    <AnimatePresence>
                      {isDeptDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl"
                        >
                          <div className="max-h-60 overflow-y-auto custom-scrollbar" data-lenis-prevent="true">
                            {departments.filter(d => d.toLowerCase().includes(searchDept.toLowerCase())).map((dept, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setFormData({ ...formData, department: dept });
                                  setSearchDept(dept);
                                  setIsDeptDropdownOpen(false);
                                }}
                                className={`px-5 py-3 cursor-pointer transition-colors flex items-center justify-between ${formData.department === dept ? 'bg-gold-500/10 text-gold-500 font-bold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                              >
                                {dept}
                                {formData.department === dept && <CheckCircle2 className="w-4 h-4 text-gold-500" />}
                              </div>
                            ))}
                            {departments.filter(d => d.toLowerCase().includes(searchDept.toLowerCase())).length === 0 && (
                              <div className="px-5 py-3 text-white/50 text-sm">
                                Program studi tidak ditemukan
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-3 sm:col-span-2 mt-1">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider block ml-1">Jenis Kelamin</label>
                    <div className="flex gap-4">
                      <label className={`flex-1 relative flex items-center justify-center gap-3 border rounded-xl py-4 cursor-pointer transition-all duration-300 overflow-hidden ${formData.gender === 'L' ? 'bg-gold-500/10 border-gold-500 text-gold-400 font-bold shadow-[0_0_20px_rgba(234,179,8,0.15)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}>
                        {formData.gender === 'L' && <div className="absolute inset-0 bg-gradient-to-r from-gold-500/0 via-gold-500/10 to-gold-500/0 animate-shimmer" />}
                        <input type="radio" name="gender" value="L" checked={formData.gender === 'L'} onChange={handleChange} className="hidden" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.gender === 'L' ? 'border-gold-500' : 'border-white/20'}`}>
                          {formData.gender === 'L' && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                        </div>
                        Laki-laki
                      </label>
                      <label className={`flex-1 relative flex items-center justify-center gap-3 border rounded-xl py-4 cursor-pointer transition-all duration-300 overflow-hidden ${formData.gender === 'P' ? 'bg-gold-500/10 border-gold-500 text-gold-400 font-bold shadow-[0_0_20px_rgba(234,179,8,0.15)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}>
                        {formData.gender === 'P' && <div className="absolute inset-0 bg-gradient-to-r from-gold-500/0 via-gold-500/10 to-gold-500/0 animate-shimmer" />}
                        <input type="radio" name="gender" value="P" checked={formData.gender === 'P'} onChange={handleChange} className="hidden" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.gender === 'P' ? 'border-gold-500' : 'border-white/20'}`}>
                          {formData.gender === 'P' && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                        </div>
                        Perempuan
                      </label>
                    </div>
                  </div>

                  <div className="relative group mt-1">
                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} placeholder=" " className="peer block w-full px-5 pt-7 pb-2 text-white bg-white/5 border border-white/10 rounded-xl appearance-none focus:outline-none focus:ring-0 focus:border-gold-500 focus:bg-white/10 transition-all" />
                    <label htmlFor="phone" className="absolute text-xs font-bold text-white/50 uppercase tracking-wider duration-300 transform -translate-y-2.5 scale-90 top-4 z-10 origin-[0] left-5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-90 peer-focus:-translate-y-2.5 peer-focus:text-gold-500">
                      No. WhatsApp Aktif
                    </label>
                  </div>

                  <div className="relative group mt-1">
                    <input type="tel" name="emergencyContact" id="emergencyContact" value={formData.emergencyContact} onChange={handleChange} placeholder=" " className="peer block w-full px-5 pt-7 pb-2 text-white bg-white/5 border border-white/10 rounded-xl appearance-none focus:outline-none focus:ring-0 focus:border-gold-500 focus:bg-white/10 transition-all" />
                    <label htmlFor="emergencyContact" className="absolute text-xs font-bold text-white/50 uppercase tracking-wider duration-300 transform -translate-y-2.5 scale-90 top-4 z-10 origin-[0] left-5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-90 peer-focus:-translate-y-2.5 peer-focus:text-gold-500">
                      No. Darurat (Ortu/Wali)
                    </label>
                  </div>
                </div>

                <div className="pt-8 mt-auto flex flex-col sm:flex-row gap-4 items-center justify-end">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg text-sm border border-red-400/20"
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button 
                    onClick={handleNextStep}
                    className="group flex items-center gap-2 bg-white hover:bg-gold-500 text-black px-8 py-3.5 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-[1.02]"
                  >
                    Lanjutkan ke Unggah Pasfoto
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8 flex flex-col h-full"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Unggah Pasfoto 3x4</h2>
                  <p className="text-white/50 text-sm mb-4">Pasfoto ini akan digunakan pada ID Card Maba dan keperluan administrasi fakultas.</p>
                  
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Ketentuan Pasfoto
                    </p>
                    <ul className="text-white/60 text-sm space-y-2 ml-5 list-disc marker:text-gold-500">
                      <li>Latar belakang (<em>background</em>) wajib berwarna <strong className="text-white">Merah</strong>.</li>
                      <li>Mengenakan kemeja berwarna <strong className="text-white">Putih</strong>.</li>
                      <li>Bagi yang berhijab, wajib mengenakan hijab berwarna <strong className="text-white">Hitam</strong>.</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  {!croppedAvatarUrl ? (
                    <PhotoCropDialog onImageCropped={handleImageCropped} isLoading={isLoading} />
                  ) : (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
                      <div className="flex flex-col items-center justify-center p-10 bg-white/[0.02] border border-white/10 rounded-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative w-[150px] h-[200px] rounded-2xl overflow-hidden border-2 border-gold-500/50 shadow-[0_0_40px_rgba(234,179,8,0.15)] group-hover:border-gold-400 group-hover:shadow-[0_0_50px_rgba(234,179,8,0.3)] transition-all duration-500">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={croppedAvatarUrl?.startsWith('/') ? `${API_URL}${croppedAvatarUrl}` : croppedAvatarUrl || ''} alt="Cropped preview" className="w-full h-full object-cover" />
                        </div>
                        <p className="mt-6 text-green-400 font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          Foto Siap Disimpan
                        </p>
                      </div>
                      
                      <div className="flex justify-center">
                        <button
                          onClick={() => { setCroppedAvatarBlob(null); setCroppedAvatarUrl(null); }}
                          className="px-6 py-2 rounded-full text-sm font-bold text-white/40 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                        >
                          Pilih Foto Lain
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="pt-8 flex justify-between items-center mt-auto">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-white/40 hover:text-white transition-colors"
                  >
                    Kembali
                  </button>
                  <button 
                    onClick={() => setStep(3)}
                    disabled={!croppedAvatarUrl && !croppedAvatarBlob}
                    className="group flex items-center gap-2 bg-gold-500 text-black hover:bg-gold-400 px-8 py-3.5 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-[1.02]"
                  >
                    Lanjut
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8 flex flex-col h-full"
              >
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Unggah KTM / KTMS</h2>
                  <p className="text-white/50 text-sm mb-4">Kartu Tanda Mahasiswa (Sementara) dibutuhkan untuk verifikasi identitas.</p>
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  {!ktmPreviewUrl ? (
                    <div className="border-2 border-dashed border-white/20 rounded-3xl p-10 flex flex-col items-center justify-center text-center bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative">
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setKtmFile(file);
                            setKtmPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <svg className="w-12 h-12 text-white/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      <p className="font-bold mb-2">Klik atau Seret file ke sini</p>
                      <p className="text-xs text-white/40">Maks. 2MB (JPG, PNG, PDF)</p>
                    </div>
                  ) : (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
                      <div className="flex flex-col items-center justify-center p-10 bg-white/[0.02] border border-white/10 rounded-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative w-full max-w-[300px] h-[200px] rounded-2xl overflow-hidden border-2 border-gold-500/50 shadow-[0_0_40px_rgba(234,179,8,0.15)] group-hover:border-gold-400 group-hover:shadow-[0_0_50px_rgba(234,179,8,0.3)] transition-all duration-500 flex items-center justify-center bg-black">
                          {ktmFile?.type === 'application/pdf' || ktmPreviewUrl.endsWith('.pdf') ? (
                            <div className="text-center p-4">
                              <svg className="w-16 h-16 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                              <p className="font-bold text-sm break-all">{ktmFile?.name || "KTM.pdf"}</p>
                            </div>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ktmPreviewUrl.startsWith('/') ? `${API_URL}${ktmPreviewUrl}` : ktmPreviewUrl} alt="KTM preview" className="w-full h-full object-contain" />
                          )}
                        </div>
                        <p className="mt-6 text-green-400 font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          File KTM Dipilih
                        </p>
                      </div>
                      
                      <div className="flex justify-center">
                        <button
                          onClick={() => { setKtmFile(null); setKtmPreviewUrl(null); }}
                          className="px-6 py-2 rounded-full text-sm font-bold text-white/40 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                        >
                          Ganti File
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="pt-8 flex justify-between items-center mt-auto">
                  <button 
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-white/40 hover:text-white transition-colors"
                  >
                    Kembali
                  </button>
                  <button 
                    onClick={handleSaveAndContinue}
                    disabled={!ktmPreviewUrl || isLoading}
                    className="group flex items-center gap-2 bg-gold-500 text-black hover:bg-gold-400 px-8 py-3.5 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-[1.02]"
                  >
                    {isLoading ? "Menyimpan..." : "Simpan & Lanjut"}
                    {!isLoading && <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center h-full min-h-[400px]"
              >
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, delay: 0.1 }}
                  className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 mb-8 shadow-[0_0_50px_rgba(34,197,94,0.2)]"
                >
                  <CheckCircle2 className="w-12 h-12" />
                </motion.div>
                
                <h2 className="text-3xl font-display font-bold text-white mb-4">Onboarding Selesai!</h2>
                <p className="text-white/50 text-sm max-w-sm mx-auto mb-10 leading-relaxed">
                  Terima kasih telah melengkapi profil. Data Anda telah berhasil disimpan di dalam sistem keamanan BEM FT UNESA.
                </p>
                
                <div className="p-6 rounded-2xl bg-gradient-to-b from-gold-500/10 to-transparent border border-gold-500/20 inline-block mb-10 max-w-sm w-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50" />
                  <p className="text-gold-500/80 text-xs font-bold uppercase tracking-wider mb-2">Status Gugus Adrista</p>
                  <p className="text-2xl font-bold text-gold-400 mb-3 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">Sedang Diproses</p>
                  <p className="text-xs text-gold-200/50 leading-relaxed">Sistem Panitia sedang mengalokasikan kelompok gugus. Silakan pantau Dashboard Anda secara berkala.</p>
                </div>
                
                <button 
                  onClick={() => router.push("/dashboard")}
                  className="w-full max-w-sm flex items-center justify-center gap-2 bg-white text-black hover:bg-gold-500 px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:scale-[1.02]"
                >
                  Masuk ke Dashboard Maba
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
