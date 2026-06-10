"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WikiArticle } from "@/lib/api/wiki";

const wikiSchema = zod.object({
  title: zod.string().min(5, "Judul SOP minimal 5 karakter"),
  content: zod.string().min(10, "Konten minimal 10 karakter"),
  tagsInput: zod.string().optional(),
});

type WikiFormValues = zod.infer<typeof wikiSchema>;

interface WikiFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<WikiArticle>) => void;
  initialData?: WikiArticle | null;
  isLoading?: boolean;
}

export function WikiFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: WikiFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WikiFormValues>({
    resolver: zodResolver(wikiSchema),
    defaultValues: {
      title: "",
      content: "",
      tagsInput: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || "",
        content: initialData.content || "",
        tagsInput: initialData.tags?.join(", ") || "",
      });
    } else {
      reset({
        title: "",
        content: "",
        tagsInput: "",
      });
    }
  }, [initialData, reset, open]);

  const onFormSubmit = (data: WikiFormValues) => {
    const tags = data.tagsInput
      ? data.tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];

    onSubmit({
      title: data.title,
      content: data.content,
      tags,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border/50 bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {initialData
              ? "Sunting Artikel Wiki/SOP"
              : "Terbitkan Wiki/SOP Baru"}
          </DialogTitle>
          <DialogDescription>
            Tuliskan dokumen standar operasional, lesson learned, atau panduan
            kerja fungsionaris BEM FT.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="title">Judul Dokumen / SOP</Label>
            <Input
              id="title"
              placeholder="Contoh: SOP Peminjaman Alat Inventaris / Alur LPJ Keuangan"
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
            <Label htmlFor="tagsInput">
              Label / Tags (Pisahkan dengan koma)
            </Label>
            <Input
              id="tagsInput"
              placeholder="e.g., Keuangan, Administrasi, Logistik, SOP"
              className="bg-background/50 border-border/50 text-xs"
              {...register("tagsInput")}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="content">
              Konten Dokumen (Mendukung Format Text / Markdown)
            </Label>
            <Textarea
              id="content"
              placeholder="Tuliskan isi dokumen secara lengkap di sini. Anda dapat memformatnya dengan rapi..."
              className="bg-background/50 border-border/50 min-h-[250px] text-sm leading-relaxed p-4 font-sans"
              {...register("content")}
            />
            {errors.content && (
              <p className="text-xs text-danger font-medium">
                {errors.content.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border/20">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
              disabled={isLoading}
            >
              {isLoading
                ? "Menerbitkan..."
                : initialData
                  ? "Simpan Perubahan"
                  : "Terbitkan Wiki"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
