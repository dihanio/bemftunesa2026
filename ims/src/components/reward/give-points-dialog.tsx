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
import { GivePointsDto } from "@/lib/api/points";
import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/lib/api/users";

const pointSchema = zod.object({
  userId: zod.string().min(1, "Fungsionaris harus dipilih"),
  points: zod.number().min(1, "Jumlah poin minimal 1"),
  type: zod.enum(["kehadiran", "proker", "lainnya"]),
  description: zod
    .string()
    .min(5, "Deskripsi pemberian poin minimal 5 karakter"),
});

type PointFormValues = zod.infer<typeof pointSchema>;

interface GivePointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GivePointsDto) => void;
  isLoading?: boolean;
}

export function GivePointsDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: GivePointsDialogProps) {
  const { data: usersResponse } = useQuery({
    queryKey: ["ims-users-points-dropdown"],
    queryFn: () => usersService.list(),
  });

  const users = usersResponse?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PointFormValues>({
    resolver: zodResolver(pointSchema),
    defaultValues: {
      userId: "",
      points: 10,
      type: "kehadiran",
      description: "",
    },
  });

  const firstUserId = users[0]?._id;

  useEffect(() => {
    if (open) {
      reset({
        userId: firstUserId || "",
        points: 10,
        type: "kehadiran",
        description: "",
      });
    }
  }, [open, reset, firstUserId]);

  const onFormSubmit = (data: PointFormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/50 bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Berikan Reward Poin Fungsionaris
          </DialogTitle>
          <DialogDescription>
            Berikan poin apresiasi atas kontribusi, kehadiran rapat, atau
            kinerja tugas fungsionaris.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="userId">Pilih Fungsionaris</Label>
            <Select
              id="userId"
              className="bg-background/50 border-border/50"
              {...register("userId")}
            >
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.department})
                </option>
              ))}
            </Select>
            {errors.userId && (
              <p className="text-xs text-danger font-medium">
                {errors.userId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="points">Jumlah Poin (+)</Label>
              <Input
                id="points"
                type="number"
                min="1"
                className="bg-background/50 border-border/50"
                {...register("points", { valueAsNumber: true })}
              />
              {errors.points && (
                <p className="text-xs text-danger font-medium">
                  {errors.points.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="type">Kategori Poin</Label>
              <Select
                id="type"
                className="bg-background/50 border-border/50"
                {...register("type")}
              >
                <option value="kehadiran">Kehadiran Rapat/Event</option>
                <option value="proker">Penyelesaian Proker</option>
                <option value="lainnya">Lainnya (Apresiasi)</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Alasan Pemberian Poin</Label>
            <Textarea
              id="description"
              placeholder="Contoh: Menjadi Penanggung Jawab utama PKKMB FT UNESA 2026..."
              className="bg-background/50 border-border/50 min-h-[80px]"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-danger font-medium">
                {errors.description.message}
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
              {isLoading ? "Memproses..." : "Berikan Poin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
