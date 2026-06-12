"use client";

import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import { useState } from "react";

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function KontakClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20 relative">
        <div className="absolute -left-6 top-0 w-1 h-full bg-[#10b981]/20" />
        <div>
          <h1 className="text-4xl md:text-7xl font-bold text-white mb-4 font-sans tracking-tight">
            Hubungi Kami
          </h1>
          <p className="text-[#10b981] font-mono tracking-[0.3em] uppercase flex items-center gap-3">
            <span className="w-12 h-[1px] bg-[#10b981]/30"></span>
            Connection Protocol
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 relative">
        {/* Info Section */}
        <div className="lg:col-span-2 space-y-8 relative z-10">
          <div className="glass-subtle p-8 rounded-[32px] border border-white/5 relative overflow-hidden group h-full">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-bl-[100px] -z-10 group-hover:bg-[#10b981]/10 transition-colors duration-500" />
             
             <h3 className="text-xl font-bold text-white mb-10 font-sans">Informasi Kontak</h3>
             
             <div className="space-y-8">
               <div className="flex items-start gap-5 group/item">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover/item:bg-[#10b981] group-hover/item:text-[#091c11] transition-all duration-300 group-hover/item:scale-110">
                   <MapPin className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">{"// ALAMAT"}</p>
                   <p className="text-sm text-gray-300 leading-relaxed">
                     A11.02.01, Fakultas Teknik,<br />
                     Universitas Negeri Surabaya,<br />
                     Ketintang, Surabaya.
                   </p>
                 </div>
               </div>

               <div className="flex items-start gap-5 group/item">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover/item:bg-[#10b981] group-hover/item:text-[#091c11] transition-all duration-300 group-hover/item:scale-110">
                   <Phone className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">{"// TELEPON"}</p>
                   <p className="text-sm text-gray-300 font-mono tracking-wider">
                     +62 812-3456-7890
                   </p>
                 </div>
               </div>

               <div className="flex items-start gap-5 group/item">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover/item:bg-[#10b981] group-hover/item:text-[#091c11] transition-all duration-300 group-hover/item:scale-110">
                   <Mail className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">{"// EMAIL"}</p>
                   <a href="mailto:bemft@unesa.ac.id" className="text-sm text-gray-300 hover:text-[#10b981] transition-colors">
                     bemft@unesa.ac.id
                   </a>
                 </div>
               </div>

               <div className="flex items-start gap-5 group/item">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover/item:bg-[#10b981] group-hover/item:text-[#091c11] transition-all duration-300 group-hover/item:scale-110">
                   <Instagram className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">{"// INSTAGRAM"}</p>
                   <a href="https://instagram.com/bemftunesa" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-300 hover:text-[#10b981] transition-colors">
                     @bemftunesa
                   </a>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-3 relative z-10">
          <div className="glass-overlay p-8 md:p-12 rounded-[32px] border border-white/5 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981] opacity-[0.02] rounded-full blur-3xl" />
            
            <div className="flex items-center gap-3 mb-8">
              <MessageSquare className="w-5 h-5 text-[#10b981]" />
              <h3 className="text-xl font-bold text-white font-sans">Kirim Pesan</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#10b981]/40 focus:bg-white/[0.05] transition-all font-mono placeholder:font-sans"
                    placeholder="Masukkan nama"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest ml-1">Email</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#10b981]/40 focus:bg-white/[0.05] transition-all font-mono placeholder:font-sans"
                    placeholder="alamat@email.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest ml-1">Subjek</label>
                <input 
                  type="text" 
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#10b981]/40 focus:bg-white/[0.05] transition-all font-mono placeholder:font-sans"
                  placeholder="Hal yang ingin didiskusikan"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest ml-1">Pesan</label>
                <textarea 
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#10b981]/40 focus:bg-white/[0.05] transition-all resize-none font-mono placeholder:font-sans"
                  placeholder="Tulis pesan Anda di sini..."
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 mt-4
                  ${isSubmitted 
                    ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30" 
                    : isSubmitting
                    ? "bg-[#10b981]/50 text-[#091c11] cursor-not-allowed"
                    : "bg-[#10b981] text-[#091c11] hover:bg-[#10b981]/90 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"}
                `}
              >
                {isSubmitted ? (
                  <>Pesan Terkirim <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" /></>
                ) : isSubmitting ? (
                  "Memproses..."
                ) : (
                  <>Kirim Pesan <Send className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
