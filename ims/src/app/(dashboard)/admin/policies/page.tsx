"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workflowsService, type WorkflowDefinition } from "@/lib/api/workflows";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch,
  Code2,
  Settings,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Save,
} from "lucide-react";

export default function AdminPoliciesPage() {
  const queryClient = useQueryClient();
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<WorkflowDefinition | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: workflowsResponse, isLoading } = useQuery({
    queryKey: ["admin-workflows"],
    queryFn: () => workflowsService.list(),
  });

  const workflows = workflowsResponse?.data || [];

  useEffect(() => {
    if (workflows.length > 0 && !selectedWorkflow) {
      setSelectedWorkflow(workflows[0]);
      setJsonInput(JSON.stringify(workflows[0], null, 2));
    }
  }, [workflows, selectedWorkflow]);

  const upsertMutation = useMutation({
    mutationFn: (data: any) => workflowsService.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-workflows"] });
      setErrorMsg("");
      alert("Alur kebijakan workflow berhasil diupdate!");
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Gagal mengupdate konfigurasi.");
    },
  });

  const handleSelectWorkflow = (wf: WorkflowDefinition) => {
    setSelectedWorkflow(wf);
    setJsonInput(JSON.stringify(wf, null, 2));
    setErrorMsg("");
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.key || typeof parsed.version !== "number") {
        throw new Error(
          "Format JSON harus menyertakan 'key' dan 'version' (number).",
        );
      }
      upsertMutation.mutate(parsed);
    } catch (e: any) {
      setErrorMsg(e.message || "Format JSON tidak valid.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-[#10b981]" />
            Workflow Policy Engine GUI
          </h1>
          <p className="text-xs text-[#a9b49c]">
            Konfigurasi birokrasi, persetujuan RAB/LPJ, dan alur transisi
            dokumen dinamis berbasis JSON.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left List */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white">
              Daftar Workflow
            </CardTitle>
            <CardDescription className="text-[10px] text-[#a9b49c]">
              Alur yang aktif di database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {isLoading ? (
              <p className="text-xs text-[#a9b49c]">Memuat data...</p>
            ) : workflows.length === 0 ? (
              <p className="text-xs text-[#a9b49c] italic">
                Tidak ada alur terdaftar
              </p>
            ) : (
              workflows.map((wf) => (
                <button
                  key={wf._id}
                  onClick={() => handleSelectWorkflow(wf)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-colors flex flex-col gap-1 ${
                    selectedWorkflow?.key === wf.key &&
                    selectedWorkflow?.version === wf.version
                      ? "border-[#10b981]/45 bg-[#10b981]/10 text-white"
                      : "border-white/5 bg-white/5 text-[#a9b49c] hover:bg-white/8"
                  }`}
                >
                  <span className="font-bold text-white">{wf.label}</span>
                  <span className="text-[10px] opacity-70">Key: {wf.key}</span>
                  <div className="flex justify-between items-center mt-2">
                    <Badge
                      variant="secondary"
                      className="text-[9px] px-1 py-0 border-white/10 bg-white/5 text-white"
                    >
                      v{wf.version}
                    </Badge>
                    {wf.isActive && (
                      <span className="text-[9px] text-[#71d39b] font-semibold">
                        Active
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right Editor & Visualizer */}
        {selectedWorkflow && (
          <div className="space-y-6">
            {/* Visualizer Panel */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#a7f3d0]" />
                  Visualisasi Jalur Persetujuan: {selectedWorkflow.label}
                </CardTitle>
                <CardDescription className="text-[10px] text-[#a9b49c]">
                  Urutan tahapan persetujuan dari awal hingga status final
                  (Archived / Approved)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0 overflow-x-auto">
                <div className="flex items-center gap-4 min-w-max py-4">
                  {selectedWorkflow.steps?.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-xl border flex flex-col gap-1 items-center justify-center min-w-[120px] text-center ${
                          step.terminal
                            ? "bg-[#71d39b]/10 border-[#71d39b]/25 text-[#71d39b]"
                            : "bg-white/5 border-white/10 text-white"
                        }`}
                      >
                        <span className="text-xs font-bold">{step.label}</span>
                        <span className="text-[9px] text-[#a9b49c]">
                          {step.id}
                        </span>
                        {step.requiresMfa && (
                          <Badge
                            variant="outline"
                            className="border-red-900/35 bg-red-950/20 text-red-200 text-[8px] py-0 mt-1"
                          >
                            MFA Required
                          </Badge>
                        )}
                      </div>
                      {idx < selectedWorkflow.steps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-[#a9b49c]" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Editor Panel */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Code2 className="h-4 w-4 text-[#10b981]" />
                    Editor Kebijakan JSON
                  </CardTitle>
                  <CardDescription className="text-[10px] text-[#a9b49c]">
                    Sesuaikan tahapan langkah, transisi, dan proteksi MFA.
                  </CardDescription>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={upsertMutation.isPending}
                  size="xs"
                  className="bg-[#10b981] text-[#091c11] hover:bg-[#a7f3d0]"
                >
                  <Save className="h-3.5 w-3.5" />
                  Simpan Perubahan
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {errorMsg && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-800/40 bg-red-950/20 p-3 text-xs text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="font-mono text-xs h-[380px] bg-[#091c11] border-white/10 text-[#a7f3d0]"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
