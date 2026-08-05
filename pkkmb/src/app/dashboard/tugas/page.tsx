"use client";

import { useEffect, useState } from "react";
import { FileText, CheckCircle2, Clock, AlertTriangle, UploadCloud, Users, User, X } from "lucide-react";

interface Task {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  type: "individu" | "kelompok" | "angkatan";
  status: string;
  allowedFormats: string[];
}

interface Submission {
  taskId: { _id: string };
  status: string;
  score?: number;
  feedback?: string;
  fileUrl: string;
  submittedAt: string;
}

export default function TugasMabaPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isKetuaGugus, setIsKetuaGugus] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [fileUrlInput, setFileUrlInput] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);


  const fetchProfile = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/v1/auth/me", { credentials: "include" });
      const json = await res.json();
      if (json.success && json.data) {
        setIsKetuaGugus(json.data.isKetuaGugus || false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, subsRes] = await Promise.all([
        fetch("http://localhost:4000/api/v1/pkkmb/tasks", { credentials: "include" }),
        fetch("http://localhost:4000/api/v1/pkkmb/maba/submissions", { credentials: "include" })
      ]);
      
      const tasksJson = await tasksRes.json();
      const subsJson = await subsRes.json();

      if (tasksJson.success) setTasks(tasksJson.data || []);
      if (subsJson.success) setSubmissions(subsJson.data || []);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchData();
      fetchProfile();
    }, 0);
  }, []);



  const getSubmissionForTask = (taskId: string) => {
    return submissions.find(s => s.taskId?._id === taskId || (s.taskId as unknown as string) === taskId);
  };

  const isDeadlinePassed = (deadline: string) => new Date() > new Date(deadline);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!fileUrlInput.trim()) {
      setSubmitError("Link Google Drive tidak boleh kosong.");
      return;
    }

    setSubmitLoading(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const res = await fetch(`http://localhost:4000/api/v1/pkkmb/maba/tasks/${selectedTask._id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ fileUrl: fileUrlInput })
      });
      
      const json = await res.json();
      if (res.ok && json.success) {
        setSubmitSuccess(true);
        // Refresh data
        await fetchData();
        setTimeout(() => {
          setSelectedTask(null);
          setFileUrlInput("");
          setSubmitSuccess(false);
        }, 1500);
      } else {
        setSubmitError(json.message || "Gagal mengumpulkan tugas.");
      }
    } catch {
      setSubmitError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const canSubmitTask = (task: Task) => {
    if (task.type === "kelompok" && !isKetuaGugus) return false;
    if (isDeadlinePassed(task.deadline)) return false; // Hard deadline config needed, but assuming strict deadline for now
    return true;
  };

  if (loading || profileLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold mb-2">Penugasan PKKMB</h1>
        <p className="text-white/60">Kumpulkan semua penugasan Individu maupun Kelompok di sini. Pastikan akses Google Drive file/folder Anda di-set ke &quot;Anyone with the link can view&quot;.</p>
      </div>

      {!isKetuaGugus && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-4 text-blue-200">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 text-blue-400" />
          <p className="text-sm leading-relaxed">
            Anda adalah <strong>Anggota Gugus</strong>. Untuk Tugas Kelompok dan Tugas Angkatan, pengumpulan (submit) hanya dapat dilakukan oleh Ketua Gugus Anda. Anda dapat melihat status pengumpulan di sini.
          </p>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
          <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white/50">Belum Ada Tugas</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => {
            const submission = getSubmissionForTask(task._id);
            const isLate = isDeadlinePassed(task.deadline) && !submission;
            const hasSubmitted = !!submission;
            const isGraded = submission?.status === 'GRADED';

            let statusColor = "bg-white/5 border-white/10 text-white/60";
            let StatusIcon = Clock;
            let statusText = "Belum Dikerjakan";

            if (isGraded) {
              statusColor = "bg-green-500/10 border-green-500/30 text-green-400";
              StatusIcon = CheckCircle2;
              statusText = `Dinilai (${submission.score}/100)`;
            } else if (hasSubmitted) {
              statusColor = "bg-blue-500/10 border-blue-500/30 text-blue-400";
              StatusIcon = CheckCircle2;
              statusText = "Sudah Submit";
            } else if (isLate) {
              statusColor = "bg-red-500/10 border-red-500/30 text-red-400";
              StatusIcon = AlertTriangle;
              statusText = "Terlambat";
            }

            return (
              <div key={task._id} className={`group bg-black/40 backdrop-blur-md border ${hasSubmitted ? 'border-gold-500/20' : 'border-white/10'} rounded-3xl p-6 flex flex-col hover:border-gold-500/50 transition-colors relative overflow-hidden`}>
                {hasSubmitted && <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 blur-3xl rounded-full" />}
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5
                    ${task.type === 'individu' ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-orange-500/10 border-orange-500/20 text-orange-300'}
                  `}>
                    {task.type === 'individu' ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                    <span className="capitalize">{task.type}</span>
                  </div>
                  
                  <div className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${statusColor}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span>{statusText}</span>
                  </div>
                </div>

                <h3 className="font-display font-bold text-lg leading-tight mb-2 relative z-10">{task.title}</h3>
                
                <div className="flex items-center gap-2 text-sm text-white/50 mb-6 relative z-10">
                  <Clock className="w-4 h-4" />
                  <span>Deadline: {new Date(task.deadline).toLocaleString("id-ID", {
                    dateStyle: "medium", timeStyle: "short"
                  })}</span>
                </div>

                <div className="mt-auto relative z-10 space-y-3">
                  {submission && (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-sm">
                      <div className="text-white/60 mb-1">Tautan Tugas:</div>
                      <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="text-gold-400 hover:underline truncate block">
                        {submission.fileUrl}
                      </a>
                    </div>
                  )}

                  {!isGraded && (
                    <button
                      onClick={() => setSelectedTask(task)}
                      disabled={!canSubmitTask(task) && !hasSubmitted}
                      className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                        canSubmitTask(task) || hasSubmitted
                          ? "bg-gold-500 hover:bg-gold-400 text-black"
                          : "bg-white/10 text-white/30 cursor-not-allowed"
                      }`}
                    >
                      {hasSubmitted ? "Perbarui Pengumpulan" : "Kumpulkan Tugas"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !submitLoading && setSelectedTask(null)} />
          <div className="bg-[#111] border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-lg relative z-10 shadow-2xl">
            <button 
              onClick={() => setSelectedTask(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
              disabled={submitLoading}
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="font-display font-bold text-2xl mb-1 pr-10">{selectedTask.title}</h2>
            <div className="flex items-center gap-2 text-sm text-gold-500 mb-6">
              <UploadCloud className="w-4 h-4" />
              <span>Pengumpulan {selectedTask.type === 'individu' ? 'Tugas Individu' : 'Tugas Kelompok'}</span>
            </div>

            <p className="text-sm text-white/70 mb-6 leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>

            {(!canSubmitTask(selectedTask) && selectedTask.type === 'kelompok' && !isKetuaGugus) ? (
               <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
                 Maaf, hanya Ketua Gugus yang dapat melakukan pengumpulan (submit) untuk tugas kelompok.
               </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-white/80 mb-2">Tautan (Link) File / Google Drive</label>
                  <input
                    type="url"
                    required
                    value={fileUrlInput}
                    onChange={(e) => setFileUrlInput(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    disabled={submitLoading || submitSuccess}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                  />
                  <p className="text-xs text-white/40 mt-2">Pastikan tautan dapat diakses publik (Anyone with the link can view).</p>
                </div>

                {submitError && (
                  <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    {submitError}
                  </div>
                )}

                {submitSuccess && (
                  <div className="text-green-400 text-sm bg-green-500/10 p-3 rounded-lg border border-green-500/20 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Berhasil disimpan! Memperbarui data...
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitLoading || submitSuccess}
                  className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {submitLoading ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    "Kirim Tugas"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
