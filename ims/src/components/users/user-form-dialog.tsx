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
import { User } from "@/lib/api/users";

const userSchema = zod.object({
  name: zod.string().min(3, "Nama minimal 3 karakter"),
  email: zod
    .string()
    .email("Format email tidak valid")
    .refine(
      (val) => val.endsWith("@mhs.unesa.ac.id") || val.endsWith("@unesa.ac.id"),
      {
        message:
          "Email harus merupakan email institusi UNESA (@mhs.unesa.ac.id / @unesa.ac.id)",
      },
    ),
  role: zod.enum(["Super Admin", "Sekretaris", "Bendahara", "Kadep", "Staff"]),
  department: zod.string().min(1, "Departemen harus diisi"),
  position: zod.string().min(1, "Jabatan harus diisi"),
});

type UserFormValues = zod.infer<typeof userSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<User>) => void;
  initialData?: User | null;
  isLoading?: boolean;
}

export function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: UserFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "Staff",
      department: "Dalam Negeri",
      position: "Staf Departemen",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        email: initialData.email || "",
        role: initialData.role || "Staff",
        department: initialData.department || "Dalam Negeri",
        position: initialData.position || "Staf Departemen",
      });
    } else {
      reset({
        name: "",
        email: "",
        role: "Staff",
        department: "Dalam Negeri",
        position: "Staf Departemen",
      });
    }
  }, [initialData, reset, open]);

  const onFormSubmit = (data: UserFormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/50 bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {initialData ? "Sunting Profil Anggota" : "Undang Anggota BEM FT"}
          </DialogTitle>
          <DialogDescription>
            Masukkan info akun SSO Mahasiswa/Dosen UNESA untuk didaftarkan ke
            IMS.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              placeholder="Contoh: Mochammad Nio"
              className="bg-background/50 border-border/50"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-danger font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email SSO UNESA</Label>
            <Input
              id="email"
              type="email"
              placeholder="contoh@mhs.unesa.ac.id"
              className="bg-background/50 border-border/50 font-mono text-xs"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-danger font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="role">Akses Peran (Role)</Label>
            <Select
              id="role"
              className="bg-background/50 border-border/50"
              {...register("role")}
            >
              <option value="Super Admin">Super Admin (BPI Ketua)</option>
              <option value="Sekretaris">Sekretaris (BPI Sekretaris)</option>
              <option value="Bendahara">Bendahara (BPI Bendahara)</option>
              <option value="Kadep">Kadep (Kepala Departemen)</option>
              <option value="Staff">Fungsionaris (Staf Departemen)</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="department">Departemen</Label>
              <Select
                id="department"
                className="bg-background/50 border-border/50"
                {...register("department")}
              >
                <option value="Dalam Negeri">Dalam Negeri</option>
                <option value="Luar Negeri">Luar Negeri</option>
                <option value="PSDM">PSDM</option>
                <option value="Minat & Bakat">Minat & Bakat</option>
                <option value="Sosial & Politik">Sosial & Politik</option>
                <option value="Kesejahteraan Mahasiswa">
                  Kesejahteraan Mahasiswa
                </option>
                <option value="Komunikasi & Informasi">
                  Komunikasi & Informasi
                </option>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="position">Jabatan Spesifik</Label>
              <Input
                id="position"
                placeholder="Staf Departemen / PJ Acara"
                className="bg-background/50 border-border/50"
                {...register("position")}
              />
              {errors.position && (
                <p className="text-xs text-danger font-medium">
                  {errors.position.message}
                </p>
              )}
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
              {isLoading ? "Memproses..." : "Simpan Anggota"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
