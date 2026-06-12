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
import { Award, Sparkles, User, Coins, FileText } from "lucide-react";

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
      <DialogContent className="max-w-lg border border-white/10 bg-[#0a160f]/95 backdrop-blur-2xl shadow-[0_0_80px_rgba(16,185,129,0.15)] rounded-3xl overflow-hidden p-0">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#10b981] to-transparent opacity-50" />
        
        <div className="p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/5 border border-[#10b981]/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Sparkles className="w-6 h-6 text-[#10b981]" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                  Berikan Apresiasi
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-400 mt-1">
                  Tambahkan reward poin untuk fungsionaris yang berdedikasi.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="userId" className="text-gray-300 font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-[#10b981]" /> Fungsionaris Tujuan
            </Label>
            <div className="relative">
              <Select
                id="userId"
                className="bg-black/20 border-white/10 text-white h-12 rounded-xl focus:ring-[#10b981] focus:border-[#10b981] transition-all"
                {...register("userId")}
              >
                {users.map((u) => (
                  <option key={u._id} value={u._id} className="bg-[#0f2418] text-white">
                    {u.name} ({u.department})
                  </option>
                ))}
              </Select>
            </div>
            {errors.userId && (
              <p className="text-xs text-red-400 font-medium animate-pulse">
                {errors.userId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="points" className="text-gray-300 font-semibold flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" /> Jumlah Poin
              </Label>
              <div className="relative">
                <Input
                  id="points"
                  type="number"
                  min="1"
                  className="bg-black/20 border-white/10 text-white h-12 rounded-xl pl-4 pr-10 text-lg font-bold focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                  {...register("points", { valueAsNumber: true })}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500/50 font-bold">
                  Pts
                </div>
              </div>
              {errors.points && (
                <p className="text-xs text-red-400 font-medium animate-pulse">
                  {errors.points.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-gray-300 font-semibold flex items-center gap-2">
                <Award className="w-4 h-4 text-[#10b981]" /> Kategori Poin
              </Label>
              <Select
                id="type"
                className="bg-black/20 border-white/10 text-white h-12 rounded-xl focus:ring-[#10b981] focus:border-[#10b981] transition-all"
                {...register("type")}
              >
                <option value="kehadiran" className="bg-[#0f2418] text-white">Kehadiran Rapat/Event</option>
                <option value="proker" className="bg-[#0f2418] text-white">Penyelesaian Proker</option>
                <option value="lainnya" className="bg-[#0f2418] text-white">Lainnya (Apresiasi)</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300 font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#10b981]" /> Catatan Apresiasi
            </Label>
            <Textarea
              id="description"
              placeholder="Berikan alasan yang memotivasi..."
              className="bg-black/20 border-white/10 text-white min-h-[100px] rounded-xl focus:ring-[#10b981] focus:border-[#10b981] transition-all resize-none p-4"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-red-400 font-medium animate-pulse">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-6 border-t border-white/5 mt-6 gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="text-gray-400 hover:text-white hover:bg-white/5 rounded-xl h-12 px-6"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] rounded-xl h-12 px-8 transition-all font-bold tracking-wide"
              disabled={isLoading}
            >
              {isLoading ? "Menyimpan..." : "Berikan Reward"}
            </Button>
          </DialogFooter>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
