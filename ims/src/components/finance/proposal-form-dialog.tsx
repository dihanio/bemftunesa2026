"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Proposal } from "@/lib/api/finance";
import { useQuery } from "@tanstack/react-query";
import { prokerService } from "@/lib/api/proker";

const proposalSchema = zod.object({
  prokerId: zod.string().min(1, "Program kerja harus dipilih"),
  title: zod.string().min(5, "Judul proposal minimal 5 karakter"),
  description: zod.string().optional(),
  fileUrl: zod
    .string()
    .url("Format URL file tidak valid")
    .or(zod.string().optional()),
});

type ProposalFormValues = zod.infer<typeof proposalSchema>;

interface ProposalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Proposal>) => void;
  isLoading?: boolean;
}

export function ProposalFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: ProposalFormDialogProps) {
  const { data: prokerResponse } = useQuery({
    queryKey: ["ims-proker-list-dropdown"],
    queryFn: () => prokerService.list(),
  });

  const prokers = prokerResponse?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      prokerId: "",
      title: "",
      description: "",
      fileUrl: "",
    },
  });

  useEffect(() => {
    reset({
      prokerId: prokers[0]?._id || "",
      title: "",
      description: "",
      fileUrl: "",
    });
  }, [open, reset, prokers]);

  const onFormSubmit = (data: ProposalFormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/50 bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Ajukan Proposal & RAB Baru
          </DialogTitle>
          <DialogDescription>
            Ajukan permohonan alokasi anggaran kegiatan operasional departemen
            Anda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="prokerId">Pilih Program Kerja</Label>
            <Select
              id="prokerId"
              className="bg-background/50 border-border/50"
              {...register("prokerId")}
            >
              {prokers.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </Select>
            {errors.prokerId && (
              <p className="text-xs text-danger font-medium">
                {errors.prokerId.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="title">Judul Proposal</Label>
            <Input
              id="title"
              placeholder="Contoh: Proposal Pengadaan Konsumsi & Dekor PKKMB 2026"
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
            <Label htmlFor="description">Deskripsi Ringkas</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan secara ringkas keperluan dana ini..."
              className="bg-background/50 border-border/50 min-h-[80px]"
              {...register("description")}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="fileUrl">
              Link Dokumen Proposal (PDF/Google Drive)
            </Label>
            <Input
              id="fileUrl"
              placeholder="https://drive.google.com/..."
              className="bg-background/50 border-border/50 text-xs"
              {...register("fileUrl")}
            />
            {errors.fileUrl && (
              <p className="text-xs text-danger font-medium">
                {errors.fileUrl.message}
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
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isLoading}
            >
              {isLoading ? "Mengajukan..." : "Ajukan Sekarang"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
