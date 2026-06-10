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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { usersService, User } from "@/lib/api/users";
import { Loader2 } from "lucide-react";

const kepanitiaanSchema = zod.object({
  userId: zod.string().min(1, "Fungsionaris harus dipilih"),
  roleInProker: zod.string().min(1, "Posisi kepanitiaan harus dipilih"),
  division: zod.string().optional(),
});

type KepanitiaanFormValues = zod.infer<typeof kepanitiaanSchema>;

interface KepanitiaanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: KepanitiaanFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function KepanitiaanFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: KepanitiaanFormDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<KepanitiaanFormValues>({
    resolver: zodResolver(kepanitiaanSchema),
    defaultValues: {
      userId: "",
      roleInProker: "Staff Panitia",
      division: "Acara",
    },
  });

  const selectedRole = watch("roleInProker");

  useEffect(() => {
    if (open) {
      reset({
        userId: "",
        roleInProker: "Staff Panitia",
        division: "Acara",
      });

      const fetchUsers = async () => {
        setIsUsersLoading(true);
        try {
          const res = await usersService.list();
          setUsers(res.data || []);
        } catch (error) {
          console.error("Failed to load users:", error);
        } finally {
          setIsUsersLoading(false);
        }
      };

      fetchUsers();
    }
  }, [open, reset]);

  const onFormSubmit = async (data: KepanitiaanFormValues) => {
    // If the role is Ketupel, Sekpel, or Bendpan, division can be null or empty
    const submissionData = {
      ...data,
      division: [
        "Ketua Pelaksana",
        "Wakil Ketua Pelaksana",
        "Sekretaris Pelaksana",
        "Bendahara Pelaksana",
      ].includes(data.roleInProker)
        ? undefined
        : data.division,
    };
    await onSubmit(submissionData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/50 bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Tambah Anggota Panitia
          </DialogTitle>
          <DialogDescription>
            Tugaskan fungsionaris aktif BEM FT ke dalam struktur Kepanitiaan
            Pelaksana (OC) proker ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          {/* Fungsionaris Selection */}
          <div className="space-y-1">
            <Label htmlFor="userId">Pilih Fungsionaris BEM FT</Label>
            {isUsersLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 border border-border/30 rounded bg-muted/20">
                <Loader2 className="w-3 h-3 animate-spin text-accent" />
                Memuat daftar pengurus...
              </div>
            ) : (
              <Select
                id="userId"
                className="bg-background/50 border-border/50 text-foreground"
                {...register("userId")}
              >
                <option value="" disabled>
                  -- Pilih Pengurus --
                </option>
                {users.map((u) => (
                  <option
                    key={u._id}
                    value={u._id}
                    className="text-foreground bg-card"
                  >
                    {u.name} ({u.role} - {u.department || "BPI"})
                  </option>
                ))}
              </Select>
            )}
            {errors.userId && (
              <p className="text-xs text-red-500 font-medium">
                {errors.userId.message}
              </p>
            )}
          </div>

          {/* Position/Role Selection */}
          <div className="space-y-1">
            <Label htmlFor="roleInProker">Posisi Kepanitiaan</Label>
            <Select
              id="roleInProker"
              className="bg-background/50 border-border/50"
              {...register("roleInProker")}
            >
              <option value="Ketua Pelaksana">Ketua Pelaksana (Ketupel)</option>
              <option value="Wakil Ketua Pelaksana">
                Wakil Ketua Pelaksana (Waketupel)
              </option>
              <option value="Sekretaris Pelaksana">
                Sekretaris Pelaksana (Sekpel)
              </option>
              <option value="Bendahara Pelaksana">
                Bendahara Pelaksana (Bendpel)
              </option>
              <option value="Koordinator Divisi">
                Koordinator Divisi (Kordiv)
              </option>
              <option value="Staff Panitia">
                Staff Panitia / Anggota Divisi
              </option>
            </Select>
            {errors.roleInProker && (
              <p className="text-xs text-red-500 font-medium">
                {errors.roleInProker.message}
              </p>
            )}
          </div>

          {/* Division Selection (Only shown for Kordiv and Staff) */}
          {![
            "Ketua Pelaksana",
            "Wakil Ketua Pelaksana",
            "Sekretaris Pelaksana",
            "Bendahara Pelaksana",
          ].includes(selectedRole) && (
            <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
              <Label htmlFor="division">Pilih Divisi OC</Label>
              <Select
                id="division"
                className="bg-background/50 border-border/50"
                {...register("division")}
              >
                <option value="Acara">Divisi Acara</option>
                <option value="Humas">Divisi Humas</option>
                <option value="PDD">
                  Divisi PDD (Publikasi, Dekorasi, Dokumentasi)
                </option>
                <option value="Konsumsi">Divisi Konsumsi</option>
                <option value="Perlengkapan">
                  Divisi Perlengkapan & Logistik
                </option>
                <option value="Sponsorship">
                  Divisi Sponsorship & Pendanaan
                </option>
                <option value="Keamanan">Divisi Keamanan</option>
                <option value="LO">Divisi Liaison Officer (LO)</option>
                <option value="Kesehatan">Divisi Kesehatan / P3K</option>
                <option value="Publikasi">Divisi Publikasi</option>
                <option value="Dokumentasi">Divisi Dokumentasi</option>
              </Select>
            </div>
          )}

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
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5"
              disabled={isLoading || isUsersLoading}
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isLoading ? "Menambahkan..." : "Tugaskan Anggota"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
