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
import { Textarea } from "@/components/ui/textarea";
import { Proker } from "@/lib/api/proker";

const prokerSchema = zod.object({
  title: zod.string().min(3, "Judul minimal 3 karakter"),
  description: zod.string().optional(),
  departmentId: zod.string().min(1, "Departemen harus dipilih"),
  status: zod.enum([
    "Planning",
    "Active",
    "Event Finished",
    "LPJ Revision",
    "LPJ Approved",
    "Archived",
    "In Progress",
    "Completed",
    "Cancelled",
  ]),
  progress: zod.number().min(0).max(100),
  startDate: zod.string().optional(),
  endDate: zod.string().optional(),
  budget: zod.number().min(0),
  location: zod.string().optional(),
});

type ProkerFormValues = zod.infer<typeof prokerSchema>;

interface ProkerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Proker>) => void;
  initialData?: Proker | null;
  isLoading?: boolean;
}

export function ProkerFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: ProkerFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProkerFormValues>({
    resolver: zodResolver(prokerSchema),
    defaultValues: {
      title: "",
      description: "",
      departmentId: "1",
      status: "Planning",
      progress: 0,
      startDate: "",
      endDate: "",
      budget: 0,
      location: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || "",
        description: initialData.description || "",
        departmentId: initialData.departmentId || "1",
        status: initialData.status || "Planning",
        progress: initialData.progress || 0,
        startDate: initialData.startDate
          ? new Date(initialData.startDate).toISOString().split("T")[0]
          : "",
        endDate: initialData.endDate
          ? new Date(initialData.endDate).toISOString().split("T")[0]
          : "",
        budget: initialData.budget || 0,
        location: initialData.location || "",
      });
    } else {
      reset({
        title: "",
        description: "",
        departmentId: "1",
        status: "Planning",
        progress: 0,
        startDate: "",
        endDate: "",
        budget: 0,
        location: "",
      });
    }
  }, [initialData, reset, open]);

  const onFormSubmit = (data: ProkerFormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border/50 bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {initialData ? "Edit Program Kerja" : "Tambah Program Kerja"}
          </DialogTitle>
          <DialogDescription>
            Masukkan detail program kerja BEM FT UNESA untuk dipantau dan
            dilaporkan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="title">Nama Program Kerja</Label>
            <Input
              id="title"
              placeholder="Contoh: PKKMB FT UNESA 2026"
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
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan tujuan dan gambaran umum program kerja ini..."
              className="bg-background/50 border-border/50 min-h-[80px]"
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="departmentId">Departemen Penanggung Jawab</Label>
              <Select
                id="departmentId"
                className="bg-background/50 border-border/50"
                {...register("departmentId")}
              >
                <option value="1">Departemen Dalam Negeri</option>
                <option value="2">Departemen Luar Negeri</option>
                <option value="3">
                  Departemen Pengembangan Sumber Daya Mahasiswa
                </option>
                <option value="4">Departemen Minat & Bakat</option>
                <option value="5">Departemen Sosial & Politik</option>
                <option value="6">Departemen Kesejahteraan Mahasiswa</option>
                <option value="7">Departemen Komunikasi & Informasi</option>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                className="bg-background/50 border-border/50"
                {...register("status")}
              >
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="Event Finished">Event Finished</option>
                <option value="LPJ Revision">LPJ Revision</option>
                <option value="LPJ Approved">LPJ Approved</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
                <option value="Cancelled">Cancelled</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="progress">Progres (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                className="bg-background/50 border-border/50"
                {...register("progress", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="budget">Estimasi Anggaran (Rp)</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                placeholder="0"
                className="bg-background/50 border-border/50"
                {...register("budget", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                className="bg-background/50 border-border/50 text-sm"
                {...register("startDate")}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="endDate">Tanggal Selesai</Label>
              <Input
                id="endDate"
                type="date"
                className="bg-background/50 border-border/50 text-sm"
                {...register("endDate")}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="location">Lokasi Kegiatan</Label>
            <Input
              id="location"
              placeholder="Contoh: Gedung E1 FT UNESA / Lapangan FT"
              className="bg-background/50 border-border/50"
              {...register("location")}
            />
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
              {isLoading ? "Menyimpan..." : "Simpan Proker"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
