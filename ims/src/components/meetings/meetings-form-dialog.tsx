"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useQuery } from "@tanstack/react-query";
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
import { Meeting } from "@/lib/api/meetings";
import { prokerService } from "@/lib/api/proker";

const meetingSchema = zod.object({
  title: zod.string().min(3, "Judul minimal 3 karakter"),
  description: zod.string().optional(),
  prokerId: zod.string().optional(),
  date: zod.string().min(1, "Tanggal rapat harus diatur"),
  location: zod.string().optional(),
  latitude: zod.number().optional(),
  longitude: zod.number().optional(),
  radius: zod.number().optional(),
});

type MeetingFormValues = zod.infer<typeof meetingSchema>;

interface MeetingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Meeting>) => void;
  initialData?: Meeting | null;
  isLoading?: boolean;
}

export function MeetingsFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: MeetingFormDialogProps) {
  // Query to get prokers list for the dropdown
  const { data: prokerResponse } = useQuery({
    queryKey: ["ims-prokers-lookup-meetings"],
    queryFn: () => prokerService.list(),
    enabled: open,
  });

  const prokers = prokerResponse?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: "",
      description: "",
      prokerId: "",
      date: "",
      location: "",
      latitude: undefined,
      longitude: undefined,
      radius: 50,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || "",
        description: "",
        prokerId: initialData.prokerId || "",
        date: initialData.date
          ? new Date(initialData.date).toISOString().split("T")[0]
          : "",
        location: initialData.location || "",
        latitude: initialData.latitude,
        longitude: initialData.longitude,
        radius: initialData.radius || 50,
      });
    } else {
      reset({
        title: "",
        description: "",
        prokerId: "",
        date: "",
        location: "",
        latitude: undefined,
        longitude: undefined,
        radius: 50,
      });
    }
  }, [initialData, reset, open]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung Geolocation API.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", Number(position.coords.latitude.toFixed(6)));
        setValue("longitude", Number(position.coords.longitude.toFixed(6)));
      },
      (error) => {
        alert(
          "Gagal mendeteksi lokasi perangkat. Pastikan izin akses lokasi aktif di browser Anda.",
        );
      },
      { enableHighAccuracy: true },
    );
  };

  const onFormSubmit = (data: MeetingFormValues) => {
    const formattedData = {
      ...data,
      latitude:
        data.latitude === undefined ||
        data.latitude === null ||
        isNaN(Number(data.latitude))
          ? undefined
          : Number(data.latitude),
      longitude:
        data.longitude === undefined ||
        data.longitude === null ||
        isNaN(Number(data.longitude))
          ? undefined
          : Number(data.longitude),
      radius:
        data.radius === undefined ||
        data.radius === null ||
        isNaN(Number(data.radius))
          ? undefined
          : Number(data.radius),
    };
    onSubmit(formattedData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/50 bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {initialData ? "Edit Agenda Rapat" : "Buat Agenda Rapat Baru"}
          </DialogTitle>
          <DialogDescription>
            Tentukan jadwal rapat dan asosiasikan dengan program kerja BEM FT
            UNESA untuk absensi digital.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="title">Judul / Agenda Rapat</Label>
            <Input
              id="title"
              placeholder="Contoh: Rapat Pleno 1 / Rapat Koordinasi Panitia"
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
            <Label htmlFor="description">Deskripsi Rapat</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan poin-poin pembahasan rapat..."
              className="bg-background/50 border-border/50 min-h-[80px]"
              {...register("description")}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="prokerId">Program Kerja Terkait (Opsional)</Label>
            <Select
              id="prokerId"
              className="bg-background/50 border-border/50"
              {...register("prokerId")}
            >
              <option value="">-- Bukan Bagian dari Proker --</option>
              {prokers.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="date">Tanggal & Waktu</Label>
              <Input
                id="date"
                type="date"
                className="bg-background/50 border-border/50 text-sm"
                {...register("date")}
              />
              {errors.date && (
                <p className="text-xs text-danger font-medium">
                  {errors.date.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="location">Lokasi / Media</Label>
              <Input
                id="location"
                placeholder="Contoh: Sekre BEM / Zoom Meeting"
                className="bg-background/50 border-border/50 text-sm"
                {...register("location")}
              />
            </div>
          </div>

          <div className="border-t border-border/20 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-accent uppercase tracking-wider">
                Verifikasi Kehadiran GPS (Opsional)
              </h4>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="text-[9px] font-bold text-[#10b981] hover:underline transition-colors uppercase tracking-wider"
              >
                Gunakan Lokasi Perangkat
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1 col-span-1">
                <Label
                  htmlFor="latitude"
                  className="text-[10px] text-muted-foreground font-semibold"
                >
                  Latitude
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g. -7.3125"
                  className="bg-background/50 border-border/50 text-xs px-2"
                  {...register("latitude", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1 col-span-1">
                <Label
                  htmlFor="longitude"
                  className="text-[10px] text-muted-foreground font-semibold"
                >
                  Longitude
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g. 112.7291"
                  className="bg-background/50 border-border/50 text-xs px-2"
                  {...register("longitude", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1 col-span-1">
                <Label
                  htmlFor="radius"
                  className="text-[10px] text-muted-foreground font-semibold"
                >
                  Radius (m)
                </Label>
                <Input
                  id="radius"
                  type="number"
                  placeholder="e.g. 50"
                  className="bg-background/50 border-border/50 text-xs px-2"
                  {...register("radius", { valueAsNumber: true })}
                />
              </div>
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
              {isLoading ? "Membuat..." : "Buat Rapat & QR"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
