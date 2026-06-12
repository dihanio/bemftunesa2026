"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  ShieldAlert,
  KeyRound,
  Monitor,
  Trash2,
  Plus,
  LogOut,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const AVAILABLE_PERMISSIONS = [
  "dashboard.read",
  "users.read",
  "users.manage",
  "permissions.manage",
  "workflow.read",
  "workflow.manage",
  "audit.read",
  "proker.read",
  "proker.manage",
  "committee.read",
  "committee.manage",
  "finance.read",
  "finance.approve",
  "finance.override",
  "documents.read",
  "documents.manage",
  "documents.approve",
  "cms.read",
  "cms.manage",
];

const ROLES = [
  "Super Admin",
  "Admin Sistem",
  "Admin",
  "KaBEM",
  "WaKaBEM",
  "Bendahara",
  "Sekretaris",
  "Kadep",
  "Wakadep",
  "Staff",
  "Panitia",
  "Guest",
];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { user: currentActor } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");

  // New permission form state
  const [newPermission, setNewPermission] = useState("");
  const [newEffect, setNewEffect] = useState<"allow" | "deny">("allow");
  const [newScope, setNewScope] = useState("global");
  const [newScopeId, setNewScopeId] = useState("");
  const [newReason, setNewReason] = useState("");

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => usersService.list(),
  });

  const { data: sessionsResponse } = useQuery({
    queryKey: ["user-sessions", selectedUser?._id],
    queryFn: () => usersService.listSessions(selectedUser._id),
    enabled: !!selectedUser,
  });

  const { data: permissionsResponse } = useQuery({
    queryKey: ["user-permissions", selectedUser?._id],
    queryFn: () => usersService.listPermissions(selectedUser._id),
    enabled: !!selectedUser,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      usersService.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: ({ id, sessionId }: { id: string; sessionId?: string }) =>
      usersService.revokeSessions(id, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-sessions", selectedUser?._id],
      });
    },
  });

  const addOverrideMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      usersService.addPermissionOverride(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-permissions", selectedUser?._id],
      });
      setNewPermission("");
      setNewReason("");
      setNewScopeId("");
    },
  });

  const removeOverrideMutation = useMutation({
    mutationFn: ({ id, permission }: { id: string; permission: string }) =>
      usersService.removePermissionOverride(id, permission),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-permissions", selectedUser?._id],
      });
    },
  });

  const users = usersResponse?.data || [];
  const sessions = sessionsResponse?.data || [];
  const overrides = permissionsResponse?.data || [];

  const filteredUsers = users.filter(
    (u: any) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-[#10b981]" />
            Manajemen Pengguna & Keamanan
          </h1>
          <p className="text-xs text-[#a9b49c]">
            Kelola peran, izin overrides khusus, dan cabut sesi aktif dari jarak
            jauh.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Cari nama atau email pengguna..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md border-white/10 bg-white/5 text-white"
        />
      </div>

      <Card className="border-white/10 bg-white/5 backdrop-blur-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="border-white/10">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white">Nama</TableHead>
                <TableHead className="text-white">Email</TableHead>
                <TableHead className="text-white">Role</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-[#a9b49c]"
                  >
                    Memuat data pengguna...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-[#a9b49c]"
                  >
                    Tidak ada pengguna ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u: any) => (
                  <TableRow
                    key={u._id}
                    className="border-white/5 hover:bg-white/5"
                  >
                    <TableCell className="font-semibold text-white">
                      {u.name}
                    </TableCell>
                    <TableCell className="text-[#a9b49c]">{u.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-white/20 text-[#a7f3d0]"
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <Badge className="bg-[#71d39b]/25 text-[#71d39b] hover:bg-[#71d39b]/25 border-0">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/25 text-destructive hover:bg-destructive/25 border-0">
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="xs"
                        className="bg-[#10b981] text-[#091c11] hover:bg-[#a7f3d0]"
                        onClick={() => {
                          setSelectedUser(u);
                          setActiveTab("profile");
                        }}
                      >
                        Kelola
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedUser && (
        <Dialog
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
        >
          <DialogContent className="max-w-2xl border-white/10 bg-[#161f12]/95 text-white backdrop-blur-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-black flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[#10b981]" />
                Panel Akses Keamanan: {selectedUser.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#a9b49c]">
                Email: {selectedUser.email}
              </DialogDescription>
            </DialogHeader>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 border-white/10 bg-white/5">
                <TabsTrigger value="profile">Peran & Organisasi</TabsTrigger>
                <TabsTrigger value="overrides">Izin Overrides</TabsTrigger>
                <TabsTrigger value="sessions">
                  Sesi Aktif ({sessions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#a9b49c]">
                    Ubah Peran BEM
                  </label>
                  <Select
                    value={selectedUser.role}
                    onChange={(e) =>
                      updateRoleMutation.mutate({
                        id: selectedUser._id,
                        role: e.target.value,
                      })
                    }
                    className="border-white/10 bg-white/5 text-white"
                  >
                    <option
                      value=""
                      disabled
                      className="bg-[#1c2618] text-white"
                    >
                      Pilih Peran
                    </option>
                    {ROLES.map((r) => (
                      <option
                        key={r}
                        value={r}
                        className="bg-[#1c2618] text-white"
                      >
                        {r}
                      </option>
                    ))}
                  </Select>
                  <p className="text-[10px] text-[#a9b49c] mt-1">
                    Mengubah peran ini akan langsung merubah permission default
                    dari pengguna.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="overrides" className="space-y-4 pt-4">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Plus className="h-4 w-4 text-[#10b981]" /> Tambah Direct
                    Permission Override
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#a9b49c]">
                        Pilih Izin
                      </span>
                      <Select
                        value={newPermission}
                        onChange={(e) => setNewPermission(e.target.value)}
                        className="h-9 border-white/10 bg-white/5 text-white"
                      >
                        <option
                          value=""
                          disabled
                          className="bg-[#1c2618] text-[#a9b49c]"
                        >
                          Pilih Izin
                        </option>
                        {AVAILABLE_PERMISSIONS.map((p) => (
                          <option
                            key={p}
                            value={p}
                            className="bg-[#1c2618] text-white"
                          >
                            {p}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-[#a9b49c]">Efek</span>
                      <Select
                        value={newEffect}
                        onChange={(e) => setNewEffect(e.target.value as any)}
                        className="h-9 border-white/10 bg-white/5 text-white"
                      >
                        <option
                          value="allow"
                          className="bg-[#1c2618] text-white"
                        >
                          ALLOW (Izinkan)
                        </option>
                        <option
                          value="deny"
                          className="bg-[#1c2618] text-white"
                        >
                          DENY (Tolak / Override Bawah)
                        </option>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-[#a9b49c]">Scope</span>
                      <Select
                        value={newScope}
                        onChange={(e) => setNewScope(e.target.value)}
                        className="h-9 border-white/10 bg-white/5 text-white"
                      >
                        <option
                          value="global"
                          className="bg-[#1c2618] text-white"
                        >
                          Global
                        </option>
                        <option
                          value="department"
                          className="bg-[#1c2618] text-white"
                        >
                          Department
                        </option>
                        <option
                          value="committee"
                          className="bg-[#1c2618] text-white"
                        >
                          Committee
                        </option>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-[#a9b49c]">
                        Scope ID (Optional)
                      </span>
                      <Input
                        placeholder="Contoh: ID Departemen / Proker"
                        value={newScopeId}
                        onChange={(e) => setNewScopeId(e.target.value)}
                        className="h-9 border-white/10 bg-white/5"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-[#a9b49c]">
                      Alasan / Keterangan
                    </span>
                    <Input
                      placeholder="Masukkan alasan pemberian hak khusus..."
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                      className="h-9 border-white/10 bg-white/5"
                    />
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-[#10b981] text-[#091c11] hover:bg-[#a7f3d0]"
                    onClick={() => {
                      if (!newPermission) return;
                      addOverrideMutation.mutate({
                        id: selectedUser._id,
                        data: {
                          permission: newPermission,
                          effect: newEffect,
                          scope: {
                            type: newScope,
                            id: newScopeId || undefined,
                          },
                          reason: newReason || undefined,
                        },
                      });
                    }}
                  >
                    Terapkan Hak Akses Override
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#a9b49c]">
                    Daftar Direct Overrides Aktif
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {overrides.length === 0 ? (
                      <p className="text-[10px] text-[#a9b49c] italic">
                        Tidak ada izin direct override saat ini.
                      </p>
                    ) : (
                      overrides.map((ov: any) => (
                        <div
                          key={ov._id}
                          className="flex items-center justify-between rounded border border-white/5 bg-white/5 p-2 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 font-bold">
                              {ov.effect === "allow" ? (
                                <CheckCircle className="h-3.5 w-3.5 text-[#71d39b]" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-destructive" />
                              )}
                              {ov.permission}
                            </div>
                            <div className="text-[9px] text-[#a9b49c] mt-0.5">
                              Scope: {ov.scope?.type ?? "global"}{" "}
                              {ov.scope?.id ? `(${ov.scope.id})` : ""}
                            </div>
                            {ov.reason && (
                              <div className="text-[9px] text-yellow-300/80">
                                Ket: {ov.reason}
                              </div>
                            )}
                          </div>
                          <Button
                            size="icon-xs"
                            variant="destructive"
                            onClick={() =>
                              removeOverrideMutation.mutate({
                                id: selectedUser._id,
                                permission: ov.permission,
                              })
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sessions" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#a9b49c]">
                    Revoke semua sesi untuk memutuskan akses logout segera.
                  </span>
                  <Button
                    size="xs"
                    variant="destructive"
                    onClick={() =>
                      revokeSessionMutation.mutate({ id: selectedUser._id })
                    }
                    className="flex items-center gap-1"
                  >
                    <LogOut className="h-3 w-3" />
                    Kick Semua
                  </Button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {sessions.length === 0 ? (
                    <p className="text-xs text-[#a9b49c] italic text-center py-6">
                      Tidak ada sesi aktif.
                    </p>
                  ) : (
                    sessions.map((sess: any) => (
                      <div
                        key={sess._id}
                        className="rounded border border-white/5 bg-white/5 p-3 flex items-start justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-white">
                            <Monitor className="h-3.5 w-3.5 text-[#10b981]" />
                            {sess.userAgent
                              ? sess.userAgent.split(" (")[0]
                              : "Perangkat Tidak Dikenal"}
                          </div>
                          <div className="text-[10px] text-[#a9b49c]">
                            IP: {sess.ipAddress || "Unknown"}
                          </div>
                          <div className="text-[10px] text-[#a9b49c]">
                            Status:{" "}
                            <span
                              className={
                                sess.status === "active"
                                  ? "text-[#71d39b]"
                                  : "text-destructive"
                              }
                            >
                              {sess.status}
                            </span>
                          </div>
                          <div className="text-[9px] text-[#a9b49c]">
                            Kedaluwarsa:{" "}
                            {new Date(sess.expiresAt).toLocaleString("id-ID")}
                          </div>
                        </div>

                        {sess.status === "active" && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() =>
                              revokeSessionMutation.mutate({
                                id: selectedUser._id,
                                sessionId: sess._id,
                              })
                            }
                            className="border-white/10 hover:bg-destructive hover:text-white"
                          >
                            Putuskan
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
