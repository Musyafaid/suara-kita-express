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
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/audit")({
  head: () => ({ meta: [{ title: "Audit Logs — SuaraKita Admin" }] }),
  component: AdminAudit,
});

const actionColors: Record<string, string> = {
  login: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  create: "bg-success/15 text-success border-success/30",
  auto_create_event: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  update: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  delete: "bg-destructive/15 text-destructive border-destructive/30",
  vote: "bg-primary/15 text-primary border-primary/30",
  approve_komentar: "bg-success/15 text-success border-success/30",
  reject_komentar: "bg-destructive/15 text-destructive border-destructive/30",
};

function AdminAudit() {
  const { isSuperAdmin, loading } = useAuth();
  const [q, setQ] = useState("");
  const [action, setAction] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", action],
    queryFn: async () => {
      let qb = supabase
        .from("audit_logs")
        .select("id,user_id,action,resource_type,resource_id,metadata,created_at,profiles:user_id(full_name,username)")
        .order("created_at", { ascending: false })
        .limit(300);
      if (action !== "all") qb = qb.eq("action", action);
      const { data } = await qb;
      return data ?? [];
    },
    enabled: isSuperAdmin,
  });

  if (!loading && !isSuperAdmin) {
    return (
      <AdminShell>
        <Card><CardContent className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <div className="font-medium">Akses Ditolak</div>
          <div className="text-sm">Audit Logs hanya tersedia untuk Super Admin.</div>
        </CardContent></Card>
      </AdminShell>
    );
  }

  const filtered = (data ?? []).filter((r: any) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      r.action?.toLowerCase().includes(s) ||
      r.resource_type?.toLowerCase().includes(s) ||
      r.resource_id?.toLowerCase().includes(s) ||
      JSON.stringify(r.metadata ?? {}).toLowerCase().includes(s) ||
      r.profiles?.full_name?.toLowerCase().includes(s)
    );
  });

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Riwayat aktivitas penting di seluruh platform.</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Cari aksi, resource, user..." value={q} onChange={(e) => setQ(e.target.value)} className="md:w-72" />
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aksi</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="vote">Vote</SelectItem>
              <SelectItem value="approve_komentar">Approve Komentar</SelectItem>
              <SelectItem value="reject_komentar">Reject Komentar</SelectItem>
              <SelectItem value="auto_create_event">Auto-Create Event</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Belum ada aktivitas.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.profiles?.full_name ?? r.profiles?.username ?? (r.user_id ? r.user_id.slice(0, 8) : "—")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={actionColors[r.action] ?? ""}>{r.action}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium">{r.resource_type ?? "—"}</div>
                      {r.resource_id && <div className="text-muted-foreground">{r.resource_id.slice(0, 8)}</div>}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <pre className="truncate text-xs text-muted-foreground">{r.metadata ? JSON.stringify(r.metadata) : "—"}</pre>
                    </TableCell>
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
