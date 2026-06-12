"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { documentsService } from "@/lib/api/documents";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitCommit,
  Undo2,
  ArrowLeft,
  GitCompare,
  Clock,
  CheckCircle,
  FileText,
  HelpCircle,
  Save,
} from "lucide-react";

export default function DocumentHistoryPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const queryClient = useQueryClient();

  const [selectedVerA, setSelectedVerA] = useState<number | null>(null);
  const [selectedVerB, setSelectedVerB] = useState<number | null>(null);

  const { data: docResponse } = useQuery({
    queryKey: ["document", id],
    queryFn: () => documentsService.getById(id),
  });

  const { data: historyResponse, isLoading } = useQuery({
    queryKey: ["document-history", id],
    queryFn: () => documentsService.listHistory(id),
  });

  const rollbackMutation = useMutation({
    mutationFn: (version: number) => documentsService.rollback(id, version),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      queryClient.invalidateQueries({ queryKey: ["document-history", id] });
      alert(res.message || "Rollback berhasil dilakukan!");
    },
    onError: (err: any) => {
      alert(err.message || "Gagal melakukan rollback.");
    },
  });

  const doc = docResponse?.data;
  const history = historyResponse?.data || [];

  const handleRollback = (verNum: number) => {
    if (
      confirm(
        `Apakah Anda yakin ingin melakukan rollback dokumen ke versi v${verNum}?`,
      )
    ) {
      rollbackMutation.mutate(verNum);
    }
  };

  // Simple diff function comparing two snapshots line-by-line
  const renderDiff = () => {
    if (selectedVerA === null || selectedVerB === null) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-lg bg-white/5">
          <GitCompare className="h-8 w-8 text-[#a9b49c]/40 mb-2" />
          <p className="text-xs text-[#a9b49c]">
            Pilih dua versi di panel kiri untuk membandingkan perbedaan konten
            secara baris.
          </p>
        </div>
      );
    }

    const versionAObj = history.find((h) => h.version === selectedVerA);
    const versionBObj = history.find((h) => h.version === selectedVerB);

    if (!versionAObj || !versionBObj) return null;

    const textA = versionAObj.snapshot?.content || "";
    const textB = versionBObj.snapshot?.content || "";

    const linesA = textA.split("\n");
    const linesB = textB.split("\n");

    const maxLines = Math.max(linesA.length, linesB.length);
    const diffRows = [];

    for (let i = 0; i < maxLines; i++) {
      const lineA = linesA[i] || "";
      const lineB = linesB[i] || "";

      if (lineA === lineB) {
        diffRows.push({
          type: "normal",
          lineNum: i + 1,
          left: lineA,
          right: lineB,
        });
      } else {
        if (lineA && !lineB) {
          diffRows.push({
            type: "removed",
            lineNum: i + 1,
            left: lineA,
            right: "",
          });
        } else if (!lineA && lineB) {
          diffRows.push({
            type: "added",
            lineNum: i + 1,
            left: "",
            right: lineB,
          });
        } else {
          diffRows.push({
            type: "modified",
            lineNum: i + 1,
            left: lineA,
            right: lineB,
          });
        }
      }
    }

    return (
      <div className="border border-white/10 rounded-lg overflow-hidden bg-[#091c11] font-mono text-[11px] leading-relaxed">
        <div className="grid grid-cols-2 bg-white/5 border-b border-white/10 text-white/70 p-2 font-sans font-bold">
          <div>Versi v{selectedVerA}</div>
          <div>Versi v{selectedVerB}</div>
        </div>
        <div className="max-h-[480px] overflow-y-auto divide-y divide-white/5">
          {diffRows.map((row, idx) => {
            let rowColor = "";
            if (row.type === "added")
              rowColor = "bg-[#71d39b]/10 text-[#71d39b]";
            if (row.type === "removed")
              rowColor = "bg-destructive/10 text-destructive";
            if (row.type === "modified")
              rowColor = "bg-yellow-500/10 text-yellow-200";

            return (
              <div key={idx} className={`grid grid-cols-2 p-1.5 ${rowColor}`}>
                <div className="border-r border-white/5 pr-2 overflow-x-auto whitespace-pre-wrap select-all">
                  <span className="text-[#a9b49c] select-none mr-2">
                    {row.lineNum}
                  </span>
                  {row.left || " "}
                </div>
                <div className="pl-2 overflow-x-auto whitespace-pre-wrap select-all">
                  <span className="text-[#a9b49c] select-none mr-2">
                    {row.lineNum}
                  </span>
                  {row.right || " "}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => router.back()}
            className="border-white/10 bg-white/5 text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <GitCommit className="h-6 w-6 text-[#10b981]" />
              Riwayat Versi Dokumen BEM (VCS)
            </h1>
            <p className="text-xs text-[#a9b49c]">
              Dokumen:{" "}
              <span className="text-[#a7f3d0] font-semibold">
                {doc?.title || "Memuat..."}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Versions List */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#10b981]" />
              Log Commit Versi
            </CardTitle>
            <CardDescription className="text-[10px] text-[#a9b49c]">
              Klik tombol vA/vB untuk melakukan diff komparasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {isLoading ? (
              <p className="text-xs text-[#a9b49c]">Memuat riwayat...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-[#a9b49c] italic">
                Belum ada snapshots versi yang terekam.
              </p>
            ) : (
              history.map((ver) => (
                <div
                  key={ver._id}
                  className="p-3 rounded-lg border border-white/5 bg-white/5 text-xs space-y-2 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge
                        variant="outline"
                        className="border-[#10b981]/45 bg-[#10b981]/10 text-white font-bold mb-1"
                      >
                        Versi v{ver.version}
                      </Badge>
                      <p className="text-[10px] text-[#a9b49c]">
                        Oleh: {ver.createdBy?.name || "Sistem"}
                      </p>
                      <p className="text-[9px] text-[#a9b49c]/70">
                        {new Date(ver.createdAt).toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        size="xs"
                        variant={
                          selectedVerA === ver.version ? "default" : "outline"
                        }
                        onClick={() => setSelectedVerA(ver.version)}
                        className="text-[9px] h-5 w-6 p-0 border-white/15"
                      >
                        vA
                      </Button>
                      <Button
                        size="xs"
                        variant={
                          selectedVerB === ver.version ? "default" : "outline"
                        }
                        onClick={() => setSelectedVerB(ver.version)}
                        className="text-[9px] h-5 w-6 p-0 border-white/15"
                      >
                        vB
                      </Button>
                    </div>
                  </div>

                  {ver.note && (
                    <p className="text-[10px] text-yellow-300/80 bg-black/25 px-1.5 py-0.5 rounded italic">
                      &quot;{ver.note}&quot;
                    </p>
                  )}

                  <Button
                    size="xs"
                    onClick={() => handleRollback(ver.version)}
                    className="w-full bg-[#10b981]/15 hover:bg-[#10b981] hover:text-[#091c11] text-[#a7f3d0] border border-[#10b981]/30 text-[10px] mt-1 gap-1"
                  >
                    <Undo2 className="h-3 w-3" />
                    Rollback Ke Sini
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Diff Viewer panel */}
        <div className="space-y-6">
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                  <GitCompare className="h-4 w-4 text-[#a7f3d0]" />
                  Diff Engine Komparator
                </CardTitle>
                <CardDescription className="text-[10px] text-[#a9b49c]">
                  Membandingkan:{" "}
                  {selectedVerA !== null ? `v${selectedVerA}` : "Pilih vA"} vs{" "}
                  {selectedVerB !== null ? `v${selectedVerB}` : "Pilih vB"}
                </CardDescription>
              </div>

              {(selectedVerA !== null || selectedVerB !== null) && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    setSelectedVerA(null);
                    setSelectedVerB(null);
                  }}
                  className="border-white/10 text-white"
                >
                  Reset Diff
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0">{renderDiff()}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
