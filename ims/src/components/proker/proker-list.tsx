"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { prokerService, Proker } from "@/lib/api/proker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Layout,
  MoreVertical,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ProkerFormDialog } from "./proker-form-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ProkerList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProker, setEditingProker] = useState<Proker | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ims-proker"],
    queryFn: () => prokerService.list(),
  });

  const prokers = data?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newProker: Partial<Proker>) => prokerService.create(newProker),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-proker"] });
      setIsFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedProker: Partial<Proker>) =>
      prokerService.update(editingProker!._id, updatedProker),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-proker"] });
      setIsFormOpen(false);
      setEditingProker(null);
    },
  });

  const filteredProkers = prokers.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Planning":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "In Progress":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Completed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Planning":
        return <Clock className="w-3 h-3 mr-1" />;
      case "In Progress":
        return <Layout className="w-3 h-3 mr-1" />;
      case "Completed":
        return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case "Cancelled":
        return <AlertCircle className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const handleOpenCreateForm = () => {
    setEditingProker(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (proker: Proker, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProker(proker);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (formData: Partial<Proker>) => {
    if (editingProker) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari program kerja..."
            className="pl-10 bg-card/40 border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50">
            {["all", "Planning", "In Progress", "Completed"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  statusFilter === status
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {status === "all" ? "Semua" : status}
              </button>
            ))}
          </div>

          <Button
            onClick={handleOpenCreateForm}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Proker</span>
          </Button>
        </div>
      </div>

      {/* Proker Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/50 bg-card/40 animate-pulse">
              <CardHeader className="h-24 bg-muted/20" />
              <CardContent className="space-y-3 p-6">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : filteredProkers.length > 0 ? (
          <AnimatePresence>
            {filteredProkers.map((proker) => (
              <motion.div
                key={proker._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={() => router.push(`/proker/${proker._id}`)}
                className="cursor-pointer"
              >
                <Card className="border-border/50 bg-card/40 backdrop-blur-sm hover:border-accent/30 transition-all group h-full flex flex-col">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <Badge
                        variant="outline"
                        className={getStatusColor(proker.status)}
                      >
                        {getStatusIcon(proker.status)}
                        {proker.status}
                      </Badge>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground group-hover:text-foreground"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleOpenEditForm(proker)}
                          >
                            Edit Proker
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <CardTitle className="text-xl font-bold mb-2 line-clamp-2">
                      {proker.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                      {proker.description || "Tidak ada deskripsi tersedia."}
                    </p>

                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progres</span>
                        <span className="font-bold">{proker.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${proker.progress}%` }}
                          className="h-full bg-accent rounded-full shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]"
                        />
                      </div>

                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium pt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {proker.startDate
                            ? new Date(proker.startDate).toLocaleDateString(
                                "id-ID",
                              )
                            : "TBA"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Layout className="w-3 h-3" />
                          Departemen
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="col-span-full py-20 text-center space-y-4 bg-muted/10 rounded-3xl border border-dashed border-border/50">
            <div className="p-4 bg-muted/20 rounded-full w-fit mx-auto">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Tidak ada program kerja</h3>
              <p className="text-muted-foreground text-sm">
                Coba ubah filter atau tambahkan program kerja baru.
              </p>
            </div>
          </div>
        )}
      </div>

      <ProkerFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={editingProker}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
