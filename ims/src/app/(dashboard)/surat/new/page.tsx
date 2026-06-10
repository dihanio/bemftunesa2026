"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsService, CreateDocumentDto } from "@/lib/api/documents";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, FileText, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";

const documentSchema = zod.object({
  title: zod.string().min(5, "Judul surat minimal 5 karakter"),
  type: zod.enum(["surat_masuk", "surat_keluar", "notulen", "lainnya"]),
  content: zod.string().min(20, "Isi dokumen minimal 20 karakter"),
});

type DocumentFormValues = zod.infer<typeof documentSchema>;

export default function NewSuratPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPreview, setIsPreview] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: "",
      type: "surat_keluar",
      content: "",
    },
  });

  const formValues = watch();

  const createMutation = useMutation({
    mutationFn: (data: CreateDocumentDto) => documentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-documents"] });
      alert("Surat berhasil dibuat!");
      router.push("/surat");
    },
  });

  const onSubmit = (data: DocumentFormValues) => {
    createMutation.mutate(data);
  };

  const getLetterHeader = () => {
    return (
      <div className="text-center border-b-4 border-double border-foreground pb-4 mb-6">
        <h2 className="text-lg font-extrabold uppercase">
          Badan Eksekutif Mahasiswa
        </h2>
        <h3 className="text-md font-bold uppercase">Fakultas Teknik</h3>
        <h4 className="text-sm uppercase tracking-wide">
          Universitas Negeri Surabaya
        </h4>
        <p className="text-[10px] text-muted-foreground mt-1">
          Gedung E1 Kampus Ketintang, Surabaya | Email: bemft@unesa.ac.id
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      <div className="flex flex-col gap-4">
        <Link
          href="/surat"
          className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Kembali ke Persuratan
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Buat Surat Baru
            </h1>
            <p className="mt-2 text-muted-foreground text-sm flex items-center gap-1">
              <FileText className="w-4 h-4 text-accent" /> Draft surat resmi BEM
              FT UNESA dengan penomoran otomatis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-border/50"
              onClick={() => setIsPreview(!isPreview)}
            >
              {isPreview ? "Edit Draft" : "Pratinjau Surat"}
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
              onClick={handleSubmit(onSubmit)}
              disabled={createMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" /> Simpan & Ajukan
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {isPreview ? (
          /* Live Letter Format Preview */
          <Card className="lg:col-span-2 border-border/50 bg-card p-10 font-serif text-[#0f172a] shadow-xl min-h-[700px] border-t-8 border-t-accent">
            {getLetterHeader()}
            <div className="space-y-6 text-sm leading-relaxed">
              <div className="flex justify-between">
                <div>
                  <p>
                    <span className="font-bold">Nomor:</span>{" "}
                    B/001/BEMFT-UNESA/V/2026
                  </p>
                  <p>
                    <span className="font-bold">Lampiran:</span> -
                  </p>
                  <p>
                    <span className="font-bold">Perihal:</span>{" "}
                    {formValues.title || "[Perihal Surat]"}
                  </p>
                </div>
                <div className="text-right">
                  <p>
                    Surabaya,{" "}
                    {new Date().toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div>
                <p>Kepada Yth.</p>
                <p className="font-bold">Fungsionaris BEM FT UNESA</p>
                <p>di Tempat</p>
              </div>

              <div className="whitespace-pre-line min-h-[300px]">
                {formValues.content ||
                  "Tulis isi surat di panel sebelah kiri..."}
              </div>

              <div className="flex justify-end pt-12">
                <div className="text-center w-48">
                  <p>Mengetahui,</p>
                  <p className="font-bold mt-1">Ketua BEM FT UNESA</p>
                  <div className="h-16 flex items-center justify-center my-2 border border-dashed border-border/50 rounded-lg text-[10px] text-muted-foreground">
                    Menunggu Tanda Tangan
                  </div>
                  <p className="font-bold underline">AEC Danadyaksa</p>
                  <p className="text-[10px]">NIM. 22050974001</p>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          /* Document Form Editor */
          <Card className="lg:col-span-2 border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Formulir Surat Resmi</CardTitle>
              <CardDescription>
                Isi detail draf surat resmi di bawah ini sesuai format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="title">Perihal / Judul Surat</Label>
                <Input
                  id="title"
                  placeholder="Contoh: Undangan Rapat Pleno Koordinasi Mid-Term"
                  className="bg-background/50 border-border/50"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-xs text-danger font-medium">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="type">Jenis Dokumen</Label>
                <Select
                  id="type"
                  className="bg-background/50 border-border/50"
                  {...register("type")}
                >
                  <option value="surat_masuk">Surat Masuk</option>
                  <option value="surat_keluar">Surat Keluar</option>
                  <option value="notulen">Notulen</option>
                  <option value="lainnya">Lainnya</option>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="content">Isi Surat / Dokumen</Label>
                <Textarea
                  id="content"
                  placeholder="Dengan hormat, sehubungan dengan diadakannya agenda..."
                  className="bg-background/50 border-border/50 min-h-[350px]"
                  {...register("content")}
                />
                {errors.content && (
                  <p className="text-xs text-danger font-medium">
                    {errors.content.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sidebar Info & SOP */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm h-fit">
          <CardHeader>
            <CardTitle className="text-md">Panduan SOP Surat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <p>
              1. Penomoran surat akan di-generate otomatis oleh sistem setelah
              disetujui Sekretaris Umum BEM FT.
            </p>
            <p>
              2. Gunakan template penulisan resmi. Paragraf pembuka dimulai
              dengan salam pembuka formal.
            </p>
            <p>
              3. Jika surat ini ditujukan untuk eksternal Fakultas, pastikan
              jenisnya adalah{" "}
              <span className="text-accent font-bold">Surat Keluar</span>.
            </p>
            <p>
              4. Lampiran SPJ/RAB kegiatan dapat di-upload terpisah pada halaman
              manajemen proposal kegiatan.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
