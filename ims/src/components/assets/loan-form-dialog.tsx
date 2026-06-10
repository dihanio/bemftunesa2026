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
import { Asset, AssetLoan } from "@/lib/api/assets";

const loanSchema = zod.object({
  quantity: zod.number().min(1, "Jumlah pinjam minimal 1 unit"),
  loanDate: zod.string().min(1, "Tanggal peminjaman harus diisi"),
  returnDate: zod.string().optional(),
});

type LoanFormValues = zod.infer<typeof loanSchema>;

interface LoanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<AssetLoan>) => void;
  asset: Asset | null;
  isLoading?: boolean;
}

export function LoanFormDialog({
  open,
  onOpenChange,
  onSubmit,
  asset,
  isLoading,
}: LoanFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      quantity: 1,
      loanDate: new Date().toISOString().split("T")[0],
      returnDate: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        quantity: 1,
        loanDate: new Date().toISOString().split("T")[0],
        returnDate: "",
      });
    }
  }, [open, reset]);

  const onFormSubmit = (data: LoanFormValues) => {
    if (!asset) return;
    onSubmit({
      assetId: asset._id,
      quantity: data.quantity,
      loanDate: new Date(data.loanDate).toISOString(),
      returnDate: data.returnDate
        ? new Date(data.returnDate).toISOString()
        : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/50 bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Ajukan Peminjaman Aset
          </DialogTitle>
          <DialogDescription>
            Anda mengajukan peminjaman untuk barang:{" "}
            <strong className="text-foreground">{asset?.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          {asset && (
            <div className="p-3.5 rounded-xl bg-background/50 border border-border/30 text-xs text-muted-foreground flex flex-col gap-1">
              <p>
                Kode Barang:{" "}
                <strong className="text-foreground">{asset.code}</strong>
              </p>
              <p>
                Stok Tersedia:{" "}
                <strong className="text-foreground">{asset.stock} unit</strong>
              </p>
              <p>
                Kondisi:{" "}
                <strong className="text-[#10b981] font-semibold">
                  {asset.condition === "Good"
                    ? "Bagus / Layak Pakai"
                    : asset.condition}
                </strong>
              </p>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="quantity">Jumlah Unit yang Dipinjam</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={asset?.stock || 99}
              className="bg-background/50 border-border/50"
              {...register("quantity", { valueAsNumber: true })}
            />
            {errors.quantity && (
              <p className="text-xs text-danger font-medium">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="loanDate">Tanggal Peminjaman</Label>
              <Input
                id="loanDate"
                type="date"
                className="bg-background/50 border-border/50 text-sm"
                {...register("loanDate")}
              />
              {errors.loanDate && (
                <p className="text-xs text-danger font-medium">
                  {errors.loanDate.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="returnDate">Estimasi Pengembalian</Label>
              <Input
                id="returnDate"
                type="date"
                className="bg-background/50 border-border/50 text-sm"
                {...register("returnDate")}
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
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
              disabled={isLoading || !asset || asset.stock < 1}
            >
              {!asset || asset.stock < 1
                ? "Stok Habis"
                : isLoading
                  ? "Mengajukan..."
                  : "Kirim Pengajuan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
