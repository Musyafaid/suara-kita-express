import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { ShieldAlert, Users } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/user")({
  head: () => ({ meta: [{ title: "Pengguna — SuaraKita Admin" }] }),
  component: AdminUser,
});

const roleColors: Record<string, string> = {
  super_admin: "bg-destructive/15 text-destructive border-destructive/30",
  admin_instansi: "bg-primary/15 text-primary border-primary/30",
  masyarakat: "bg-muted text-muted-foreground",
};

function AdminUser() {
  const { isSuperAdmin, loading } = useAuth();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", roleFilter],
    enabled: isSuperAdmin,
    queryFn: async () => {
      let qb = supabase
        .from("profiles")
        .select("id,full_name,username,email:auth.users!inner(email),created_at,instansi:instansi_id(nama),user_roles(role)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(300);
      if (roleFilter !== "all") qb = qb.eq("user_roles.role", roleFilter);
      const { data } = await qb;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        full_name: r.full_name,
        username: r.username,
        email: r.email?.email ?? "",
        created_at: r.created_at,
        instansi: r.instansi?.nama ?? "",
        roles: (r.user_roles ?? []).map((x: any) => x.role),
      }));
    },
  });

  if (!loading && !isSuperAdmin) {
    return (
      <AdminShell>
        <Card><CardContent className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <div className="font-medium">Akses Ditolak</div>
          <div className="text-sm">Manajemen pengguna hanya tersedia untuk Super Admin.</div>
        </CardContent></Card>
      </AdminShell>
    );
  }

  const filtered = (data ?? []).filter((r: any) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(s) ||
      r.username?.toLowerCase().includes(s) ||
      r.email?.toLowerCase().includes(s) ||
      r.instansi?.toLowerCase().includes(s)
    );
  });

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Pengguna</h1>
          <p className="text-sm text-muted-foreground">Daftar seluruh pengguna terdaftar.</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Cari nama, username, email..." value={q} onChange={(e) => setQ(e.target.value)} className="md:w-72" />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Peran</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin_instansi">Admin Instansi</SelectItem>
              <SelectItem value="masyarakat">Masyarakat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Tidak ada pengguna.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Instansi</TableHead>
                  <TableHead>Bergabung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.full_name ?? "—"}</div>
                      {r.username && <div className="text-xs text-muted-foreground">@{r.username}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{r.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.roles.map((role: string) => (
                          <Badge key={role} variant="outline" className={roleColors[role] ?? ""}>
                            {role === "super_admin" ? "Super" : role === "admin_instansi" ? "Admin" : "Warga"}
                          </Badge>
                        ))}
                        {r.roles.length === 0 && <Badge variant="outline">Warga</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.instansi || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("id-ID")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
