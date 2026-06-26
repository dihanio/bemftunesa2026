"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { ImsApiService } from "@/lib/api";
import { FormInput } from "@/components/ui";
import { Save, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AboutSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [settings, setSettings] = useState<any>({
    visionTitle: "",
    visionDescription: "",
    missions: [""],
    coreValues: [],
    logoPhilosophies: [],
    marsLyrics: [""],
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await ImsApiService.getSettings();
      if (res.data) {
        setSettings({
          visionTitle: res.data.visionTitle || "",
          visionDescription: res.data.visionDescription || "",
          missions: res.data.missions?.length ? res.data.missions : [""],
          coreValues: res.data.coreValues || [],
          logoPhilosophies: res.data.logoPhilosophies || [],
          marsLyrics: res.data.marsLyrics?.length ? res.data.marsLyrics : [""],
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
      setMessage({ type: "error", text: "Gagal memuat pengaturan Profil BEM." });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      // Clean up empty arrays
      const payload = {
        ...settings,
        missions: settings.missions.filter((m: string) => m.trim() !== ""),
        marsLyrics: settings.marsLyrics.filter((l: string) => l.trim() !== ""),
      };
      await ImsApiService.updateSettings(payload);
      setMessage({ type: "success", text: "Pengaturan Profil BEM berhasil disimpan." });
      fetchSettings();
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save settings", error);
      setMessage({ type: "error", text: "Gagal menyimpan pengaturan." });
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Missions
  const addMission = () => {
    setSettings({ ...settings, missions: [...settings.missions, ""] });
  };
  const updateMission = (index: number, val: string) => {
    const newMissions = [...settings.missions];
    newMissions[index] = val;
    setSettings({ ...settings, missions: newMissions });
  };
  const removeMission = (index: number) => {
    const newMissions = settings.missions.filter((_: any, i: number) => i !== index);
    setSettings({ ...settings, missions: newMissions });
  };

  // Handlers for Mars Lyrics
  const addLyric = () => {
    setSettings({ ...settings, marsLyrics: [...settings.marsLyrics, ""] });
  };
  const updateLyric = (index: number, val: string) => {
    const newLyrics = [...settings.marsLyrics];
    newLyrics[index] = val;
    setSettings({ ...settings, marsLyrics: newLyrics });
  };
  const removeLyric = (index: number) => {
    const newLyrics = settings.marsLyrics.filter((_: any, i: number) => i !== index);
    setSettings({ ...settings, marsLyrics: newLyrics });
  };

  return (
    <DashboardShell>
      <div className="space-y-8 max-w-4xl mx-auto w-full animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Profil BEM FT</h1>
            <p className="text-foreground/60 text-sm mt-1">Kelola visi, misi, dan konten halaman Tentang Kami</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center justify-center gap-2 bg-sage text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-sage/90 disabled:opacity-50 transition-colors shadow-lg shadow-sage/20 border border-sage/50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-fade-in border ${
            message.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <p>{message.text}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
            <span className="text-sm text-foreground/50">Memuat pengaturan...</span>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* Visi */}
            <div className="glass-panel border border-white/5 p-6 sm:p-8 rounded-2xl space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center border border-sage/20">
                  <span className="text-sage font-bold">V</span>
                </div>
                <h2 className="text-lg font-semibold text-white">Visi</h2>
              </div>
              
              <FormInput
                label="Judul Visi (Kabinet)"
                name="vision-title"
                value={settings.visionTitle}
                onChange={(e) => setSettings({ ...settings, visionTitle: e.target.value })}
                placeholder="Misal: Sinergi Nyata, Teknik Berdaya"
              />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/90 block">Deskripsi Visi</label>
                <textarea
                  className="w-full bg-black/20 border border-white/10 focus:border-sage/50 rounded-xl px-4 py-3 min-h-[120px] outline-none transition-all placeholder:text-foreground/30 text-sm resize-none"
                  value={settings.visionDescription}
                  onChange={(e) => setSettings({ ...settings, visionDescription: e.target.value })}
                  placeholder="Deskripsikan visi kabinet secara lengkap..."
                />
              </div>
            </div>

            {/* Misi */}
            <div className="glass-panel border border-white/5 p-6 sm:p-8 rounded-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <span className="text-blue-400 font-bold">M</span>
                  </div>
                  <h2 className="text-lg font-semibold text-white">Misi</h2>
                </div>
                <button 
                  onClick={addMission} 
                  className="text-sm flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" /> Tambah Misi
                </button>
              </div>
              
              <div className="space-y-4">
                {settings.missions.map((m: string, i: number) => (
                  <div key={i} className="flex gap-3 items-start group">
                    <span className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-foreground/70 shrink-0">
                      {i + 1}
                    </span>
                    <textarea
                      className="flex-1 bg-black/20 border border-white/10 focus:border-blue-500/50 rounded-xl px-4 py-3 min-h-[80px] outline-none transition-all placeholder:text-foreground/30 text-sm resize-none"
                      value={m}
                      onChange={(e) => updateMission(i, e.target.value)}
                      placeholder={`Misi ke-${i + 1}...`}
                    />
                    <button 
                      onClick={() => removeMission(i)} 
                      className="p-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl shrink-0 opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-rose-500/20"
                      title="Hapus Misi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {settings.missions.length === 0 && (
                  <div className="text-center py-6 text-sm text-foreground/50 bg-white/5 rounded-xl border border-dashed border-white/10">
                    Belum ada misi yang ditambahkan.
                  </div>
                )}
              </div>
            </div>

            {/* Lirik Mars */}
            <div className="glass-panel border border-white/5 p-6 sm:p-8 rounded-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <span className="text-amber-400 font-bold">♪</span>
                  </div>
                  <h2 className="text-lg font-semibold text-white">Lirik Mars Teknik</h2>
                </div>
                <button 
                  onClick={addLyric} 
                  className="text-sm flex items-center gap-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" /> Tambah Bait
                </button>
              </div>
              
              <div className="space-y-4">
                {settings.marsLyrics.map((l: string, i: number) => (
                  <div key={i} className="flex gap-3 items-start group">
                    <span className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-foreground/70 shrink-0">
                      {i + 1}
                    </span>
                    <textarea
                      className="flex-1 bg-black/20 border border-white/10 focus:border-amber-500/50 rounded-xl px-4 py-3 min-h-[100px] outline-none transition-all placeholder:text-foreground/30 text-sm resize-none"
                      value={l}
                      onChange={(e) => updateLyric(i, e.target.value)}
                      placeholder={`Bait ke-${i + 1}...`}
                    />
                    <button 
                      onClick={() => removeLyric(i)} 
                      className="p-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl shrink-0 opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-rose-500/20"
                      title="Hapus Bait"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {settings.marsLyrics.length === 0 && (
                  <div className="text-center py-6 text-sm text-foreground/50 bg-white/5 rounded-xl border border-dashed border-white/10">
                    Belum ada lirik yang ditambahkan.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
