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
import { Select } from "@/components/ui/select";
import { Article } from "@/lib/api/cms";

const articleSchema = zod.object({
  title: zod.string().min(5, "Judul minimal 5 karakter"),
  slug: zod.string().min(3, "Slug minimal 3 karakter"),
  category: zod.enum(["Kegiatan", "Prestasi", "Pengumuman", "Opini"]),
  status: zod.enum(["Draft", "Published"]),
});

type ArticleFormValues = zod.infer<typeof articleSchema>;

interface ArticleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Article>) => void;
  initialData?: Article | null;
  isLoading?: boolean;
}

export function ArticleFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: ArticleFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      slug: "",
      category: "Kegiatan",
      status: "Draft",
    },
  });

  const titleValue = watch("title");

  useEffect(() => {
    if (titleValue && !initialData) {
      const generatedSlug = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setValue("slug", generatedSlug);
    }
  }, [titleValue, setValue, initialData]);

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || "",
        slug: initialData.slug || "",
        category: initialData.category || "Kegiatan",
        status: initialData.status || "Draft",
      });
    } else {
      reset({
        title: "",
        slug: "",
        category: "Kegiatan",
        status: "Draft",
      });
    }
  }, [initialData, reset, open]);

  const onFormSubmit = (data: ArticleFormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/50 bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {initialData ? "Edit Info Artikel" : "Tulis Artikel Baru"}
          </DialogTitle>
          <DialogDescription>
            Masukkan info awal artikel Anda. Anda dapat menulis konten
            lengkapnya setelah ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="title">Judul Artikel</Label>
            <Input
              id="title"
              placeholder="Contoh: Sukses Besar Gelaran PKKMB FT UNESA 2026"
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
            <Label htmlFor="slug">Slug URL</Label>
            <Input
              id="slug"
              placeholder="sukses-besar-pkkmb-ft-2026"
              className="bg-background/50 border-border/50 font-mono text-xs"
              {...register("slug")}
            />
            {errors.slug && (
              <p className="text-xs text-danger font-medium">
                {errors.slug.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="category">Kategori</Label>
              <Select
                id="category"
                className="bg-background/50 border-border/50"
                {...register("category")}
              >
                <option value="Kegiatan">Kegiatan</option>
                <option value="Prestasi">Prestasi</option>
                <option value="Pengumuman">Pengumuman</option>
                <option value="Opini">Opini</option>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="status">Status Rilis</Label>
              <Select
                id="status"
                className="bg-background/50 border-border/50"
                {...register("status")}
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </Select>
            </div>
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
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Lanjutkan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
