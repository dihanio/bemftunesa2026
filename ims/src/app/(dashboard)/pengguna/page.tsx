"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService, User } from "@/lib/api/users";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  Search,
  UserCheck,
  UserX,
  Settings2,
  Mail,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserFormDialog } from "@/components/users/user-form-dialog";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ims-users", page, search],
    queryFn: () => usersService.list({ page, limit, search }),
  });

  const users = data?.data || [];
  const meta = (data as any)?.meta || {
    page: 1,
    limit: 10,
    totalDocs: 0,
    totalPages: 1,
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newUser: Partial<User>) => usersService.create(newUser as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-users"] });
      setIsFormOpen(false);
      alert("Anggota berhasil diundang!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedUser: Partial<User>) =>
      usersService.update(editingUser!._id, updatedUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-users"] });
      setIsFormOpen(false);
      setEditingUser(null);
      alert("Profil anggota diperbarui!");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      usersService.updateStatus(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-users"] });
      alert("Status keanggotaan berhasil diubah!");
    },
  });

  const handleOpenInvite = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    const action = currentStatus ? "menonaktifkan" : "mengaktifkan";
    if (confirm(`Apakah Anda yakin ingin ${action} fungsionaris ini?`)) {
      toggleStatusMutation.mutate({ id, active: !currentStatus });
    }
  };

  const handleFormSubmit = (formData: Partial<User>) => {
    if (editingUser) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Super Admin":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "Sekretaris":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Bendahara":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Kadep":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const filteredUsers = users;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Fungsionaris & Struktur Anggota
          </h1>
          <p className="mt-2 text-muted-foreground">
            Kelola hak akses fungsionaris BEM FT UNESA periode kabinet 2026.
          </p>
        </div>
        <Button
          onClick={handleOpenInvite}
          className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Undang Anggota
        </Button>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Daftar Fungsionaris
              </CardTitle>
              <CardDescription>
                Daftar lengkap anggota fungsionaris BEM FT UNESA aktif.
              </CardDescription>
            </div>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau email..."
                className="pl-10 bg-background/50"
                value={search}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[300px]">Fungsionaris</TableHead>
                  <TableHead>Departemen / Jabatan</TableHead>
                  <TableHead>Hak Akses Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user._id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {user.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {user.position || "Fungsionaris"}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {user.department || "BEM FT"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getRoleColor(user.role)}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                          className={
                            user.isActive
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : ""
                          }
                        >
                          {user.isActive ? "Aktif" : "Non-aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-accent"
                            onClick={() => handleOpenEdit(user)}
                          >
                            <Settings2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${
                              user.isActive
                                ? "text-muted-foreground hover:text-destructive"
                                : "text-muted-foreground hover:text-emerald-500"
                            }`}
                            onClick={() =>
                              handleToggleStatus(user._id, user.isActive)
                            }
                          >
                            {user.isActive ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground italic"
                    >
                      {search
                        ? "Tidak ada anggota yang cocok dengan pencarian."
                        : "Belum ada anggota fungsionaris yang tercatat."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
              <div className="text-xs text-[#a9b49c]">
                Menampilkan {(page - 1) * limit + 1} -{" "}
                {Math.min(page * limit, meta.totalDocs)} dari {meta.totalDocs}{" "}
                fungsionaris
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 hover:bg-white/5 text-white"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 hover:bg-white/5 text-white"
                  disabled={page === meta.totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, meta.totalPages))
                  }
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={editingUser}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
