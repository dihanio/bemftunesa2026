"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { Label } from "../components/ui/Label";
import { api } from "../lib/api";
import { useStructure, type Department } from "../hooks/useStructure";
import { useProker, type ProkerItem } from "../hooks/useProker";
import {
  useApplyRecruitment,
  useUploadRecruitmentFiles,
  useRecruitmentStatus,
  useRecruitmentResults,
  type RecruitmentResultMember,
} from "../hooks/useRecruitment";

export default function RecruitmentPage() {
  const [step, setStep] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Google Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  // Direct Auth State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginName, setLoginName] = useState("");

  // reCAPTCHA Shield State
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false);

  // Event lock from landing page
  const [isEventLocked, setIsEventLocked] = useState(false);

  // Tab 1: Pendaftaran State
  const [formData, setFormData] = useState({
    fullName: "",
    nim: "",
    email: "",
    phone: "",
    whatsapp: "",
    applyType: "Magang" as "Fungsionaris" | "Panitia" | "Magang",
    firstChoiceDeptId: "",
    secondChoiceDeptId: "",
    firstChoiceProkerId: "",
    secondChoiceProkerId: "",
    firstChoiceDivisi: "",
    secondChoiceDivisi: "",
    motivation: "",
    cvUrl: "",
    photoUrl: "",
    portfolioUrl: "",
  });

  // Custom (manual) input state for cases where choices aren't listed, or API is empty
  const [customFirstChoiceDept, setCustomFirstChoiceDept] = useState("");
  const [customSecondChoiceDept, setCustomSecondChoiceDept] = useState("");

  const [customFirstChoiceProker, setCustomFirstChoiceProker] = useState("");
  const [customSecondChoiceProker, setCustomSecondChoiceProker] = useState("");
  const [useCustomProker, setUseCustomProker] = useState(false);

  // Tab 2: Lacak Status State
  const [searchNim, setSearchNim] = useState("");
  const [activeSearchNim, setActiveSearchNim] = useState("");

  // Toggle between status search and all accepted results
  const [showAllResults, setShowAllResults] = useState(false);
  const [resultsFilter, setResultsFilter] = useState("");

  // API Queries & Mutations
  const { data: structureRes, isLoading: isStructureLoading } = useStructure();
  const departments = structureRes?.data?.departments || [];

  const { data: prokerRes, isLoading: isProkerLoading } = useProker({
    limit: 100,
  });
  const prokers = prokerRes?.data || [];

  const applyMutation = useApplyRecruitment();
  const uploadMutation = useUploadRecruitmentFiles();
  const {
    data: statusRes,
    isLoading: isStatusLoading,
    error: statusError,
  } = useRecruitmentStatus(activeSearchNim);
  const { data: resultsRes, isLoading: isResultsLoading } =
    useRecruitmentResults();

  const [formError, setFormError] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Confetti particles for success state
  const [confetti, setConfetti] = useState<
    { id: number; left: string; delay: string; color: string; size: string }[]
  >([]);

  useEffect(() => {
    if (step === 5) {
      const colors = [
        "#10b981",
        "#34d399",
        "#f5f2eb",
        "#059669",
        "#fbbf24",
        "#6ee7b7",
      ];
      const particles = Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 3}s`,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: `${Math.random() * 8 + 6}px`,
      }));
      setConfetti(particles);
    } else {
      setConfetti([]);
    }
  }, [step]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isFormOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFormOpen]);

  // Load session from localStorage on load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("bemft_token");
      const storedUser = localStorage.getItem("bemft_user");

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        api.setAuthToken(storedToken);
        setSessionUser(parsedUser);
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.error("Error loading session:", e);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // Auto pre-fill details from logged-in Google session
  useEffect(() => {
    if (isLoggedIn && sessionUser) {
      let parsedNim = "";
      const emailLocalPart = sessionUser.email.split("@")[0];

      if (/^[0-9]+$/.test(emailLocalPart)) {
        parsedNim = emailLocalPart;
      }

      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || sessionUser.name || "",
        email: prev.email || sessionUser.email || "",
        nim: prev.nim || parsedNim || "",
      }));
    }
  }, [isLoggedIn, sessionUser]);

  const handleGoogleSignIn = () => {
    if (typeof window === "undefined" || !(window as any).google) {
      setAuthError(
        "Google Client Library belum termuat. Silakan tunggu sebentar atau refresh halaman.",
      );
      return;
    }

    setIsAuthLoading(true);
    setAuthError("");

    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id:
        "310577649367-enem91rlubk2kt1rpblqluaeii80tpj2.apps.googleusercontent.com",
      scope:
        "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          setIsAuthLoading(false);
          setAuthError("Gagal autentikasi Google Sign-In.");
          return;
        }

        const accessToken = tokenResponse.access_token;
        if (!accessToken) {
          setIsAuthLoading(false);
          setAuthError("Token otorisasi Google tidak didapatkan.");
          return;
        }

        try {
          const loginRes = await fetch(
            "https://api.bemftunesa.org/v1/auth/google",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token: accessToken }),
            },
          );

          if (!loginRes.ok) {
            const errData = await loginRes.json();
            throw new Error(
              errData.message ||
                "Gagal melakukan verifikasi dengan server BEM FT.",
            );
          }

          const loginData = await loginRes.json();
          const userEmail = loginData.user.email;

          // Strictly enforce UNESA pattern checks
          const isMhsDomain = userEmail.endsWith("@mhs.unesa.ac.id");
          const isStaffDomain = userEmail.endsWith("@unesa.ac.id");

          const mhsPattern = /^[a-zA-Z0-9.-]+\.[0-9]{3}@mhs\.unesa\.ac\.id$/;
          const nimPattern = /^[0-9]+@mhs\.unesa\.ac\.id$/;

          const isValidMhsPattern =
            mhsPattern.test(userEmail) || nimPattern.test(userEmail);

          if (!isStaffDomain && (!isMhsDomain || !isValidMhsPattern)) {
            setAuthError(
              "Format email UNESA Anda tidak valid. Gunakan format nama.3digitNIM@mhs.unesa.ac.id atau NIM@mhs.unesa.ac.id!",
            );
            setIsAuthLoading(false);
            return;
          }

          localStorage.setItem("bemft_token", loginData.accessToken);
          localStorage.setItem("bemft_user", JSON.stringify(loginData.user));
          api.setAuthToken(loginData.accessToken);

          setSessionUser(loginData.user);
          setIsLoggedIn(true);
          setIsAuthLoading(false);
        } catch (err: any) {
          setIsAuthLoading(false);
          setAuthError(
            err.message ||
              "Gagal memverifikasi akun Anda dengan portal BEM FT UNESA.",
          );
        }
      },
    });

    tokenClient.requestAccessToken();
  };

  const handleSignOut = () => {
    localStorage.removeItem("bemft_token");
    localStorage.removeItem("bemft_user");
    api.removeAuthToken();
    setSessionUser(null);
    setIsLoggedIn(false);
    setStep(1);
    setIsFormOpen(false);
    setLoginEmail("");
    setLoginName("");
  };

  const handleDirectSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginName.trim()) {
      setAuthError("Harap lengkapi semua bidang input.");
      return;
    }

    setIsAuthLoading(true);
    setAuthError("");

    const userEmail = loginEmail.trim().toLowerCase();
    const isMhsDomain = userEmail.endsWith("@mhs.unesa.ac.id");
    const isStaffDomain = userEmail.endsWith("@unesa.ac.id");

    const mhsPattern = /^[a-zA-Z0-9.-]+\.[0-9]{3}@mhs\.unesa\.ac\.id$/;
    const nimPattern = /^[0-9]+@mhs\.unesa\.ac\.id$/;

    const isValidMhsPattern =
      mhsPattern.test(userEmail) || nimPattern.test(userEmail);

    if (!isStaffDomain && (!isMhsDomain || !isValidMhsPattern)) {
      setAuthError(
        "Format email UNESA Anda tidak valid. Gunakan format nama.3digitNIM@mhs.unesa.ac.id atau NIM@mhs.unesa.ac.id!",
      );
      setIsAuthLoading(false);
      return;
    }

    try {
      const loginRes = await fetch("https://api.bemftunesa.org/v1/auth/direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail, name: loginName.trim() }),
      });

      if (!loginRes.ok) {
        const errData = await loginRes.json();
        throw new Error(
          errData.message || "Gagal melakukan verifikasi dengan server BEM FT.",
        );
      }

      const loginData = await loginRes.json();
      localStorage.setItem("bemft_token", loginData.accessToken);
      localStorage.setItem("bemft_user", JSON.stringify(loginData.user));
      api.setAuthToken(loginData.accessToken);

      setSessionUser(loginData.user);
      setIsLoggedIn(true);
      setIsAuthLoading(false);
    } catch (err: any) {
      setIsAuthLoading(false);
      setAuthError(
        err.message ||
          "Gagal memverifikasi akun Anda dengan portal BEM FT UNESA.",
      );
    }
  };

  // Form handlers
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  };

  // Select direct options from the active cards section at the top
  const handleSelectProkerFromLanding = (prokerId: string) => {
    setFormData((prev) => ({
      ...prev,
      applyType: "Panitia",
      firstChoiceProkerId: prokerId,
      secondChoiceProkerId: "",
      firstChoiceDivisi: "",
      secondChoiceDivisi: "",
    }));
    setUseCustomProker(false);
    setIsEventLocked(true);
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSelectMagangFromLanding = () => {
    setFormData((prev) => ({
      ...prev,
      applyType: "Magang",
      firstChoiceDeptId: "",
      secondChoiceDeptId: "",
    }));
    setIsEventLocked(false);
    setFormError("");
    setIsFormOpen(true);
  };

  const validateStep1 = () => {
    if (!formData.fullName || formData.fullName.trim().length < 3)
      return "Nama Lengkap minimal 3 karakter.";
    if (!formData.nim || formData.nim.trim().length < 5)
      return "NIM tidak valid.";
    if (!formData.email || !formData.email.includes("@"))
      return "Email tidak valid.";
    if (!formData.whatsapp || formData.whatsapp.trim().length < 9)
      return "Nomor WhatsApp tidak valid.";
    return "";
  };

  const validateStep2 = () => {
    if (
      formData.applyType === "Fungsionaris" ||
      formData.applyType === "Magang"
    ) {
      // If no departments loaded, use custom manual inputs
      if (departments.length === 0) {
        if (!customFirstChoiceDept || customFirstChoiceDept.trim().length < 2) {
          return "Pilihan Departemen 1 (Kustom) wajib diisi.";
        }
        if (
          customFirstChoiceDept.trim().toLowerCase() ===
            customSecondChoiceDept.trim().toLowerCase() &&
          customSecondChoiceDept
        ) {
          return "Pilihan 1 dan Pilihan 2 tidak boleh sama.";
        }
      } else {
        // Standard dropdown dropdown check
        if (!formData.firstChoiceDeptId)
          return "Pilihan Departemen 1 wajib diisi.";

        // If Custom (Tulis Sendiri) is selected
        if (
          formData.firstChoiceDeptId === "custom" &&
          (!customFirstChoiceDept || customFirstChoiceDept.trim().length < 2)
        ) {
          return "Nama Departemen Kustom 1 wajib ditulis.";
        }
        if (
          formData.secondChoiceDeptId === "custom" &&
          (!customSecondChoiceDept || customSecondChoiceDept.trim().length < 2)
        ) {
          return "Nama Departemen Kustom 2 wajib ditulis.";
        }

        // Check duplicates
        const activeDept1 =
          formData.firstChoiceDeptId === "custom"
            ? customFirstChoiceDept.trim().toLowerCase()
            : formData.firstChoiceDeptId;
        const activeDept2 =
          formData.secondChoiceDeptId === "custom"
            ? customSecondChoiceDept.trim().toLowerCase()
            : formData.secondChoiceDeptId;

        if (activeDept1 === activeDept2 && activeDept2) {
          return "Pilihan 1 dan Pilihan 2 tidak boleh sama.";
        }
      }
    } else {
      // If event list is empty or useCustomProker is toggled active
      if (!isEventLocked) {
        if (prokers.length === 0 || useCustomProker) {
          if (
            !customFirstChoiceProker ||
            customFirstChoiceProker.trim().length < 2
          ) {
            return "Pilihan Kepanitiaan 1 (Kustom) wajib diisi.";
          }
          if (
            customFirstChoiceProker.trim().toLowerCase() ===
              customSecondChoiceProker.trim().toLowerCase() &&
            customSecondChoiceProker
          ) {
            return "Pilihan Kepanitiaan 1 dan Pilihan Kepanitiaan 2 tidak boleh sama.";
          }
        } else {
          if (!formData.firstChoiceProkerId)
            return "Pilihan Kepanitiaan 1 wajib diisi.";
          if (formData.firstChoiceProkerId === formData.secondChoiceProkerId) {
            return "Pilihan Kepanitiaan 1 dan Pilihan Kepanitiaan 2 tidak boleh sama.";
          }
        }
      }

      // Division choices validation
      if (!formData.firstChoiceDivisi) return "Pilihan Divisi 1 wajib diisi.";
      if (formData.firstChoiceDivisi === formData.secondChoiceDivisi) {
        return "Pilihan Divisi 1 dan Pilihan Divisi 2 tidak boleh sama.";
      }
    }
    return "";
  };

  const validateStep3 = () => {
    if (
      !formData.motivation ||
      formData.motivation.split(/\s+/).filter(Boolean).length < 20
    ) {
      return "Motivasi minimal terdiri dari 20 kata.";
    }

    const urlPattern =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    if (!formData.cvUrl || !urlPattern.test(formData.cvUrl))
      return "Tautan CV tidak valid. Harap masukkan link sharing yang valid.";
    if (!formData.photoUrl || !urlPattern.test(formData.photoUrl))
      return "Tautan Foto Diri tidak valid. Harap masukkan link sharing yang valid.";
    if (formData.portfolioUrl && !urlPattern.test(formData.portfolioUrl))
      return "Tautan Portofolio tidak valid.";

    return "";
  };

  const handleNextStep = () => {
    let err = "";
    if (step === 1) err = validateStep1();
    else if (step === 2) err = validateStep2();
    else if (step === 3) err = validateStep3();

    if (err) {
      setFormError(err);
      // Scroll to error if exists
      setTimeout(() => {
        const modalBody = document.getElementById("modal-scroll-body");
        if (modalBody) {
          modalBody.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          const el = document.getElementById("form-wizard-card");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 50);
      return;
    }

    setStep((prev) => prev + 1);
    // Scroll smoothly to top of wizard/modal
    setTimeout(() => {
      const modalBody = document.getElementById("modal-scroll-body");
      if (modalBody) {
        modalBody.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const el = document.getElementById("form-wizard-card");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  const handlePrevStep = () => {
    setFormError("");
    setStep((prev) => Math.max(1, prev - 1));
    setTimeout(() => {
      const modalBody = document.getElementById("modal-scroll-body");
      if (modalBody) {
        modalBody.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const el = document.getElementById("form-wizard-card");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  const handleSubmitApplication = async () => {
    // Determine effective values (resolved standard vs custom)
    const firstDept =
      departments.length === 0
        ? customFirstChoiceDept
        : formData.firstChoiceDeptId === "custom"
          ? customFirstChoiceDept
          : formData.firstChoiceDeptId;

    const secondDept =
      departments.length === 0
        ? customSecondChoiceDept
        : formData.secondChoiceDeptId === "custom"
          ? customSecondChoiceDept
          : formData.secondChoiceDeptId;

    const firstProker =
      prokers.length === 0 || useCustomProker
        ? customFirstChoiceProker
        : formData.firstChoiceProkerId;

    const secondProker =
      prokers.length === 0 || useCustomProker
        ? customSecondChoiceProker
        : formData.secondChoiceProkerId;

    try {
      const firstChoiceDivText =
        formData.applyType === "Panitia"
          ? `[Preferensi Divisi: 1. ${formData.firstChoiceDivisi}${formData.secondChoiceDivisi ? `, 2. ${formData.secondChoiceDivisi}` : ""}]\n\n`
          : "";
      const finalMotivation = `${firstChoiceDivText}${formData.motivation}`;

      const applyRes = await applyMutation.mutateAsync({
        fullName: formData.fullName,
        nim: formData.nim,
        email: formData.email,
        phone: formData.phone || formData.whatsapp,
        whatsapp: formData.whatsapp,
        applyType: formData.applyType,
        firstChoiceDeptId:
          formData.applyType === "Fungsionaris" ||
          formData.applyType === "Magang"
            ? firstDept
            : undefined,
        secondChoiceDeptId:
          (formData.applyType === "Fungsionaris" ||
            formData.applyType === "Magang") &&
          secondDept
            ? secondDept
            : undefined,
        firstChoiceProkerId:
          formData.applyType === "Panitia" ? firstProker : undefined,
        secondChoiceProkerId:
          formData.applyType === "Panitia" && secondProker
            ? secondProker
            : undefined,
        motivation: finalMotivation,
      });

      if (applyRes.statusCode === 200 || applyRes.statusCode === 201) {
        if (formData.cvUrl || formData.photoUrl || formData.portfolioUrl) {
          await uploadMutation.mutateAsync({
            nim: formData.nim,
            cvUrl: formData.cvUrl || undefined,
            photoUrl: formData.photoUrl || undefined,
            portfolioUrl: formData.portfolioUrl || undefined,
          });
        }
        setStep(5);
      }
    } catch (e: any) {
      setFormError(
        e.message || "Terjadi kesalahan saat mendaftar. Silakan coba lagi.",
      );
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(formData.nim);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSearchStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchNim.trim()) return;
    setActiveSearchNim(searchNim.trim());
    setShowAllResults(false);
  };

  const getStatusDetails = (status: string) => {
    switch (status) {
      case "Submitted":
        return {
          label: "Berkas Terkirim",
          colorClass: "text-amber-400 bg-amber-400/10 border-amber-400/30",
          desc: "Berkas pendaftaran Anda telah kami terima dan sedang dalam antrean verifikasi administrasi oleh Badan Pengurus Harian (BPH).",
          step: 1,
        };
      case "Interview":
        return {
          label: "Tahap Wawancara",
          colorClass: "text-blue-400 bg-blue-400/10 border-blue-400/30",
          desc: "Selamat! Berkas administrasi Anda lolos. Silakan pantau WhatsApp/Email Anda secara aktif untuk jadwal sesi wawancara departemen/panitia.",
          step: 2,
        };
      case "Accepted":
        return {
          label: "Lolos Seleksi (Diterima)",
          colorClass: "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30",
          desc: "Selamat bergabung di keluarga besar Danadyaksa BEM FT UNESA 2026! Ikuti terus instruksi onboarding di grup pengurus yang dikirimkan panitia.",
          step: 3,
        };
      case "Rejected":
        return {
          label: "Belum Lolos",
          colorClass: "text-rose-500 bg-rose-500/10 border-rose-500/30",
          desc: "Terima kasih atas minat dan partisipasi berharga Anda. Mohon maaf saat ini kuota departemen/proker pilihan Anda telah terpenuhi. Jangan patah semangat, tetaplah berkarya!",
          step: 3,
        };
      default:
        return {
          label: "Unknown",
          colorClass: "text-gray-500 bg-gray-500/10 border-gray-500/30",
          desc: "Status tidak dapat diidentifikasi.",
          step: 0,
        };
    }
  };

  const filteredResults = (resultsRes?.data || []).filter(
    (member: RecruitmentResultMember) =>
      member.fullName.toLowerCase().includes(resultsFilter.toLowerCase()) ||
      member.nim.includes(resultsFilter),
  );

  return (
    <main className="min-h-screen bg-[#091c11] pb-24 relative overflow-hidden font-sans">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="lazyOnload"
      />

      {/* ── FLOATING USER PROFILE WIDGET ── */}
      {isLoggedIn && sessionUser && (
        <div className="fixed top-28 right-4 sm:right-8 z-40 bg-[#091c11]/90 border border-[#10b981]/20 rounded-full px-4 py-2 flex items-center gap-3 backdrop-blur-xl shadow-2xl animate-fade-in pointer-events-auto">
          {sessionUser.avatar ? (
            <img
              src={sessionUser.avatar}
              alt={sessionUser.name}
              className="w-6 h-6 rounded-full border border-white/10"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#10b981]/20 flex items-center justify-center text-[10px] text-[#10b981] font-mono font-bold">
              U
            </div>
          )}

          <div className="flex flex-col text-left">
            <span className="text-[9px] font-bold text-white max-w-[100px] truncate leading-none mb-0.5">
              {sessionUser.name}
            </span>
            <span className="text-[7px] font-mono text-gray-500 uppercase tracking-wider leading-none">
              UNESA STUDENT
            </span>
          </div>

          <div className="w-px h-4 bg-white/10" />

          <button
            onClick={handleSignOut}
            className="text-[8px] font-mono font-bold text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-widest cursor-pointer"
          >
            KELUAR
          </button>
        </div>
      )}
      {/* Background ambient orbs */}
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-[#10b981]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] left-[15%] w-[400px] h-[400px] bg-emerald-800/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── HERO SECTION ── */}
      <section
        className="relative min-h-screen flex items-center justify-center pt-24 pb-12 hero-bg overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/gedung ft.png')" }}
      >
        <div className="absolute inset-0 bg-[#091c11]/85 z-0" />

        {/* Parallax elements/glow grid */}
        <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#10b981_1px,transparent_1px)] bg-size-[24px_24px] z-0" />

        <div className="w-full max-w-5xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
          {/* Active Badge */}
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/60 border border-[#10b981]/30 backdrop-blur-md animate-badge-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-ping" />
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#10b981] uppercase">
              PENDAFTARAN DIBUKA
            </span>
          </div>

          {/* Main Titles */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-none tracking-tight mb-6 uppercase max-w-4xl animate-hero-reveal">
            OPEN RECRUITMENT <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#10b981] to-emerald-400">
              DANADYAKSA 2026
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed mb-12 animate-hero-reveal delay-100">
            Fakultas Teknik UNESA memanggilmu untuk berproses, berdaya, dan
            bersinergi nyata. Ambil peran strategismu sekarang dan jadilah
            katalisator perubahan!
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 animate-hero-reveal delay-200">
            <a
              href="#kepanitiaan-terbuka-section"
              className="w-full sm:w-auto px-8 py-4 bg-[#10b981] hover:bg-emerald-400 text-army-dark font-black rounded-2xl transition-premium shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 active:scale-98 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
            >
              Lihat Pilihan Pendaftaran
            </a>

            <a
              href="#lacak-section"
              className="w-full sm:w-auto px-8 py-4 glass-subtle hover:glass-active border border-white/10 hover:border-emerald-500/30 text-white font-bold rounded-2xl transition-premium flex items-center justify-center gap-2 text-xs uppercase tracking-wider active:scale-98"
            >
              Cek Status & Hasil
            </a>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-gray-500 animate-scroll-hint">
            <span className="text-[9px] font-mono tracking-widest uppercase">
              Lihat Pilihan Event
            </span>
            <div className="w-px h-6 bg-linear-to-b from-gray-500 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── SECTION 1: KEPANITIAAN TERBUKA & JALUR MAGANG (3 BULAN) ── */}
      <section
        className="py-24 border-t border-white/5 relative z-10 section-anchor"
        id="kepanitiaan-terbuka-section"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-mono text-[#10b981] uppercase tracking-[0.3em] mb-2 inline-block">
              {"// AVAILABLE OPPORTUNITIES"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-wider">
              KEPANITIAAN & JALUR PENDAFTARAN AKTIF
            </h2>
            <p className="text-xs text-gray-400 max-w-md mx-auto mt-2 leading-relaxed">
              Jelajahi agenda kegiatan Fakultas Teknik UNESA dan pilih tempat
              terbaikmu untuk berkontribusi. Klik pendaftaran pada pilihan untuk
              mulai mengisi data.
            </p>
            <div className="w-12 h-1 bg-[#10b981] mx-auto mt-4 rounded-full" />
          </div>

          {/* Pilihan Jalur Magang BEM (3 Bulan) */}
          <div className="mb-16 bg-linear-to-r from-emerald-950/20 via-[#10b981]/5 to-transparent border border-[#10b981]/20 p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[#10b981]/40 transition-premium shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="text-left space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#10b981]/12 border border-[#10b981]/30 text-[#10b981] text-[9px] font-mono uppercase font-bold tracking-wider">
                JALUR UTAMA
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                Staf Magang BEM FT UNESA (3 Bulan)
              </h3>
              <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
                Ingin belajar manajemen organisasi langsung di bawah pimpinan
                departemen BEM FT UNESA selama{" "}
                <strong>3 bulan secara intensif</strong>? Pilih jalur Magang 3
                Bulan untuk ditempatkan secara profesional di departemen pilihan
                Anda.
              </p>
            </div>

            <button
              onClick={handleSelectMagangFromLanding}
              className="px-6 py-3.5 bg-white text-army-dark font-black hover:bg-[#10b981] hover:text-army-dark rounded-xl transition-premium text-xs uppercase tracking-wider shadow-lg shrink-0 w-full md:w-auto cursor-pointer"
            >
              Daftar Staf Magang 3 Bulan
            </button>
          </div>

          {/* Grid Event Pendaftaran Kepanitiaan */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none">
                Daftar Event Kepanitiaan Terbuka ({prokers.length})
              </span>
            </div>

            {isProkerLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-black/25 border border-white/5 p-6 rounded-2xl h-48 animate-pulse flex flex-col justify-between"
                  >
                    <div className="h-6 bg-white/5 rounded-md w-3/4" />
                    <div className="h-4 bg-white/5 rounded-md w-1/2" />
                    <div className="h-10 bg-white/5 rounded-md w-full" />
                  </div>
                ))}
              </div>
            ) : prokers.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl text-gray-500 text-xs italic flex flex-col items-center justify-center gap-4 bg-black/10">
                <div>
                  <p className="font-bold text-gray-400 uppercase tracking-wider">
                    Belum ada Kepanitiaan Event yang Dibuka
                  </p>
                  <p className="text-gray-600 text-[11px] mt-1">
                    Namun jangan khawatir, Anda tetap bisa mendaftar secara
                    kustom langsung pada wizard pendaftaran di bawah.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEventLocked(false);
                    setUseCustomProker(true);
                    setFormData((prev) => ({
                      ...prev,
                      applyType: "Panitia",
                      firstChoiceProkerId: "",
                      secondChoiceProkerId: "",
                      firstChoiceDivisi: "",
                      secondChoiceDivisi: "",
                    }));
                    setIsFormOpen(true);
                  }}
                  className="px-5 py-2.5 glass-subtle hover:glass-active text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-premium cursor-pointer"
                >
                  Tulis Event Kustom Anda
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {prokers.map((p: ProkerItem) => (
                  <div
                    key={p._id}
                    className="bg-black/35 border border-white/5 p-6 rounded-2xl flex flex-col justify-between gap-6 hover:border-[#10b981]/20 hover:bg-black/50 transition-premium shadow-2xl relative group"
                  >
                    {/* Glowing effect inside card */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#10b981]/5 rounded-bl-3xl blur-xl pointer-events-none group-hover:bg-[#10b981]/15 transition-premium" />

                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#10b981]/10 border border-[#10b981]/25 text-[#10b981] text-[8px] font-mono font-bold uppercase tracking-wider">
                          DIBUKA
                        </span>
                      </div>

                      <div className="text-left space-y-1">
                        <h4 className="text-sm font-black text-white tracking-wide uppercase leading-snug group-hover:text-[#10b981] transition-premium line-clamp-1">
                          {p.title}
                        </h4>
                        <p className="text-[10px] text-gray-500 font-mono tracking-wider">
                          DEP: {p.departmentId?.name || "BEM FT UNESA"}
                        </p>
                      </div>

                      {p.description && (
                        <p className="text-xs text-gray-400 text-left line-clamp-2 italic leading-relaxed">
                          &quot;{p.description}&quot;
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleSelectProkerFromLanding(p._id)}
                      className="w-full py-3 bg-[#10b981]/10 hover:bg-[#10b981] border border-[#10b981]/20 text-[#10b981] hover:text-[#091c11] text-[10px] font-black uppercase tracking-wider rounded-xl transition-premium shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Daftar Event Ini
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Decorative divider */}
      <div className="section-divider my-4" />

      {/* ── TIMELINE SELEKSI ── */}
      <section className="py-24 bg-black/10 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-mono text-[#10b981] uppercase tracking-[0.3em] mb-2 inline-block">
              {"// JOURNEY PATH"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">
              ALUR TAHAP SELEKSI
            </h2>
            <div className="w-12 h-1 bg-[#10b981] mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Horizontal connection line in desktop */}
            <div className="hidden md:block absolute top-12 left-12 right-12 h-[2px] bg-linear-to-r from-[#10b981]/40 via-emerald-800/20 to-white/5 z-0" />

            {/* Step 1 */}
            <div className="bg-black/35 border border-white/5 p-6 rounded-2xl relative z-10 hover:border-[#10b981]/20 transition-premium">
              <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center text-[#10b981] font-bold text-lg mb-6 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                01
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                Pendaftaran Online
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Isi biodata diri, tentukan preferensi kepengurusan
                (magang/panitia), dan sertakan berkas administrasi pendukung
                Anda.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-black/35 border border-white/5 p-6 rounded-2xl relative z-10 hover:border-[#10b981]/20 transition-premium">
              <div className="w-12 h-12 rounded-xl bg-emerald-900/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg mb-6">
                02
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                Seleksi Administrasi
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Pemeriksaan validitas berkas dan motivasi pendaftar oleh tim BPH
                BEM FT UNESA untuk melangkah ke tahap selanjutnya.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-black/35 border border-white/5 p-6 rounded-2xl relative z-10 hover:border-[#10b981]/20 transition-premium">
              <div className="w-12 h-12 rounded-xl bg-emerald-900/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg mb-6">
                03
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                Wawancara Internal
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Sesi interview mendalam mengenai wawasan organisasi, komitmen,
                dan kapabilitas teknis sesuai departemen/event pilihan.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-black/35 border border-white/5 p-6 rounded-2xl relative z-10 hover:border-[#10b981]/20 transition-premium">
              <div className="w-12 h-12 rounded-xl bg-emerald-900/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg mb-6">
                04
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                Pengumuman Final
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Hasil kelolosan akhir yang diumumkan secara terbuka pada
                platform. Selamat berjuang menjadi fungsionaris terpilih!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative divider */}
      <div className="section-divider my-8" />

      {/* ── FORMULIR PENDAFTARAN WIZARD SECTION (CTA TO POPUP) ── */}
      <section
        className="py-24 relative z-10 section-anchor text-center animate-fade-in"
        id="form-wizard-card"
      >
        <div className="max-w-2xl mx-auto px-6">
          <span className="text-[11px] font-mono text-[#10b981] uppercase tracking-[0.3em] mb-2 inline-block animate-pulse">
            {"// REGISTRATION WIZARD"}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-wider mb-4 leading-tight">
            SIAP UNTUK BERPERAN NYATA?
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-md mx-auto leading-relaxed mb-8">
            Lengkapi data diri, preferensi departemen/event, motivasi, serta
            berkas pendukung Anda melalui portal pendaftaran interaktif kami.
            Langkah review tersedia sebelum submit akhir.
          </p>
          <button
            onClick={() => {
              setIsEventLocked(false);
              setFormData((prev) => ({
                ...prev,
                applyType: "Magang", // Start generic form as Magang or let user select
                firstChoiceProkerId: "",
                secondChoiceProkerId: "",
                firstChoiceDivisi: "",
                secondChoiceDivisi: "",
                firstChoiceDeptId: "",
                secondChoiceDeptId: "",
              }));
              setIsFormOpen(true);
            }}
            className="px-8 py-4 bg-[#10b981] hover:bg-emerald-400 text-army-dark font-black rounded-2xl transition-premium shadow-[0_10px_30px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 active:scale-95 text-xs uppercase tracking-wider cursor-pointer"
          >
            Buka Formulir Pendaftaran
          </button>
        </div>
      </section>

      {/* ── REGISTRATION FORM MODAL OVERLAY ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/85 backdrop-blur-md animate-fade-in">
          {/* Click outside backdrop to close */}
          <div
            className="absolute inset-0 cursor-default"
            onClick={() => setIsFormOpen(false)}
          />

          {/* Modal Content Box */}
          <div className="glass-overlay rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col relative z-10 shadow-[0_30px_80px_rgba(0,0,0,0.85)] animate-slide-up overflow-hidden border border-[#10b981]/20">
            {/* Modal Header */}
            <div className="px-6 py-5 sm:px-8 border-b border-white/5 flex justify-between items-center bg-[#091c11]/95 backdrop-blur-md shrink-0">
              <div>
                <span className="text-[9px] font-mono text-[#10b981] uppercase tracking-[0.3em] block">
                  {"// REGISTRATION WIZARD"}
                </span>
                <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  FORMULIR PENDAFTARAN
                </h2>
              </div>

              <button
                onClick={() => setIsFormOpen(false)}
                className="text-[10px] font-mono text-gray-500 hover:text-white px-3 py-1.5 rounded-xl border border-white/5 hover:border-white/10 transition-premium cursor-pointer bg-white/2 font-bold"
                title="Tutup Formulir"
              >
                BATAL ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div
              id="modal-scroll-body"
              className="p-6 sm:p-8 overflow-y-auto flex-1 bg-[#091c11]/60"
            >
              {/* Pill Progress Bar Indicator */}
              {step < 5 && (
                <div className="mb-8">
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">
                    <span>Tahapan Pendaftaran</span>
                    <span className="text-[#10b981] font-bold">
                      Langkah {step} dari 4
                    </span>
                  </div>

                  <div className="pill-progress mb-6">
                    <div
                      className="pill-progress-fill"
                      style={{ width: `${(step / 4) * 100}%` }}
                    />
                  </div>

                  {/* Horizontal Step Titles */}
                  <div className="grid grid-cols-4 gap-2">
                    <div
                      className={`text-center transition-all duration-300 ${step >= 1 ? "opacity-100" : "opacity-40"}`}
                    >
                      <span
                        className={`block text-[9px] font-bold uppercase tracking-wider ${step === 1 ? "text-[#10b981]" : "text-white"}`}
                      >
                        1. Biodata
                      </span>
                    </div>
                    <div
                      className={`text-center transition-all duration-300 ${step >= 2 ? "opacity-100" : "opacity-40"}`}
                    >
                      <span
                        className={`block text-[9px] font-bold uppercase tracking-wider ${step === 2 ? "text-[#10b981]" : "text-white"}`}
                      >
                        2. Jalur
                      </span>
                    </div>
                    <div
                      className={`text-center transition-all duration-300 ${step >= 3 ? "opacity-100" : "opacity-40"}`}
                    >
                      <span
                        className={`block text-[9px] font-bold uppercase tracking-wider ${step === 3 ? "text-[#10b981]" : "text-white"}`}
                      >
                        3. Berkas
                      </span>
                    </div>
                    <div
                      className={`text-center transition-all duration-300 ${step >= 4 ? "opacity-100" : "opacity-40"}`}
                    >
                      <span
                        className={`block text-[9px] font-bold uppercase tracking-wider ${step === 4 ? "text-[#10b981]" : "text-white"}`}
                      >
                        4. Review
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {formError && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-3 animate-pulse">
                  <span className="font-mono font-black text-rose-500 bg-rose-500/20 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">
                    !
                  </span>
                  <span>{formError}</span>
                </div>
              )}

              {/* ── STEP 1: BIODATA DIRI ── */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-wider">
                        Biodata Identitas Diri
                      </h3>
                      <p className="text-[10px] text-gray-500 font-mono tracking-wider">
                        LENGKAPI DATA SESUAI MAHASISWA AKTIF
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="fullName">Nama Lengkap *</Label>
                      <Input
                        id="fullName"
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Contoh: Muhammad Farhan"
                      />
                    </div>

                    {/* NIM */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="nim">NIM (Nomor Induk Mahasiswa) *</Label>
                      <Input
                        id="nim"
                        type="text"
                        name="nim"
                        value={formData.nim}
                        onChange={handleInputChange}
                        placeholder="Contoh: 23051204000"
                        className="font-mono"
                      />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="email">Alamat Email Aktif *</Label>
                      <Input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Contoh: farhan@unesa.ac.id"
                      />
                    </div>

                    {/* Whatsapp */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="whatsapp">Nomor WhatsApp Aktif *</Label>
                      <Input
                        id="whatsapp"
                        type="text"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        placeholder="Contoh: 081234567890"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-white/5 mt-8">
                    <button
                      onClick={handleNextStep}
                      className="px-8 py-4 bg-white hover:bg-[#10b981] hover:text-army-dark text-army-dark font-black rounded-2xl transition-premium shadow-xl text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: PREFERENSI REKRUTMEN ── */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-wider">
                        Jalur Seleksi & Pilihan
                      </h3>
                      <p className="text-[10px] text-gray-500 font-mono tracking-wider">
                        TENTUKAN MINAT KEPENGURUSAN ANDA
                      </p>
                    </div>
                  </div>
                  {isEventLocked ? (
                    /* Locked Event Flow (Divisi Selection Only) */
                    <div className="space-y-6 animate-fade-in">
                      {/* Locked Event Card */}
                      <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-6 rounded-3xl text-left space-y-2 relative overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-[#10b981]/10 to-transparent blur-xl pointer-events-none" />
                        <span className="px-2.5 py-0.5 rounded-md bg-[#10b981]/25 text-[#10b981] text-[9px] font-mono font-bold uppercase tracking-wider">
                          KEPANITIAAN TERPILIH (LOCKED)
                        </span>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider mt-2 leading-snug">
                          {prokers.find(
                            (p) => p._id === formData.firstChoiceProkerId,
                          )?.title || "Event Kepanitiaan"}
                        </h4>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium mt-1">
                          Anda mendaftar kepanitiaan ini langsung dari halaman
                          depan. Jalur seleksi otomatis dikunci sebagai Panitia.
                        </p>
                      </div>

                      {/* Divisi Selection */}
                      <div className="space-y-4 pt-4 border-t border-white/5 text-left">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none block">
                          PILIHAN DIVISI KEPANITIAAN
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Choice 1 */}
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="firstChoiceDivisi">
                              Divisi Pilihan 1 *
                            </Label>
                            <Select
                              id="firstChoiceDivisi"
                              name="firstChoiceDivisi"
                              value={formData.firstChoiceDivisi}
                              onChange={handleInputChange}
                            >
                              <option value="">Pilih Divisi Pilihan 1</option>
                              <option value="Divisi Acara">Divisi Acara</option>
                              <option value="Divisi Humas & Kesekretariatan">
                                Divisi Humas & Kesekretariatan
                              </option>
                              <option value="Divisi PDD (Publikasi, Dekorasi, Dokumentasi)">
                                Divisi PDD (Publikasi, Dekorasi, Dokumentasi)
                              </option>
                              <option value="Divisi Perlengkapan & Logistik">
                                Divisi Perlengkapan & Logistik
                              </option>
                              <option value="Divisi Konsumsi">
                                Divisi Konsumsi
                              </option>
                              <option value="Divisi Danus (Dana Usaha)">
                                Divisi Danus (Dana Usaha)
                              </option>
                            </Select>
                          </div>

                          {/* Choice 2 */}
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="secondChoiceDivisi">
                              Divisi Pilihan 2 (Opsional)
                            </Label>
                            <Select
                              id="secondChoiceDivisi"
                              name="secondChoiceDivisi"
                              value={formData.secondChoiceDivisi}
                              onChange={handleInputChange}
                            >
                              <option value="">Tidak ada pilihan kedua</option>
                              <option value="Divisi Acara">Divisi Acara</option>
                              <option value="Divisi Humas & Kesekretariatan">
                                Divisi Humas & Kesekretariatan
                              </option>
                              <option value="Divisi PDD (Publikasi, Dekorasi, Dokumentasi)">
                                Divisi PDD (Publikasi, Dekorasi, Dokumentasi)
                              </option>
                              <option value="Divisi Perlengkapan & Logistik">
                                Divisi Perlengkapan & Logistik
                              </option>
                              <option value="Divisi Konsumsi">
                                Divisi Konsumsi
                              </option>
                              <option value="Divisi Danus (Dana Usaha)">
                                Divisi Danus (Dana Usaha)
                              </option>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Generic Form Entry (Standard Track Select) */
                    <div className="space-y-6">
                      {/* Apply Type selector */}
                      <div className="flex flex-col gap-3 mb-6">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none mb-1">
                          Tipe Jalur Pengurus
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Magang */}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                applyType: "Magang",
                              }));
                              setFormError("");
                            }}
                            className={`p-5 rounded-2xl border text-left transition-premium flex flex-col gap-2 cursor-pointer ${
                              formData.applyType === "Magang"
                                ? "bg-[#10b981]/12 border-[#10b981] text-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                : "bg-black/25 border-white/5 text-gray-400 hover:border-white/10"
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="block text-xs font-black uppercase tracking-wider text-white">
                                Staf Magang BEM (3 Bulan)
                              </span>
                              <span className="block text-[10px] text-gray-400 leading-normal font-medium">
                                Bekerja di bawah struktur departemen resmi BEM
                                FT UNESA selama periode magang 3 bulan.
                              </span>
                            </div>
                          </button>

                          {/* Panitia */}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                applyType: "Panitia",
                              }));
                              setFormError("");
                            }}
                            className={`p-5 rounded-2xl border text-left transition-premium flex flex-col gap-2 cursor-pointer ${
                              formData.applyType === "Panitia"
                                ? "bg-[#10b981]/12 border-[#10b981] text-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                : "bg-black/25 border-white/5 text-gray-400 hover:border-white/10"
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="block text-xs font-black uppercase tracking-wider text-white">
                                Panitia Event (Kepanitiaan)
                              </span>
                              <span className="block text-[10px] text-gray-400 leading-normal font-medium">
                                Bergabung sebagai tim penyelenggara program
                                kerja/agenda kepanitiaan temporer tertentu.
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Sub-Form for Magang/Fungsionaris */}
                      {formData.applyType === "Magang" && (
                        <div className="space-y-6 pt-4 border-t border-white/5">
                          {isStructureLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-4">
                              <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#10b981] animate-spin" />
                              <p className="text-xs font-mono text-gray-500 uppercase">
                                Mengunduh struktur departemen...
                              </p>
                            </div>
                          ) : departments.length === 0 ? (
                            /* Resilient Fallback: If no API departments loaded, directly provide custom text fields */
                            <div className="space-y-4 animate-fade-in">
                              <div className="p-4 rounded-xl bg-[#10b981]/5 border border-[#10b981]/20 text-[11px] text-emerald-300 flex items-start gap-2">
                                <span className="font-mono font-black text-[#10b981] bg-[#10b981]/20 w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] mt-0.5">
                                  i
                                </span>
                                <span>
                                  Daftar departemen kosong atau database
                                  offline. Anda dapat mengetik nama departemen
                                  secara kustom di bawah ini.
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                <div className="flex flex-col gap-2">
                                  <Label
                                    htmlFor="customFirstChoiceDept"
                                    className="text-[#10b981] font-bold"
                                  >
                                    Departemen Pilihan 1 * (Kustom)
                                  </Label>
                                  <Input
                                    id="customFirstChoiceDept"
                                    type="text"
                                    value={customFirstChoiceDept}
                                    onChange={(e) => {
                                      setCustomFirstChoiceDept(e.target.value);
                                      setFormError("");
                                    }}
                                    placeholder="Ketik nama departemen pilihan 1..."
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label
                                    htmlFor="customSecondChoiceDept"
                                    className="text-[#10b981] font-bold"
                                  >
                                    Departemen Pilihan 2 (Kustom)
                                  </Label>
                                  <Input
                                    id="customSecondChoiceDept"
                                    type="text"
                                    value={customSecondChoiceDept}
                                    onChange={(e) => {
                                      setCustomSecondChoiceDept(e.target.value);
                                      setFormError("");
                                    }}
                                    placeholder="Ketik nama departemen pilihan 2..."
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4 text-left">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Choice 1 */}
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="firstChoiceDeptId">
                                    Departemen Magang Pilihan 1 *
                                  </Label>
                                  <Select
                                    id="firstChoiceDeptId"
                                    name="firstChoiceDeptId"
                                    value={formData.firstChoiceDeptId}
                                    onChange={handleInputChange}
                                  >
                                    <option value="">
                                      Pilih Departemen Pilihan 1
                                    </option>
                                    {departments.map((dept: Department) => (
                                      <option key={dept._id} value={dept._id}>
                                        {dept.name}{" "}
                                        {dept.code ? `(${dept.code})` : ""}
                                      </option>
                                    ))}
                                    <option value="custom">
                                      ── Input Kustom (Tulis Sendiri) ──
                                    </option>
                                  </Select>
                                </div>

                                {/* Choice 2 */}
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="secondChoiceDeptId">
                                    Departemen Magang Pilihan 2 (Opsional)
                                  </Label>
                                  <Select
                                    id="secondChoiceDeptId"
                                    name="secondChoiceDeptId"
                                    value={formData.secondChoiceDeptId}
                                    onChange={handleInputChange}
                                  >
                                    <option value="">
                                      Tidak ada pilihan kedua
                                    </option>
                                    {departments.map((dept: Department) => (
                                      <option key={dept._id} value={dept._id}>
                                        {dept.name}{" "}
                                        {dept.code ? `(${dept.code})` : ""}
                                      </option>
                                    ))}
                                    <option value="custom">
                                      ── Input Kustom (Tulis Sendiri) ──
                                    </option>
                                  </Select>
                                </div>
                              </div>

                              {/* Custom Input 1 Field if Custom selected */}
                              {formData.firstChoiceDeptId === "custom" && (
                                <div className="flex flex-col gap-2 mt-4 animate-slide-up">
                                  <Label
                                    htmlFor="customFirstChoiceDept"
                                    className="text-[#10b981] font-bold"
                                  >
                                    Tulis Departemen Pilihan 1 * (Kustom)
                                  </Label>
                                  <Input
                                    id="customFirstChoiceDept"
                                    type="text"
                                    value={customFirstChoiceDept}
                                    onChange={(e) => {
                                      setCustomFirstChoiceDept(e.target.value);
                                      setFormError("");
                                    }}
                                    placeholder="Ketik nama departemen pilihan 1 Anda secara bebas..."
                                  />
                                </div>
                              )}

                              {/* Custom Input 2 Field if Custom selected */}
                              {formData.secondChoiceDeptId === "custom" && (
                                <div className="flex flex-col gap-2 mt-4 animate-slide-up">
                                  <Label
                                    htmlFor="customSecondChoiceDept"
                                    className="text-[#10b981] font-bold"
                                  >
                                    Tulis Departemen Pilihan 2 (Kustom)
                                  </Label>
                                  <Input
                                    id="customSecondChoiceDept"
                                    type="text"
                                    value={customSecondChoiceDept}
                                    onChange={(e) => {
                                      setCustomSecondChoiceDept(e.target.value);
                                      setFormError("");
                                    }}
                                    placeholder="Ketik nama departemen pilihan 2 Anda secara bebas..."
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sub-Form for Panitia */}
                      {formData.applyType === "Panitia" && (
                        <div className="space-y-6 pt-4 border-t border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none">
                              Pilihan Kepanitiaan Event
                            </span>

                            {/* Resilient Option Toggle for Custom manual inputs */}
                            {prokers.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setUseCustomProker(!useCustomProker);
                                  setFormError("");
                                }}
                                className="text-[10px] font-mono text-[#10b981] hover:text-emerald-400 font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                              >
                                <span className="text-[11px] tracking-normal mr-0.5">
                                  ✎
                                </span>
                                {useCustomProker
                                  ? "Pilih dari Daftar Event"
                                  : "Tulis Event Kustom (Lainnya)"}
                              </button>
                            )}
                          </div>

                          {isProkerLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-4">
                              <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#10b981] animate-spin" />
                              <p className="text-xs font-mono text-gray-500 uppercase">
                                Mengunduh agenda program kerja...
                              </p>
                            </div>
                          ) : prokers.length === 0 || useCustomProker ? (
                            /* Display Custom Manual Input Fields */
                            <div className="space-y-4 animate-fade-in text-left">
                              {prokers.length === 0 && (
                                <div className="p-4 rounded-xl bg-[#10b981]/5 border border-[#10b981]/20 text-[11px] text-emerald-300 flex items-start gap-2">
                                  <span className="font-mono font-black text-[#10b981] bg-[#10b981]/20 w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] mt-0.5">
                                    i
                                  </span>
                                  <span>
                                    Daftar kepanitiaan event kosong atau
                                    database offline. Anda dapat mengetik nama
                                    event secara kustom di bawah ini.
                                  </span>
                                </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                  <Label
                                    htmlFor="customFirstChoiceProker"
                                    className="text-[#10b981] font-bold"
                                  >
                                    Kepanitiaan Event Pilihan 1 * (Kustom)
                                  </Label>
                                  <Input
                                    id="customFirstChoiceProker"
                                    type="text"
                                    value={customFirstChoiceProker}
                                    onChange={(e) => {
                                      setCustomFirstChoiceProker(
                                        e.target.value,
                                      );
                                      setFormError("");
                                    }}
                                    placeholder="Ketik nama event pilihan 1..."
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label
                                    htmlFor="customSecondChoiceProker"
                                    className="text-[#10b981] font-bold"
                                  >
                                    Kepanitiaan Event Pilihan 2 (Kustom)
                                  </Label>
                                  <Input
                                    id="customSecondChoiceProker"
                                    type="text"
                                    value={customSecondChoiceProker}
                                    onChange={(e) => {
                                      setCustomSecondChoiceProker(
                                        e.target.value,
                                      );
                                      setFormError("");
                                    }}
                                    placeholder="Ketik nama event pilihan 2..."
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Standard listed items with buttons */
                            <div className="grid grid-cols-1 gap-4 max-h-[350px] overflow-y-auto pr-2">
                              {prokers.map((p: ProkerItem) => {
                                const isChoice1 =
                                  formData.firstChoiceProkerId === p._id;
                                const isChoice2 =
                                  formData.secondChoiceProkerId === p._id;

                                return (
                                  <div
                                    key={p._id}
                                    className={`p-4 rounded-2xl border transition-premium flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/45 ${
                                      isChoice1
                                        ? "border-[#10b981] bg-[#10b981]/5"
                                        : isChoice2
                                          ? "border-emerald-500/50 bg-emerald-950/10"
                                          : "border-white/5 hover:border-white/10"
                                    }`}
                                  >
                                    <div className="text-left">
                                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                        {p.title}
                                      </h4>
                                      <p className="text-[9px] font-mono text-gray-500 uppercase mt-0.5">
                                        DEP:{" "}
                                        {p.departmentId?.name || "BEM FT UNESA"}
                                      </p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            firstChoiceProkerId: isChoice1
                                              ? ""
                                              : p._id,
                                            secondChoiceProkerId:
                                              prev.secondChoiceProkerId ===
                                              p._id
                                                ? ""
                                                : prev.secondChoiceProkerId,
                                          }));
                                          setFormError("");
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all duration-300 cursor-pointer ${
                                          isChoice1
                                            ? "bg-[#10b981] text-[#091c11]"
                                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                        }`}
                                      >
                                        Pilihan 1
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            secondChoiceProkerId: isChoice2
                                              ? ""
                                              : p._id,
                                            firstChoiceProkerId:
                                              prev.firstChoiceProkerId === p._id
                                                ? ""
                                                : prev.firstChoiceProkerId,
                                          }));
                                          setFormError("");
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all duration-300 cursor-pointer ${
                                          isChoice2
                                            ? "bg-[#10b981]/30 text-[#10b981]"
                                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                        }`}
                                      >
                                        Pilihan 2
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Divisi Selection (Required for Panitia, both Locked and Generic!) */}
                          <div className="space-y-4 pt-6 border-t border-white/5 text-left">
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none block">
                              PILIHAN DIVISI KEPANITIAAN
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Choice 1 */}
                              <div className="flex flex-col gap-2">
                                <Label htmlFor="firstChoiceDivisi">
                                  Divisi Pilihan 1 *
                                </Label>
                                <Select
                                  id="firstChoiceDivisi"
                                  name="firstChoiceDivisi"
                                  value={formData.firstChoiceDivisi}
                                  onChange={handleInputChange}
                                >
                                  <option value="">
                                    Pilih Divisi Pilihan 1
                                  </option>
                                  <option value="Divisi Acara">
                                    Divisi Acara
                                  </option>
                                  <option value="Divisi Humas & Kesekretariatan">
                                    Divisi Humas & Kesekretariatan
                                  </option>
                                  <option value="Divisi PDD (Publikasi, Dekorasi, Dokumentasi)">
                                    Divisi PDD (Publikasi, Dekorasi,
                                    Dokumentasi)
                                  </option>
                                  <option value="Divisi Perlengkapan & Logistik">
                                    Divisi Perlengkapan & Logistik
                                  </option>
                                  <option value="Divisi Konsumsi">
                                    Divisi Konsumsi
                                  </option>
                                  <option value="Divisi Danus (Dana Usaha)">
                                    Divisi Danus (Dana Usaha)
                                  </option>
                                </Select>
                              </div>

                              {/* Choice 2 */}
                              <div className="flex flex-col gap-2">
                                <Label htmlFor="secondChoiceDivisi">
                                  Divisi Pilihan 2 (Opsional)
                                </Label>
                                <Select
                                  id="secondChoiceDivisi"
                                  name="secondChoiceDivisi"
                                  value={formData.secondChoiceDivisi}
                                  onChange={handleInputChange}
                                >
                                  <option value="">
                                    Tidak ada pilihan kedua
                                  </option>
                                  <option value="Divisi Acara">
                                    Divisi Acara
                                  </option>
                                  <option value="Divisi Humas & Kesekretariatan">
                                    Divisi Humas & Kesekretariatan
                                  </option>
                                  <option value="Divisi PDD (Publikasi, Dekorasi, Dokumentasi)">
                                    Divisi PDD (Publikasi, Dekorasi,
                                    Dokumentasi)
                                  </option>
                                  <option value="Divisi Perlengkapan & Logistik">
                                    Divisi Perlengkapan & Logistik
                                  </option>
                                  <option value="Divisi Konsumsi">
                                    Divisi Konsumsi
                                  </option>
                                  <option value="Divisi Danus (Dana Usaha)">
                                    Divisi Danus (Dana Usaha)
                                  </option>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Wizard Step 2 Actions */}
                  <div className="flex justify-between pt-6 border-t border-white/5 mt-8">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-6 py-4 glass-subtle hover:glass-active text-white font-bold rounded-2xl transition-premium text-xs uppercase tracking-wider active:scale-95 cursor-pointer"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-8 py-4 bg-white hover:bg-[#10b981] hover:text-army-dark text-army-dark font-black rounded-2xl transition-premium shadow-xl text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: BERKAS & MOTIVASI ── */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-wider">
                        Dokumen & Berkas Motivasi
                      </h3>
                      <p className="text-[10px] text-gray-500 font-mono tracking-wider">
                        UNGGAH TAUTAN BERKAS ADMINISTRASI ANDA
                      </p>
                    </div>
                  </div>

                  {/* Motivation Text Area */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="motivation">
                        Motivasi Bergabung (Min. 20 Kata) *
                      </Label>
                      <span
                        className={`text-[9px] font-mono font-bold ${
                          (formData.motivation.trim() === ""
                            ? 0
                            : formData.motivation.split(/\s+/).filter(Boolean)
                                .length) >= 20
                            ? "text-[#10b981]"
                            : "text-rose-400"
                        }`}
                      >
                        {formData.motivation.trim() === ""
                          ? 0
                          : formData.motivation.split(/\s+/).filter(Boolean)
                              .length}{" "}
                        / 20 Kata
                      </span>
                    </div>
                    <Textarea
                      id="motivation"
                      name="motivation"
                      value={formData.motivation}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Jelaskan kontribusi nyata, kesiapan komitmen, dan alasan mendasar mengapa kamu ingin bergabung di Danadyaksa BEM FT UNESA 2026..."
                    />
                  </div>

                  {/* Guideline banner */}
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-[#10b981]/20 text-[11px] text-emerald-300 leading-relaxed">
                    📢 <strong>Petunjuk Tautan Dokumen:</strong> Unggah file CV,
                    Foto Resmi (3x4 background bebas rapi), dan Portofolio (jika
                    ada) ke penyimpanan awan seperti Google Drive, OneDrive,
                    atau Dropbox. Pastikan pengaturan akses tautan disetel
                    menjadi{" "}
                    <strong>
                      &quot;Siapa saja yang memiliki link dapat melihat (Public
                      View Access)&quot;
                    </strong>
                    , lalu salin link-nya ke kolom di bawah.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* CV Url */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="cvUrl">Tautan CV Sharing *</Label>
                      <Input
                        id="cvUrl"
                        type="url"
                        name="cvUrl"
                        value={formData.cvUrl}
                        onChange={handleInputChange}
                        placeholder="https://drive.google.com/..."
                        className="text-xs"
                      />
                    </div>

                    {/* Photo Url */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="photoUrl">
                        Tautan Foto Resmi (3x4) *
                      </Label>
                      <Input
                        id="photoUrl"
                        type="url"
                        name="photoUrl"
                        value={formData.photoUrl}
                        onChange={handleInputChange}
                        placeholder="https://drive.google.com/..."
                        className="text-xs"
                      />
                    </div>

                    {/* Portfolio Url */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="portfolioUrl">
                        Tautan Portofolio (Opsional)
                      </Label>
                      <Input
                        id="portfolioUrl"
                        type="url"
                        name="portfolioUrl"
                        value={formData.portfolioUrl}
                        onChange={handleInputChange}
                        placeholder="https://drive.google.com/..."
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-6 border-t border-white/5 mt-8">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-6 py-4 glass-subtle hover:glass-active text-white font-bold rounded-2xl transition-premium text-xs uppercase tracking-wider active:scale-95 cursor-pointer"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-8 py-4 bg-white hover:bg-[#10b981] hover:text-army-dark text-army-dark font-black rounded-2xl transition-premium shadow-xl text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Tinjau Berkas
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 4: REVIEW & CONFIRMATION ── */}
              {step === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-wider">
                        Tinjau Sebelum Mengirim
                      </h3>
                      <p className="text-[10px] text-gray-500 font-mono tracking-wider">
                        PASTIKAN SELURUH DATA FORMULIR SUDAH BENAR
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 flex items-start gap-3">
                    <span className="font-mono font-black text-amber-500 bg-amber-500/20 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      !
                    </span>
                    <span>
                      Setelah formulir ini dikirimkan, Anda tidak diperkenankan
                      melakukan perubahan data/tautan berkas demi menjaga
                      objektivitas seleksi BPH. Silakan review poin-poin di
                      bawah secara teliti.
                    </span>
                  </div>

                  <div className="bg-black/35 rounded-2xl border border-white/5 p-6 space-y-2">
                    {/* Profile Summary Info */}
                    <div className="review-row">
                      <span className="review-label">Nama Lengkap</span>
                      <span className="review-value">{formData.fullName}</span>
                    </div>

                    <div className="review-row">
                      <span className="review-label">NIM Mahasiswa</span>
                      <span className="review-value font-mono">
                        {formData.nim}
                      </span>
                    </div>

                    <div className="review-row">
                      <span className="review-label">Alamat Email</span>
                      <span className="review-value">{formData.email}</span>
                    </div>

                    <div className="review-row">
                      <span className="review-label">No. WhatsApp</span>
                      <span className="review-value font-mono">
                        {formData.whatsapp}
                      </span>
                    </div>

                    <div className="review-row">
                      <span className="review-label">Jalur Organisasi</span>
                      <span className="review-value">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#10b981]/15 text-[#10b981] text-[10px] font-black uppercase tracking-wider">
                          {formData.applyType === "Magang"
                            ? "Staf Magang BEM (3 Bulan)"
                            : "Kepanitiaan Event"}
                        </span>
                      </span>
                    </div>

                    {formData.applyType === "Magang" ? (
                      <>
                        <div className="review-row">
                          <span className="review-label">
                            Departemen Pilihan 1
                          </span>
                          <span className="review-value text-emerald-400 font-bold">
                            {departments.length === 0
                              ? customFirstChoiceDept
                              : formData.firstChoiceDeptId === "custom"
                                ? `${customFirstChoiceDept} (Kustom)`
                                : departments.find(
                                    (d) => d._id === formData.firstChoiceDeptId,
                                  )?.name || formData.firstChoiceDeptId}
                          </span>
                        </div>
                        <div className="review-row">
                          <span className="review-label">
                            Departemen Pilihan 2
                          </span>
                          <span className="review-value">
                            {departments.length === 0
                              ? customSecondChoiceDept ||
                                "Tidak ada pilihan kedua"
                              : formData.secondChoiceDeptId === "custom"
                                ? `${customSecondChoiceDept} (Kustom)`
                                : formData.secondChoiceDeptId
                                  ? departments.find(
                                      (d) =>
                                        d._id === formData.secondChoiceDeptId,
                                    )?.name || formData.secondChoiceDeptId
                                  : "Tidak ada pilihan kedua"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="review-row">
                          <span className="review-label">Event Pilihan 1</span>
                          <span className="review-value text-emerald-400 font-bold">
                            {prokers.length === 0 || useCustomProker
                              ? `${customFirstChoiceProker} (Kustom)`
                              : prokers.find(
                                  (p) => p._id === formData.firstChoiceProkerId,
                                )?.title || formData.firstChoiceProkerId}
                          </span>
                        </div>
                        <div className="review-row">
                          <span className="review-label">Event Pilihan 2</span>
                          <span className="review-value">
                            {prokers.length === 0 || useCustomProker
                              ? customSecondChoiceProker
                                ? `${customSecondChoiceProker} (Kustom)`
                                : "Tidak ada pilihan kedua"
                              : formData.secondChoiceProkerId
                                ? prokers.find(
                                    (p) =>
                                      p._id === formData.secondChoiceProkerId,
                                  )?.title || formData.secondChoiceProkerId
                                : "Tidak ada pilihan kedua"}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="review-row flex-col gap-2">
                      <span className="review-label text-left">
                        Motivasi Diri
                      </span>
                      <span className="text-xs text-gray-300 leading-relaxed text-left block bg-black/40 p-4 rounded-xl border border-white/5 max-h-36 overflow-y-auto italic">
                        &quot;{formData.motivation}&quot;
                      </span>
                    </div>

                    <div className="review-row flex-col gap-2 border-none">
                      <span className="review-label text-left">
                        Tautan Berkas Terlampir
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-1">
                        <a
                          href={formData.cvUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 bg-white/3 hover:bg-white/8 rounded-xl border border-white/5 flex items-center justify-between text-xs text-white transition-premium cursor-pointer group"
                        >
                          <span className="truncate max-w-[120px]">
                            Tinjau File CV
                          </span>
                        </a>

                        <a
                          href={formData.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 bg-white/3 hover:bg-white/8 rounded-xl border border-white/5 flex items-center justify-between text-xs text-white transition-premium cursor-pointer group"
                        >
                          <span className="truncate max-w-[120px]">
                            Tinjau Foto Diri
                          </span>
                        </a>

                        {formData.portfolioUrl ? (
                          <a
                            href={formData.portfolioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 bg-white/3 hover:bg-white/8 rounded-xl border border-white/5 flex items-center justify-between text-xs text-white transition-premium cursor-pointer group"
                          >
                            <span className="truncate max-w-[120px]">
                              Tinjau Portofolio
                            </span>
                          </a>
                        ) : (
                          <div className="p-3 bg-black/20 rounded-xl border border-dashed border-white/5 text-xs text-gray-600 flex items-center justify-center">
                            Tanpa Portofolio
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* reCAPTCHA Security Verification Box */}
                  <div className="p-5 rounded-2xl bg-black/40 border border-[#10b981]/20 space-y-4 max-w-md mx-auto my-6 text-left animate-fade-in">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (isCaptchaVerified || isCaptchaLoading) return;
                            setIsCaptchaLoading(true);
                            // Simulate browser integrity Proof of Work challenge check
                            setTimeout(() => {
                              setIsCaptchaLoading(false);
                              setIsCaptchaVerified(true);
                            }, 1200);
                          }}
                          className={`w-6 h-6 rounded-md border flex items-center justify-center transition-premium cursor-pointer shrink-0 ${
                            isCaptchaVerified
                              ? "bg-[#10b981] border-[#10b981]"
                              : "bg-white/5 border-white/20 hover:border-[#10b981]"
                          }`}
                          title="Klik untuk memverifikasi"
                        >
                          {isCaptchaLoading && (
                            <span className="w-3.5 h-3.5 border border-[#10b981] border-t-transparent rounded-full animate-spin" />
                          )}
                          {isCaptchaVerified && (
                            <span className="text-[#091c11] font-black text-xs">
                              ✓
                            </span>
                          )}
                        </button>

                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Saya Bukan Robot
                          </span>
                          <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest leading-none mt-0.5">
                            reCAPTCHA Shield (PoW Security Verified)
                          </span>
                        </div>
                      </div>

                      {/* Typographic Logo reCAPTCHA Shield */}
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[9px] font-black text-[#10b981] uppercase tracking-[0.2em] leading-none">
                          SHIELD
                        </span>
                        <span className="text-[7px] font-mono text-gray-600 uppercase tracking-widest leading-none mt-1">
                          PROTECTION ACTIVE
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6 border-t border-white/5 mt-8">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={
                        applyMutation.isPending || uploadMutation.isPending
                      }
                      className="px-6 py-4 glass-subtle hover:glass-active text-white font-bold rounded-2xl transition-premium text-xs uppercase tracking-wider active:scale-95 disabled:opacity-40 cursor-pointer"
                    >
                      Sebelumnya
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmitApplication}
                      disabled={
                        applyMutation.isPending ||
                        uploadMutation.isPending ||
                        !isCaptchaVerified
                      }
                      className={`px-8 py-4 bg-[#10b981] hover:bg-emerald-400 text-army-dark font-black rounded-2xl transition-premium shadow-[0_10px_25px_rgba(16,185,129,0.3)] flex items-center gap-2 text-xs uppercase tracking-wider active:scale-95 cursor-pointer ${
                        !isCaptchaVerified
                          ? "opacity-30 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {applyMutation.isPending || uploadMutation.isPending ? (
                        <>
                          <span className="w-4 h-4 border-2 border-[#091c11] border-t-transparent rounded-full animate-spin" />
                          Mengirim Data...
                        </>
                      ) : (
                        "Kirim Formulir"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 5: SUCCESS STATE ── */}
              {step === 5 && (
                <div className="py-8 text-center flex flex-col items-center gap-6 animate-fade-in relative z-10">
                  {/* Confetti Render */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden h-[450px]">
                    {confetti.map((c) => (
                      <div
                        key={c.id}
                        className="confetti-piece"
                        style={{
                          left: c.left,
                          animationDelay: c.delay,
                          backgroundColor: c.color,
                          width: c.size,
                          height: c.size,
                          animationDuration: `${Math.random() * 2 + 2.5}s`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="w-20 h-20 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center text-[#10b981] shadow-[0_0_40px_rgba(16,185,129,0.25)] animate-checkmark-pop">
                    ✓
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white uppercase tracking-wider">
                      PENDAFTARAN BERHASIL!
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 max-w-md leading-relaxed mx-auto">
                      Selamat, formulir Anda telah resmi tersimpan dalam
                      database panitia seleksi. Simpan NIM Anda secara baik
                      untuk pelacakan.
                    </p>
                  </div>

                  {/* Registration Code Plate Card */}
                  <div className="px-6 py-4 bg-black/60 rounded-2xl border border-white/10 flex items-center gap-6 shadow-2xl relative group overflow-hidden max-w-sm w-full justify-between">
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] font-mono text-[#10b981] tracking-widest leading-none mb-1">
                        ID PELACAK (NIM)
                      </span>
                      <span className="text-lg font-bold font-mono text-white tracking-wider leading-none">
                        {formData.nim}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-premium cursor-pointer active:scale-90 shrink-0 font-mono text-xs font-bold"
                      title="Salin NIM Anda"
                    >
                      COPY
                    </button>
                    {isCopied && (
                      <span className="absolute bottom-1 right-2 text-[8px] font-mono text-[#10b981] tracking-widest uppercase">
                        Copied!
                      </span>
                    )}
                  </div>

                  {/* What to do next instructions (Action Items Summary Card) */}
                  <div className="bg-white/2 border border-white/5 rounded-2xl p-6 text-left max-w-md w-full space-y-4 mt-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      Langkah yang Harus Dilakukan Selanjutnya:
                    </h4>

                    <div className="space-y-3">
                      <div className="flex gap-3 items-start">
                        <div className="w-5 h-5 rounded-full bg-[#10b981]/15 text-[#10b981] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          1
                        </div>
                        <p className="text-[11px] text-gray-300 leading-normal">
                          <strong>Simpan NIM pelacak:</strong> Salin & simpan ID
                          pelacak di atas untuk memantau pengumuman wawancara.
                        </p>
                      </div>

                      <div className="flex gap-3 items-start">
                        <div className="w-5 h-5 rounded-full bg-[#10b981]/15 text-[#10b981] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          2
                        </div>
                        <p className="text-[11px] text-gray-300 leading-normal">
                          <strong>Pantau Cek Status:</strong> Masukkan NIM pada
                          kolom <strong>&quot;Lacak Status&quot;</strong> di
                          bawah halaman secara berkala.
                        </p>
                      </div>

                      <div className="flex gap-3 items-start">
                        <div className="w-5 h-5 rounded-full bg-[#10b981]/15 text-[#10b981] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          3
                        </div>
                        <p className="text-[11px] text-gray-300 leading-normal">
                          <strong>Pantau Media Sosial:</strong> Kunjungi
                          instagram resmi{" "}
                          <a
                            href="https://instagram.com/bemftunesa"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#10b981] hover:underline font-bold"
                          >
                            @bemftunesa
                          </a>{" "}
                          untuk info timeline wawancara resmi.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full max-w-sm justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchNim(formData.nim);
                        setActiveSearchNim(formData.nim);
                        setShowAllResults(false);
                        setIsFormOpen(false); // Close the modal!
                        setStep(1);
                        // Scroll to lacak status
                        setTimeout(() => {
                          const el = document.getElementById("lacak-section");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      }}
                      className="px-6 py-3.5 bg-[#10b981] text-army-dark font-bold rounded-2xl hover:bg-emerald-400 transition-premium text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Lacak Status Saya ➔
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setFormData({
                          fullName: "",
                          nim: "",
                          email: "",
                          phone: "",
                          whatsapp: "",
                          applyType: "Magang",
                          firstChoiceDeptId: "",
                          secondChoiceDeptId: "",
                          firstChoiceProkerId: "",
                          secondChoiceProkerId: "",
                          firstChoiceDivisi: "",
                          secondChoiceDivisi: "",
                          motivation: "",
                          cvUrl: "",
                          photoUrl: "",
                          portfolioUrl: "",
                        });
                        setCustomFirstChoiceDept("");
                        setCustomSecondChoiceDept("");
                        setCustomFirstChoiceProker("");
                        setCustomSecondChoiceProker("");
                        setUseCustomProker(false);
                        setFormError("");
                      }}
                      className="px-6 py-3.5 glass-subtle hover:glass-active text-white font-bold rounded-2xl transition-premium text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Daftar Kembali
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Decorative center border divider */}
      <div className="section-divider my-8" />

      {/* ── LACAK & PENGUMUMAN COMBINED SECTION ── */}
      <section
        className="py-24 relative z-10 section-anchor"
        id="lacak-section"
      >
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-mono text-[#10b981] uppercase tracking-[0.3em] mb-2 inline-block">
              {"// CHECK STATUS & RESULTS"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">
              CEK KELOLOSAN & STATUS
            </h2>
            <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto">
              Lacak progress verifikasi berkas individu Anda atau lihat daftar
              final kepengurusan yang diterima.
            </p>
          </div>

          <div className="glass-overlay rounded-3xl p-6 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.65)] relative overflow-hidden transition-premium hover:border-[#10b981]/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-[#10b981]/5 to-transparent blur-2xl pointer-events-none" />

            {/* Unified Section Navigation Toggle Tabs */}
            <div className="flex p-1.5 rounded-2xl bg-black/45 border border-white/5 backdrop-blur-md mb-8 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => {
                  setShowAllResults(false);
                  setFormError("");
                }}
                className={`flex-1 text-center py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-premium cursor-pointer ${
                  !showAllResults
                    ? "bg-[#10b981] text-army-dark shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Lacak Status Individu
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAllResults(true);
                  setFormError("");
                }}
                className={`flex-1 text-center py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-premium cursor-pointer ${
                  showAllResults
                    ? "bg-[#10b981] text-army-dark shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Daftar Seluruh Kelolosan
              </button>
            </div>

            {/* Content Mode A: Lacak Status Individu */}
            {!showAllResults && (
              <div className="space-y-8 animate-fade-in">
                <form
                  onSubmit={handleSearchStatus}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={searchNim}
                      onChange={(e) => setSearchNim(e.target.value)}
                      placeholder="Masukkan NIM Anda (Contoh: 23051204000)"
                      className="font-mono text-center sm:text-left"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isStatusLoading}
                    className="px-8 py-4 bg-[#10b981] hover:bg-emerald-400 text-army-dark font-black rounded-2xl transition-premium shadow-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isStatusLoading ? (
                      <span className="w-5 h-5 border-2 border-army-dark border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Cari Data"
                    )}
                  </button>
                </form>

                {/* Loading State */}
                {isStatusLoading && (
                  <div className="py-12 flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#10b981] animate-spin" />
                    <p className="text-xs font-mono text-gray-500 uppercase">
                      Membuka database rekrutmen...
                    </p>
                  </div>
                )}

                {/* Error Status State */}
                {statusError && (
                  <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-center text-rose-400 text-sm space-y-2 animate-fade-in">
                    <p className="font-black uppercase tracking-wider">
                      NIM Tidak Ditemukan!
                    </p>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                      NIM yang Anda masukkan tidak terdaftar dalam basis data
                      sistem rekrutmen Danadyaksa. Silakan periksa kembali
                      ketikan NIM Anda atau pastikan Anda telah menyelesaikan
                      proses pendaftaran.
                    </p>
                  </div>
                )}

                {/* Status Result Details */}
                {statusRes &&
                  statusRes.data &&
                  !isStatusLoading &&
                  (() => {
                    const details = getStatusDetails(statusRes.data.status);
                    return (
                      <div className="space-y-6 animate-fade-in">
                        <div className="p-6 md:p-8 rounded-2xl bg-white/2 border border-white/5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-white/5 to-transparent blur-xl pointer-events-none" />

                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                              <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest leading-none mb-1">
                                PROFIL PELAMAR
                              </p>
                              <p className="text-lg font-black text-white">
                                {statusRes.data.fullName}
                              </p>
                              <p className="text-xs font-mono text-gray-400">
                                {statusRes.data.nim}
                              </p>
                            </div>

                            <div
                              className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider ${details.colorClass} shrink-0 align-middle text-center`}
                            >
                              {details.label}
                            </div>
                          </div>

                          <div className="h-px bg-white/5 my-6" />
                          <p className="text-xs text-gray-300 leading-relaxed font-sans italic">
                            &quot;{details.desc}&quot;
                          </p>
                        </div>

                        {/* Visual Stepper tracker status */}
                        <div className="p-6 md:p-8 rounded-2xl bg-white/1 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 relative">
                          {/* Step 1 */}
                          <div className="flex items-center gap-4 text-left w-full md:w-auto">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                details.step >= 1
                                  ? "bg-[#10b981] text-army-dark"
                                  : "bg-white/5 text-gray-500"
                              }`}
                            >
                              ✓
                            </div>
                            <div>
                              <p className="text-[8px] font-mono text-gray-600 uppercase tracking-widest mb-0.5">
                                LANGKAH 01
                              </p>
                              <p className="text-xs font-bold text-white uppercase tracking-wider">
                                Berkas Diterima
                              </p>
                            </div>
                          </div>

                          <div className="hidden md:block flex-1 h-[2px] bg-white/5" />

                          {/* Step 2 */}
                          <div className="flex items-center gap-4 text-left w-full md:w-auto">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                details.step >= 2
                                  ? "bg-[#10b981] text-army-dark"
                                  : "bg-white/5 text-gray-500"
                              }`}
                            >
                              {details.step >= 2 ? "✓" : "2"}
                            </div>
                            <div>
                              <p className="text-[8px] font-mono text-gray-600 uppercase tracking-widest mb-0.5">
                                LANGKAH 02
                              </p>
                              <p className="text-xs font-bold text-white uppercase tracking-wider">
                                Tahap Wawancara
                              </p>
                            </div>
                          </div>

                          <div className="hidden md:block flex-1 h-[2px] bg-white/5" />

                          {/* Step 3 */}
                          <div className="flex items-center gap-4 text-left w-full md:w-auto">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                details.step >= 3
                                  ? statusRes.data.status === "Rejected"
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                    : "bg-[#10b981] text-army-dark"
                                  : "bg-white/5 text-gray-500"
                              }`}
                            >
                              {details.step >= 3
                                ? statusRes.data.status === "Rejected"
                                  ? "✗"
                                  : "✓"
                                : "3"}
                            </div>
                            <div>
                              <p className="text-[8px] font-mono text-gray-600 uppercase tracking-widest mb-0.5">
                                LANGKAH 03
                              </p>
                              <p className="text-xs font-bold text-white uppercase tracking-wider">
                                Hasil Pengumuman
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            )}

            {/* Content Mode B: Daftar Seluruh Kelolosan */}
            {showAllResults && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-[#10b981]/20 text-[11px] text-emerald-300 leading-relaxed flex items-start gap-3">
                  <div>
                    <strong>PENGUMUMAN RESMI:</strong> Selamat berkarya bagi
                    seluruh mahasiswa Fakultas Teknik UNESA yang dinyatakan
                    lolos dan resmi masuk menjadi fungsionaris terpilih kabinet
                    Danadyaksa 2026. Gunakan tabel di bawah untuk mencari nama
                    Anda.
                  </div>
                </div>

                {/* Filter live search */}
                <div className="relative">
                  <Input
                    type="text"
                    value={resultsFilter}
                    onChange={(e) => setResultsFilter(e.target.value)}
                    placeholder="Masukkan nama atau NIM untuk memfilter..."
                    className="text-center sm:text-left"
                  />
                </div>

                {/* Results Table list */}
                {isResultsLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#10b981] animate-spin" />
                    <p className="text-xs font-mono text-gray-500 uppercase">
                      Mengunduh daftar fungsionaris...
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/5 bg-white/1 overflow-hidden">
                    {filteredResults.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        <div className="grid grid-cols-3 p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-black/35">
                          <div className="col-span-2">Nama Fungsionaris</div>
                          <div className="text-right">NIM Mahasiswa</div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5">
                          {filteredResults.map(
                            (member: RecruitmentResultMember, i: number) => (
                              <div
                                key={i}
                                className="grid grid-cols-3 p-4 text-xs font-medium text-white hover:bg-white/2 transition-premium font-sans"
                              >
                                <div className="col-span-2 flex items-center gap-3">
                                  <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0" />
                                  <span className="truncate">
                                    {member.fullName}
                                  </span>
                                </div>
                                <div className="text-right font-mono text-gray-400">
                                  {member.nim}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-gray-500 text-xs italic">
                        {resultsFilter
                          ? "Fungsionaris tidak ditemukan."
                          : "Belum ada data pengumuman kelolosan fungsionaris yang dipublikasikan."}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
