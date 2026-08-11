"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Save, GripVertical, Download, Upload, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ManagedQuiz, ManagedQuestion, TargetType, QuizType } from "@/lib/quiz";
import { parseImportFile, validateImportRows, normalizeOrders, downloadTemplate, ImportRowResult } from "@/lib/quiz-import-export";
import toast from "react-hot-toast";

const TYPES: QuizType[] = ["PRETEST", "POSTTEST", "MATERIAL"];
const TARGET_TYPES: TargetType[] = ["ALL", "FACULTY", "STUDY_PROGRAM", "GROUP", "INDIVIDUAL"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface TargetOption { _id: string; label: string; }

interface GroupItem { _id: string; name: string; nomor?: number; }
interface StudyProgramItem { _id: string; name: string; faculty?: string; }

const emptyQuestion = (): ManagedQuestion => ({
  question: "",
  options: [
    { id: "A", text: "" },
    { id: "B", text: "" },
    { id: "C", text: "" },
    { id: "D", text: "" },
  ],
  correctAnswer: "A",
  points: 1,
});

export default function QuizForm({ quiz }: { quiz?: ManagedQuiz }) {
  const router = useRouter();
  const isEdit = !!quiz;

  const [title, setTitle] = useState(quiz?.title || "");
  const [description, setDescription] = useState(quiz?.description || "");
  const [type, setType] = useState<QuizType>(quiz?.type || "PRETEST");
  const [status, setStatus] = useState<string>(quiz?.status || "DRAFT");
  const [targetType, setTargetType] = useState<TargetType>(quiz?.targetType || "ALL");
  const [targetIds, setTargetIds] = useState<string[]>(quiz?.targetIds || []);
  const [startTime, setStartTime] = useState(quiz?.startTime ? toLocalInput(quiz.startTime) : "");
  const [endTime, setEndTime] = useState(quiz?.endTime ? toLocalInput(quiz.endTime) : "");
  const [durationMinutes, setDurationMinutes] = useState(quiz?.durationMinutes ?? 30);
  const [maxAttempts, setMaxAttempts] = useState(quiz?.maxAttempts ?? 1);
  const [passingScore, setPassingScore] = useState(quiz?.passingScore ?? 0);
  const [questions, setQuestions] = useState<ManagedQuestion[]>(
    quiz?.questions && quiz.questions.length > 0 ? quiz.questions : [emptyQuestion()],
  );

  const [faculties, setFaculties] = useState<string[]>([]);
  const [studyPrograms, setStudyPrograms] = useState<StudyProgramItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [students, setStudents] = useState<TargetOption[]>([]);
  const [saving, setSaving] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<"IDLE" | "PARSING" | "PREVIEW" | "VALIDATION_ERROR" | "IMPORTING" | "SUCCESS">("IDLE");
  const [validRows, setValidRows] = useState<ImportRowResult[]>([]);
  const [invalidRows, setInvalidRows] = useState<ImportRowResult[]>([]);
  const [importMsg, setImportMsg] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [duplicateWarnings, setDuplicateWarnings] = useState<
    { rowNum: number; question: string; existing: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadTargets = async () => {
      try {
        const [spRes, gRes] = await Promise.all([
          apiFetch("/pkkmb/master/study-programs"),
          apiFetch("/pkkmb/gugus"),
        ]);
        const spJson = await spRes.json();
        const gJson = await gRes.json();
        if (spJson.success) {
          const sps = spJson.data as StudyProgramItem[];
          setStudyPrograms(sps);
          const f = Array.from(new Set(sps.map((s) => s.faculty).filter(Boolean))) as string[];
          setFaculties(f);
        }
        if (gJson.success) {
          const gs = gJson.data as GroupItem[];
          setGroups(gs.map((g) => ({ _id: g._id, name: g.name, nomor: g.nomor })));
        }
      } catch {}
    };
    loadTargets();
  }, []);

  useEffect(() => {
    if (targetType !== "INDIVIDUAL") return;
    const load = async () => {
      try {
        const res = await apiFetch("/pkkmb/admin/maba?limit=200");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setStudents(json.data.map((s: { _id: string; name: string; nim?: string }) => ({
            _id: s._id,
            label: `${s.name}${s.nim ? ` (${s.nim})` : ""}`,
          })));
        }
      } catch {}
    };
    load();
  }, [targetType]);

  const toggleId = (id: string) => {
    setTargetIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const renderTargetSelector = () => {
    if (targetType === "ALL") return null;
    if (targetType === "FACULTY") {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {faculties.map((f) => (
            <label key={f} className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-gold-500/40 text-sm">
              <input type="checkbox" checked={targetIds.includes(f)} onChange={() => toggleId(f)} className="accent-gold-500" />
              {f}
            </label>
          ))}
        </div>
      );
    }
    if (targetType === "STUDY_PROGRAM") {
      return (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
            {studyPrograms.map((sp) => (
              <label key={sp._id} className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-gold-500/40 text-sm">
                <input type="checkbox" checked={targetIds.includes(sp._id)} onChange={() => toggleId(sp._id)} className="accent-gold-500" />
                {sp.name}
              </label>
            ))}
          </div>
        </div>
      );
    }
    if (targetType === "GROUP") {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
          {groups.map((g) => (
            <label key={g._id} className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-gold-500/40 text-sm">
              <input type="checkbox" checked={targetIds.includes(g._id)} onChange={() => toggleId(g._id)} className="accent-gold-500" />
              {g.nomor ? `Gugus ${g.nomor} - ${g.name}` : g.name}
            </label>
          ))}
        </div>
      );
    }
    // INDIVIDUAL
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
          {students.map((s) => (
            <label key={s._id} className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-gold-500/40 text-sm">
              <input type="checkbox" checked={targetIds.includes(s._id)} onChange={() => toggleId(s._id)} className="accent-gold-500" />
              {s.label}
            </label>
          ))}
        </div>
        {students.length === 0 && <p className="text-sm text-white/40">Memuat daftar mahasiswa...</p>}
      </div>
    );
  };

  const updateQuestion = (idx: number, patch: Partial<ManagedQuestion>) => {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateOption = (qi: number, oi: number, text: string) => {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi
          ? { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, text } : o)) }
          : q,
      ),
    );
  };

  const addQuestion = () => setQuestions((qs) => [...qs, emptyQuestion()]);
  const removeQuestion = (idx: number) => setQuestions((qs) => qs.filter((_, i) => i !== idx));
  const moveQuestion = (idx: number, dir: number) => {
    setQuestions((qs) => {
      const target = idx + dir;
      if (target < 0 || target >= qs.length) return qs;
      const copy = [...qs];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Judul quiz tidak boleh kosong.";
    if (passingScore < 0 || passingScore > 100) {
      return "Passing score harus antara 0-100 persen.";
    }
    if (questions.length === 0) return "Minimal harus ada 1 soal.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) return `Soal ${i + 1} belum memiliki teks.`;
      if (q.options.length < 4) return `Soal ${i + 1} harus memiliki 4 opsi.`;
      if (q.options.some((o) => !o.text.trim())) return `Soal ${i + 1} ada opsi yang kosong.`;
      if (!q.options.some((o) => o.id === q.correctAnswer)) return `Soal ${i + 1} jawaban benar tidak valid.`;
      if ((q.points ?? 0) <= 0) return `Soal ${i + 1} poin harus lebih dari 0.`;
    }
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      return "Waktu tutup harus setelah waktu buka.";
    }
    return null;
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
  };

  const openImport = () => {
    setImportOpen(true);
    setImportStatus("IDLE");
    setValidRows([]);
    setInvalidRows([]);
    setImportMsg("");
    setSelectedFile(null);
    setImporting(false);
    setDuplicateWarnings([]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("File harus berupa Excel (.xlsx).");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran file maksimal 5 MB.");
      return;
    }

    setSelectedFile(file);
    setDuplicateWarnings([]);
    setImportStatus("PARSING");
    setImportMsg("");
    try {
      const parsed = await parseImportFile(file);
      if (parsed.sheetMissingMsg) {
        setImportStatus("VALIDATION_ERROR");
        setImportMsg(parsed.sheetMissingMsg);
        return;
      }
      const { valid, invalid } = validateImportRows(parsed.rows);
      setValidRows(valid);
      setInvalidRows(invalid);
      setImportStatus(invalid.length > 0 ? "VALIDATION_ERROR" : "PREVIEW");
    } catch {
      setImportStatus("VALIDATION_ERROR");
      setImportMsg("Gagal membaca file Excel.");
    }
  };

  const confirmImport = () => runImport(false);

  const runImport = async (skip: boolean) => {
    if (!selectedFile) {
      toast.error("Tidak ada file yang dipilih.");
      return;
    }
    if (validRows.length === 0) {
      toast.error("Tidak ada soal valid untuk diimport.");
      return;
    }

    setImporting(true);
    setImportStatus("IMPORTING");
    try {
      // Create flow (belum ada quiz di DB): deteksi duplikat vs soal yang
      // sudah ada di Question Builder (state) → WARNING yang sama dengan edit.
      if (!isEdit && !skip) {
        const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
        const dups = validRows
          .filter(
            (r) =>
              r.question &&
              questions.some((eq) => norm(eq.question) === norm(r.question as string)),
          )
          .map((r) => ({
            rowNum: r.rowNum,
            question: r.question as string,
            existing:
              questions.find(
                (eq) => norm(eq.question) === norm(r.question as string),
              )?.question || "",
          }));
        if (dups.length > 0) {
          setDuplicateWarnings(dups);
          setImportStatus("VALIDATION_ERROR");
          setImportMsg(
            `${dups.length} soal memiliki pertanyaan yang sudah ada di quiz.`,
          );
          return;
        }
      }

      const fd = new FormData();
      fd.append("file", selectedFile);
      // Backend WAJIB validasi ulang. Create = validate-only (soal masuk
      // Question Builder, disimpan saat Save Quiz). Edit = APPEND + simpan.
      // skip=true dipakai saat user memilih [Import Tetap] (duplikat WARNING).
      const url = isEdit
        ? `/pkkmb/quiz/${quiz!._id}/import${skip ? "?skipDuplicates=true" : ""}`
        : "/pkkmb/quiz/import";
      const res = await apiFetch(url, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();

      if (res.ok && json.success) {
        if (isEdit && Array.isArray(json.data?.questions)) {
          // Quiz existing: backend sudah APPEND + normalisasi order.
          setQuestions(
            normalizeOrders(json.data.questions as ManagedQuestion[]),
          );
        } else if (!isEdit && Array.isArray(json.data?.rows)) {
          const incoming = (json.data.rows as ImportRowResult[]).map((r) => ({
            question: r.question as string,
            options: r.options as ManagedQuestion["options"],
            correctAnswer: r.correctAnswer as string,
            points: r.points as number,
            order: r.order,
          }));
          setQuestions(normalizeOrders([...questions, ...incoming]));
        }
        setImportStatus("SUCCESS");
        setImportOpen(false);
        setDuplicateWarnings([]);
        toast.success(
          json.message || `${validRows.length} soal berhasil ditambahkan.`,
        );
      } else if (res.status === 401) {
        setImportStatus("VALIDATION_ERROR");
        toast.error("Sesi berakhir. Silakan login kembali.");
        router.push("/login");
      } else if (res.status === 403) {
        setImportStatus("VALIDATION_ERROR");
        setImportMsg("Kamu tidak memiliki izin untuk import soal.");
      } else if (res.status === 404) {
        setImportStatus("VALIDATION_ERROR");
        setImportMsg("Quiz tidak ditemukan.");
      } else if (res.status === 413) {
        // File melebihi batas multer (5 MB).
        setImportStatus("VALIDATION_ERROR");
        setImportMsg("Ukuran file maksimal 5 MB.");
      } else if (res.status === 422) {
        const dups = Array.isArray(json.duplicates) ? json.duplicates : [];
        if (dups.length > 0) {
          // WARNING: soal sudah ada di quiz — user memilih Import Tetap/Batal.
          setDuplicateWarnings(dups);
          setImportStatus("VALIDATION_ERROR");
          setImportMsg(
            json.message || "Beberapa soal sudah ada di quiz.",
          );
        } else {
          // Atomic: backend menolak seluruh file, tidak ada yang diimport.
          setImportStatus("VALIDATION_ERROR");
          setImportMsg(
            json.message ||
              "Data soal tidak valid. Perbaiki file terlebih dahulu.",
          );
          setInvalidRows(
            Array.isArray(json.errors) ? (json.errors as ImportRowResult[]) : [],
          );
        }
      } else {
        setImportStatus("VALIDATION_ERROR");
        setImportMsg(json.message || "Gagal mengimpor soal.");
      }
    } catch {
      setImportStatus("VALIDATION_ERROR");
      setImportMsg("Terjadi kesalahan jaringan.");
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    const payload = {
      title,
      description,
      type,
      status,
      targetType,
      targetIds,
      startTime: startTime ? new Date(startTime).toISOString() : undefined,
      endTime: endTime ? new Date(endTime).toISOString() : undefined,
      durationMinutes: Number(durationMinutes),
      maxAttempts: Number(maxAttempts),
      passingScore: Number(passingScore),
      questions: questions.map((q, i) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: Number(q.points),
        order: i,
      })),
    };

    setSaving(true);
    try {
      const url = isEdit ? `/pkkmb/quiz/${quiz!._id}` : "/pkkmb/quiz";
      const res = await apiFetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(isEdit ? "Quiz berhasil diperbarui!" : "Quiz berhasil dibuat!");
        router.push("/dashboard/manage/quiz");
      } else {
        toast.error(json.message || "Gagal menyimpan quiz.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors";
  const labelCls = "block text-sm font-bold text-white/80 mb-2";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.push("/dashboard/manage/quiz")} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <h1 className="text-3xl font-display font-bold">{isEdit ? "Edit Quiz" : "Buat Quiz Baru"}</h1>

      {/* Info dasar */}
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
        <div>
          <label className={labelCls}>Judul *</label>
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pretest Pra-PKKMB" />
        </div>
        <div>
          <label className={labelCls}>Deskripsi</label>
          <textarea className={`${inputCls} min-h-24`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi quiz" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Jenis Quiz *</label>
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as QuizType)}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Status *</label>
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Target *</label>
            <select className={inputCls} value={targetType} onChange={(e) => { setTargetType(e.target.value as TargetType); setTargetIds([]); }}>
              {TARGET_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Waktu Buka</label>
            <input type="datetime-local" className={inputCls} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Waktu Tutup</label>
            <input type="datetime-local" className={inputCls} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Durasi (menit)</label>
            <input type="number" min={1} className={inputCls} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Maksimal Percobaan</label>
            <input type="number" min={1} className={inputCls} value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Passing Score (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              className={inputCls}
              value={passingScore}
              onChange={(e) => {
                const v = Number(e.target.value);
                setPassingScore(Number.isNaN(v) ? 0 : Math.min(100, Math.max(0, v)));
              }}
            />
            <p className="text-xs text-white/40 mt-1">
              Nilai minimum kelulusan dalam persentase (0-100).
            </p>
          </div>
        </div>

        {targetType !== "ALL" && (
          <div>
            <label className={labelCls}>Pilih Target *</label>
            {renderTargetSelector()}
          </div>
        )}
      </div>

      {/* Question builder */}
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl">Soal</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-xl font-bold transition-colors">
              <Download className="w-4 h-4" /> Download Template
            </button>
            <button onClick={openImport} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold transition-colors">
              <Upload className="w-4 h-4" /> Import Excel
            </button>
            <button onClick={addQuestion} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold transition-colors">
              <Plus className="w-4 h-4" /> Tambah Soal
            </button>
          </div>
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-white/60 text-sm font-bold">
                <GripVertical className="w-4 h-4 text-white/30" /> Soal {qi + 1}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => moveQuestion(qi, -1)} disabled={qi === 0} className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30">↑</button>
                <button onClick={() => moveQuestion(qi, 1)} disabled={qi === questions.length - 1} className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30">↓</button>
                <button onClick={() => removeQuestion(qi)} disabled={questions.length === 1} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg disabled:opacity-30">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <textarea
              className={`${inputCls} min-h-20`}
              value={q.question}
              onChange={(e) => updateQuestion(qi, { question: e.target.value })}
              placeholder="Teks pertanyaan..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt, oi) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="w-6 text-center font-bold text-white/50">{opt.id}.</span>
                  <input
                    className={inputCls}
                    value={opt.text}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    placeholder={`Opsi ${opt.id}`}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Jawaban Benar</label>
                <select className={inputCls} value={q.correctAnswer} onChange={(e) => updateQuestion(qi, { correctAnswer: e.target.value })}>
                  {q.options.map((o) => <option key={o.id} value={o.id}>{o.id}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Poin</label>
                <input type="number" min={1} className={inputCls} value={q.points} onChange={(e) => updateQuestion(qi, { points: Number(e.target.value) })} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pb-16">
        <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-gold-500 hover:bg-gold-400 text-black rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" /> Simpan Quiz
            </>
          )}
        </button>
      </div>

      {/* Import Excel Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setImportOpen(false)} />
          <div className="bg-[#111] border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-3xl relative z-10 shadow-2xl max-h-[90vh] flex flex-col">
            <button onClick={() => setImportOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="font-display font-bold text-2xl mb-4 pr-10">Import Soal dari Excel</h2>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileChange}
            />

            {importStatus === "IDLE" && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button onClick={handleDownloadTemplate} className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Download Template
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 bg-gold-500 hover:bg-gold-400 text-black rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" /> Pilih File Excel
                  </button>
                </div>
                <p className="text-xs text-white/40 text-center">Format: .xlsx, maksimal 5 MB. Gunakan template untuk format yang benar.</p>
              </div>
            )}

            {importStatus === "PARSING" && (
              <div className="flex items-center justify-center py-10 gap-3 text-white/60">
                <div className="w-6 h-6 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
                Memproses file...
              </div>
            )}

            {importStatus === "IMPORTING" && (
              <div className="flex items-center justify-center py-10 gap-3 text-white/60">
                <div className="w-6 h-6 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
                Mengimpor soal...
              </div>
            )}

            {duplicateWarnings.length > 0 && (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-300 text-sm flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    {importMsg ||
                      `${duplicateWarnings.length} soal memiliki pertanyaan yang sudah ada di quiz.`}
                    <p className="text-white/60 mt-1">
                      Soal lama tidak akan dihapus atau ditimpa.
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-56 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-white/40 border-b border-white/10 sticky top-0 bg-[#111]">
                        <th className="pb-2 pr-3">Baris</th>
                        <th className="pb-2 pr-3">Pertanyaan (Excel)</th>
                        <th className="pb-2">Sudah ada di quiz</th>
                      </tr>
                    </thead>
                    <tbody>
                      {duplicateWarnings.map((d) => (
                        <tr key={d.rowNum} className="border-b border-white/5">
                          <td className="py-2 pr-3 text-white/50">{d.rowNum}</td>
                          <td className="py-2 pr-3 text-white/80 line-clamp-1">{d.question}</td>
                          <td className="py-2 text-amber-300 line-clamp-1">{d.existing}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDuplicateWarnings([]);
                      setImportStatus("PREVIEW");
                    }}
                    disabled={importing}
                    className="px-5 py-3 bg-white/5 border border-white/10 text-white/70 rounded-xl font-bold transition-colors disabled:opacity-50"
                  >
                    Batalkan
                  </button>
                  <button
                    onClick={() => runImport(true)}
                    disabled={importing}
                    className="flex-1 py-3 bg-gold-500 hover:bg-gold-400 text-black rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {importing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        Mengimpor...
                      </>
                    ) : (
                      <>Import Tetap</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {importStatus === "VALIDATION_ERROR" && duplicateWarnings.length === 0 && (
              <div className="space-y-4">
                {importMsg ? (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" /> {importMsg}
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      Masih ada {invalidRows.length} soal yang tidak valid. Perbaiki file terlebih dahulu.
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold transition-colors">
                    Pilih File Lain
                  </button>
                  <button onClick={() => setImportOpen(false)} className="flex-1 py-3 bg-white/5 border border-white/10 text-white/70 rounded-xl font-bold transition-colors">
                    Tutup
                  </button>
                </div>
                {!importMsg && invalidRows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-white/40 border-b border-white/10">
                          <th className="pb-2 pr-3">Baris</th>
                          <th className="pb-2 pr-3">Pertanyaan</th>
                          <th className="pb-2">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invalidRows.map((r) => (
                          <tr key={r.rowNum} className="border-b border-white/5">
                            <td className="py-2 pr-3 text-white/50">{r.rowNum}</td>
                            <td className="py-2 pr-3 text-white/80 line-clamp-1">{r.question || "-"}</td>
                            <td className="py-2 text-red-400">{r.errors.join("; ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {importStatus === "PREVIEW" && (
              <div className="space-y-4 flex-1 min-h-0 flex flex-col">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-300 text-sm">
                  {validRows.length} soal siap diimport. Periksa dulu sebelum lanjut.
                </div>
                <div className="overflow-x-auto flex-1 min-h-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-white/40 border-b border-white/10 sticky top-0 bg-[#111]">
                        <th className="pb-2 pr-3">Baris</th>
                        <th className="pb-2 pr-3">Pertanyaan</th>
                        <th className="pb-2 pr-3">Jawaban</th>
                        <th className="pb-2 pr-3">Poin</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validRows.map((r) => (
                        <tr key={r.rowNum} className="border-b border-white/5">
                          <td className="py-2 pr-3 text-white/50">{r.rowNum}</td>
                          <td className="py-2 pr-3 text-white/80">{r.question}</td>
                          <td className="py-2 pr-3 text-white/70">{r.correctAnswer}</td>
                          <td className="py-2 pr-3 text-white/70">{r.points}</td>
                          <td className="py-2"><CheckCircle2 className="w-4 h-4 text-green-400" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-3 pt-3">
                  <button onClick={() => setImportOpen(false)} disabled={importing} className="px-5 py-3 bg-white/5 border border-white/10 text-white/70 rounded-xl font-bold transition-colors disabled:opacity-50">
                    Batal
                  </button>
                  <button onClick={confirmImport} disabled={importing} className="flex-1 py-3 bg-gold-500 hover:bg-gold-400 text-black rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {importing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        Mengimpor...
                      </>
                    ) : (
                      <>Import {validRows.length} Soal</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
