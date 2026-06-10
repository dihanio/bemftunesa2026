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
import { Asset } from "@/lib/api/assets";

const assetSchema = zod.object({
  name: zod.string().min(3, "Nama barang minimal 3 karakter"),
  code: zod.string().min(3, "Kode barang minimal 3 karakter"),
  stock: zod.number().min(0, "Stok tidak boleh negatif"),
  condition: zod.enum(["Good", "Broken", "Maintenance"]),
  location: zod.string().optional(),
});

type AssetFormValues = zod.infer<typeof assetSchema>;

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Asset>) => void;
  initialData?: Asset | null;
  isLoading?: boolean;
}

export function AssetFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: AssetFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: "",
      code: "",
      stock: 1,
      condition: "Good",
      location: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        code: initialData.code || "",
        stock: initialData.stock || 0,
        condition: initialData.condition || "Good",
        location: initialData.location || "",
      });
    } else {
      reset({
        name: "",
        code: "",
        stock: 1,
        condition: "Good",
        location: "",
      });
    }
  }, [initialData, reset, open]);

  const onFormSubmit = (data: AssetFormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/50 bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {initialData ? "Edit Data Aset" : "Tambah Aset Sekretariat"}
          </DialogTitle>
          <DialogDescription>
            Masukkan detail inventaris barang BEM FT UNESA untuk pelacakan fisik
            dan peminjaman.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="name">Nama Barang / Aset</Label>
            <Input
              id="name"
              placeholder="Contoh: Proyektor Epson EB-X400"
              className="bg-background/50 border-border/50"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-danger font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="code">Kode Aset Unik</Label>
              <Input
                id="code"
                placeholder="e.g., BEMFT-2026-PROJ-01"
                className="bg-background/50 border-border/50 text-sm"
                {...register("code")}
              />
              {errors.code && (
                <p className="text-xs text-danger font-medium">
                  {errors.code.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="stock">Jumlah / Stok Fisik</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                className="bg-background/50 border-border/50 text-sm"
                {...register("stock", { valueAsNumber: true })}
              />
              {errors.stock && (
                <p className="text-xs text-danger font-medium">
                  {errors.stock.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="condition">Kondisi Fisik</Label>
              <Select
                id="condition"
                className="bg-background/50 border-border/50"
                {...register("condition")}
              >
                <option value="Good">Bagus / Layak Pakai</option>
                <option value="Maintenance">Sedang Diperbaiki</option>
                <option value="Broken">Rusak / Tidak Bisa Pakai</option>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="location">Lokasi Penyimpanan</Label>
              <Input
                id="location"
                placeholder="Contoh: Lemari 2 / Atas Meja Sekre"
                className="bg-background/50 border-border/50 text-sm"
                {...register("location")}
              />
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
              {isLoading ? "Menyimpan..." : "Simpan Aset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
