"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import PhotoCropDialog from "@/components/onboarding/PhotoCropDialog";
import QRCode from "react-qr-code";

interface ProfileData {
  nim?: string;
  name?: string;
  studyProgram?: string;
  department?: string | { name: string };
  gender?: string;
  phone?: string;
  emergencyContact?: string;
  avatar?: string;
  verificationToken?: string;
  pkkmbGroup?: { _id: string; nomor: number; name: string; pendampingId?: { name: string; phone: string } };
}

export default function ProfilPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [croppedAvatarBlob, setCroppedAvatarBlob] = useState<Blob | null>(null);
  const [croppedAvatarUrl, setCroppedAvatarUrl] = useState<string | null>(null);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nim: "",
    name: "",
    department: "",
    gender: "",
    phone: "",
    emergencyContact: "",
  });

  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [searchDept, setSearchDept] = useState("");
  const [message, setMessage] = useState<{type: "error" | "success", text: string} | null>(null);
  
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [res, pointsRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/auth/me`, { credentials: "include" }),
          fetch(`${API_URL}/api/v1/pkkmb/maba/points/summary`, { credentials: "include" })
        ]);

        if (pointsRes.ok) {
          const pointsJson = await pointsRes.json();
          if (pointsJson.success) {
            setTotalPoints(pointsJson.data.totalPoints);
          }
        }

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            const p = data.data;
            setProfileData(p);
            setFormData({
              nim: p.nim || "",
              name: p.name || "",
              department: p.studyProgram || p.department?.name || p.department || "",
              gender: p.gender || "",
              phone: p.phone || "",
              emergencyContact: p.emergencyContact || "",
            });
            if (p.studyProgram || p.department) {
              setSearchDept(p.studyProgram || (p.department?.name) || p.department);
            }
            if (p.avatar && !p.avatar.startsWith('blob:')) {
              setCroppedAvatarUrl(p.avatar);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageCropped = (blob: Blob, url: string) => {
    setCroppedAvatarBlob(blob);
    setCroppedAvatarUrl(url);
    setIsEditingPhoto(false);
  };

  const handleSave = async () => {
    if (!formData.nim || !formData.name || !formData.department || !formData.gender || !formData.phone || !formData.emergencyContact) {
      setMessage({ type: "error", text: "Mohon lengkapi semua data diri." });
      setTimeout(() => setMessage(null), 4000);
      return;
    }
    
    setIsSaving(true);
    setMessage(null);
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
          setMessage({ type: "error", text: "Gagal mengunggah foto." });
          setIsSaving(false);
          return;
        }
      }

      const payload = {
        ...formData,
        avatarObjectKey: finalAvatarKey,
      };

      const res = await fetch(`${API_URL}/api/v1/pkkmb/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
        setCroppedAvatarBlob(null); // Clear blob so it doesn't reupload
      } else {
        const errorData = await res.json();
        setMessage({ type: "error", text: errorData.message || "Terjadi kesalahan saat menyimpan data." });
      }
    } catch (error) {
      console.error("Save error:", error);
      setMessage({ type: "error", text: "Gagal terhubung ke server." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  const avatarDisplayUrl = croppedAvatarUrl?.startsWith('/') ? `${API_URL}${croppedAvatarUrl}` : croppedAvatarUrl || '';

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto pb-12">
      {/* Digital ID Card Section */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-bold font-display text-white mb-6">Digital ID Card</h2>
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-center">
          {/* Card UI */}
          <div className="w-[300px] h-[450px] relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-b from-gold-500/20 to-black/80 backdrop-blur-md flex flex-col items-center pt-8 pb-6">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
            
            {/* Header */}
            <div className="text-center z-10 mb-6">
              <h3 className="font-display font-bold text-gold-500 text-xl tracking-wider">PKKMB FT UNESA</h3>
              <p className="text-white/70 text-xs font-semibold tracking-widest">ADRATA 2026</p>
            </div>
            
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-gold-600 to-yellow-300 z-10 mb-4 shadow-lg">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#111] border-2 border-black relative">
                {avatarDisplayUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarDisplayUrl} referrerPolicy="no-referrer" alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gold-500 font-bold text-3xl">
                    {formData.name?.charAt(0) || "M"}
                  </div>
                )}
              </div>
            </div>
            
            {/* Info */}
            <div className="text-center z-10 flex-1 flex flex-col">
              <h2 className="font-bold text-white text-lg px-4 leading-tight mb-1">{formData.name || 'Nama Belum Diisi'}</h2>
              <p className="text-gold-400 font-mono text-sm mb-2">{formData.nim || 'NIM Belum Diisi'}</p>
              
              <div className="mt-auto flex flex-col gap-1 items-center">
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white/90 border border-white/10 uppercase tracking-wider">
                  {profileData?.pkkmbGroup?.name || 'BELUM ADA GUGUS'}
                </span>
                <span className="text-xs text-white/50 mb-2">{formData.department || 'Prodi Belum Diisi'}</span>
              </div>
              
              <div className="mt-2 pt-3 border-t border-white/10 w-full">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold mb-0.5">Total Skor Keaktifan</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-display font-black text-gold-400">{totalPoints !== null ? totalPoints : '...'}</span>
                    <span className="text-[10px] text-gold-400/50 uppercase">PTS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* QR Code Section */}
          <div className="w-[300px] h-[450px] relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-b from-black/80 to-gold-500/20 backdrop-blur-md flex flex-col items-center justify-center p-6">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
            
            <h3 className="text-gold-500 font-display font-bold text-lg uppercase tracking-wider z-10 mb-6">Validasi Identitas</h3>
            <div className="p-4 bg-white rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.2)] z-10 mb-6">
              {profileData?.verificationToken ? (
                <QRCode value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${profileData.verificationToken}`} size={160} level="H" />
              ) : (
                <div className="w-[160px] h-[160px] bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-xs text-center">NIM belum ada</span>
                </div>
              )}
            </div>
            
            <div className="mt-auto z-10 flex flex-col items-center w-full">
              <p className="text-white/40 text-xs text-center max-w-[220px]">
                Scan QR Code ini untuk verifikasi identitas publik.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-bold font-display text-white mb-6">Profil & Biodata</h2>
        
        {message && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Photo Section */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold text-white">Pasfoto 3x4</h3>
            <div className="bg-black/50 border-2 border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              {isEditingPhoto ? (
                <div className="w-full relative min-h-[300px]">
                   <PhotoCropDialog onImageCropped={handleImageCropped} isLoading={isSaving} />
                </div>
              ) : (
                <>
                  <div className="relative w-[150px] h-[200px] rounded-xl overflow-hidden border border-white/20 mb-4 bg-white/5">
                    {avatarDisplayUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarDisplayUrl} alt="Pasfoto" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        Belum ada foto
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setIsEditingPhoto(true)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Ganti Foto
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Form Section */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-white">Informasi Pribadi</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block ml-1">Nama Lengkap</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-5 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block ml-1">NIM</label>
                <input
                  type="text"
                  name="nim"
                  value={formData.nim}
                  onChange={handleChange}
                  className="w-full px-5 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1 sm:col-span-2 relative">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block ml-1">Program Studi</label>
                <div className="relative">
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
                    onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                    onFocus={() => setIsDeptDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDeptDropdownOpen(false), 200)}
                    className="w-full px-5 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:border-gold-500 focus:outline-none"
                  />
                  {isDeptDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#111] border border-white/10 rounded-xl max-h-60 overflow-y-auto" data-lenis-prevent="true">
                      {departments.filter(d => d.toLowerCase().includes(searchDept.toLowerCase())).map((dept, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setFormData({ ...formData, department: dept });
                            setSearchDept(dept);
                            setIsDeptDropdownOpen(false);
                          }}
                          className="px-5 py-3 cursor-pointer text-white/70 hover:bg-white/5 hover:text-white"
                        >
                          {dept}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block ml-1">Jenis Kelamin</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-5 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:border-gold-500 focus:outline-none appearance-none"
                >
                  <option value="" className="bg-[#111]">Pilih...</option>
                  <option value="L" className="bg-[#111]">Laki-laki</option>
                  <option value="P" className="bg-[#111]">Perempuan</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block ml-1">No. WhatsApp</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-5 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block ml-1">Kontak Darurat (Ortu/Wali)</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className="w-full px-5 py-3 text-white bg-white/5 border border-white/10 rounded-xl focus:border-gold-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] disabled:opacity-50 text-base"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
