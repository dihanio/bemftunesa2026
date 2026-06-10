"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { assetsService, Asset, AssetLoan } from "@/lib/api/assets";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  Search,
  Plus,
  Wrench,
  CheckCircle,
  AlertTriangle,
  ArrowRightLeft,
  MapPin,
  Barcode,
} from "lucide-react";
import { AssetFormDialog } from "@/components/assets/asset-form-dialog";
import { LoanFormDialog } from "@/components/assets/loan-form-dialog";
import { useAuth } from "@/hooks/useAuth";

export default function AssetsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch all assets
  const { data: assetsResponse, isLoading } = useQuery({
    queryKey: ["ims-assets"],
    queryFn: () => assetsService.listAssets(),
  });

  const assets = assetsResponse?.data || [];

  // Create asset mutation (BPI / Sekretaris only)
  const createAssetMutation = useMutation({
    mutationFn: (data: Partial<Asset>) => assetsService.createAsset(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["ims-assets"] });
      setAssetDialogOpen(false);
      setSuccessMsg(res.message || "Aset berhasil ditambahkan!");
      setTimeout(() => setSuccessMsg(""), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Gagal menambahkan aset.");
      setTimeout(() => setErrorMsg(""), 4000);
    },
  });

  // Create loan mutation
  const createLoanMutation = useMutation({
    mutationFn: (data: Partial<AssetLoan>) => {
      // Inject borrowerId
      return assetsService.createLoan({
        ...data,
        borrowerId: user?.id || "",
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["ims-assets"] });
      setLoanDialogOpen(false);
      setSuccessMsg(res.message || "Pengajuan peminjaman berhasil dikirim!");
      setTimeout(() => setSuccessMsg(""), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Gagal mengajukan peminjaman.");
      setTimeout(() => setErrorMsg(""), 4000);
    },
  });

  const handleCreateAssetSubmit = (data: Partial<Asset>) => {
    createAssetMutation.mutate(data);
  };

  const handleCreateLoanSubmit = (data: Partial<AssetLoan>) => {
    createLoanMutation.mutate(data);
  };

  const handleOpenLoanDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setLoanDialogOpen(true);
  };

  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.code.toLowerCase().includes(search.toLowerCase()),
  );

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "Good":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1 text-[10px]">
            <CheckCircle className="w-3 h-3" /> Bagus
          </Badge>
        );
      case "Maintenance":
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1 text-[10px]">
            <Wrench className="w-3 h-3" /> Perbaikan
          </Badge>
        );
      case "Broken":
        return (
          <Badge className="bg-red-500/10 text-red-400 border-red-500/20 gap-1 text-[10px]">
            <AlertTriangle className="w-3 h-3" /> Rusak
          </Badge>
        );
      default:
        return null;
    }
  };

  const isSecretaryOrAdmin =
    user?.role === "Super Admin" || user?.role === "Sekretaris";

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Inventaris & Peminjaman Aset
          </h1>
          <p className="mt-2 text-muted-foreground">
            Daftar aset fisik Sekretariat BEM FT UNESA. Ajukan peminjaman secara
            digital untuk kebutuhan proker.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={() => router.push("/assets/loans")}
            className="border-border/50 bg-background/50 hover:bg-muted/20 gap-2 shadow-sm"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Log Peminjaman Aset
          </Button>
          {isSecretaryOrAdmin && (
            <Button
              onClick={() => setAssetDialogOpen(true)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 shadow-lg shadow-accent/15"
            >
              <Plus className="w-4 h-4" />
              Tambah Aset Baru
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 bg-card/20 backdrop-blur-xs">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-accent/10 text-accent">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Jenis Barang
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">
                {assets.length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/20 backdrop-blur-xs">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Barang Layak Pakai
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">
                {assets.filter((a) => a.condition === "Good").length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/20 backdrop-blur-xs">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Dalam Perbaikan / Rusak
              </p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">
                {assets.filter((a) => a.condition !== "Good").length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Main Grid */}
      <div className="space-y-6">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama barang atau kode aset..."
            className="pl-10 bg-background/40 border-border/50 focus:border-accent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-44 w-full bg-card/40 border border-border/50 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredAssets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <Card
                key={asset._id}
                className="border-border/50 bg-card/30 backdrop-blur-sm hover:border-accent/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-xs hover:shadow-lg hover:shadow-accent/5"
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-bold text-foreground text-base tracking-tight leading-tight group-hover:text-accent transition-colors">
                        {asset.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Barcode className="w-3.5 h-3.5 text-accent" />
                        {asset.code}
                      </div>
                    </div>
                    <div className="shrink-0 mt-0.5">
                      {getConditionBadge(asset.condition)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-border/20 pt-3 text-xs">
                    <div>
                      <p className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                        Stok Tersedia
                      </p>
                      <p className="text-foreground font-extrabold text-sm mt-0.5">
                        {asset.stock} unit
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                        Lokasi
                      </p>
                      <p className="text-foreground font-semibold mt-0.5 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#10b981]" />
                        {asset.location || "Sekretariat"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-background/20 border-t border-border/20 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                    BEM FT UNESA
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleOpenLoanDialog(asset)}
                    disabled={asset.stock < 1 || asset.condition !== "Good"}
                    className="bg-[#10b981] hover:bg-[#10b981]/90 text-white font-semibold text-xs py-1.5 px-4 h-8 rounded-lg shrink-0 shadow-xs"
                  >
                    {asset.stock < 1 ? "Habis" : "Ajukan Pinjam"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center rounded-2xl border border-dashed border-border/50 bg-card/10">
            <Package className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground italic text-sm">
              {search
                ? "Tidak ada barang yang sesuai dengan pencarian."
                : "Belum ada inventaris barang yang terdaftar."}
            </p>
          </div>
        )}
      </div>

      <AssetFormDialog
        open={assetDialogOpen}
        onOpenChange={setAssetDialogOpen}
        onSubmit={handleCreateAssetSubmit}
        isLoading={createAssetMutation.isPending}
      />

      <LoanFormDialog
        open={loanDialogOpen}
        onOpenChange={setLoanDialogOpen}
        onSubmit={handleCreateLoanSubmit}
        asset={selectedAsset}
        isLoading={createLoanMutation.isPending}
      />
    </div>
  );
}
