import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Copy, Loader2, Mail, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/invite")({
  head: () => ({ meta: [{ title: "Undangan Admin — SuaraKita Admin" }] }),
  component: AdminInvitePage,
});

type Invite = {
  id: string;
  code: string;
  role: string;
  instansi_id: string | null;
  catatan: string | null;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  revoked_at: string | null;
  created_at: string;
};

type Instansi = { id: string; nama: string };

function randomCode(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function AdminInvitePage() {
  const { isSuperAdmin, profile } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [instansi, setInstansi] = useState<Instansi[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [role, setRole] = useState<"admin_instansi" | "super_admin">("admin_instansi");
  const [instansiId, setInstansiId] = useState<string>(profile?.instansi_id ?? "");
  const [catatan, setCatatan] = useState("");
  const [days, setDays] = useState(14);

  const load = async () => {
    setLoading(true);
    const [{ data: inv }, { data: ins }] = await Promise.all([
      supabase.from("admin_invites").select("*").order("created_at", { ascending: false }),
      supabase.from("instansi").select("id,nama").is("deleted_at", null).order("nama"),
    ]);
    setInvites((inv ?? []) as Invite[]);
    setInstansi((ins ?? []) as Instansi[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const code = randomCode();
    const expires = new Date(Date.now() + days * 86400_000).toISOString();
    const { error } = await supabase.from("admin_invites").insert({
      code,
      role,
      instansi_id: instansiId || null,
      catatan: catatan || null,
      expires_at: expires,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Kode dibuat: ${code}`);
    setCatatan("");
    load();
  };

  const handleRevoke = async (id: string) => {
    const { error } = await supabase.from("admin_invites").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Kode dicabut"); load(); }
  };

  const copy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success("Kode tersalin");
  };

  const statusBadge = (i: Invite) => {
    if (i.revoked_at) return <Badge variant="destructive">Dicabut</Badge>;
    if (i.used_at) return <Badge variant="secondary">Terpakai</Badge>;
    if (new Date(i.expires_at) < new Date()) return <Badge variant="outline">Kedaluwarsa</Badge>;
    return <Badge className="bg-green-600 hover:bg-green-700">Aktif</Badge>;
  };

  return (
    <AdminShell>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero">
          <Mail className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Undangan Admin</h1>
          <p className="text-sm text-muted-foreground">Buat kode undangan agar pengguna lain otomatis menjadi admin saat menukarkannya.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">Buat Kode Baru</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Peran</Label>
                <Select value={role} onValueChange={(v) => setRole(v as never)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_instansi">Admin Instansi</SelectItem>
                    {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Instansi (opsional)</Label>
                <Select value={instansiId || "none"} onValueChange={(v) => setInstansiId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih instansi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Tanpa instansi —</SelectItem>
                    {instansi.map((i) => <SelectItem key={i.id} value={i.id}>{i.nama}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Masa berlaku (hari)</Label>
                <Input type="number" min={1} max={90} value={days} onChange={(e) => setDays(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Catatan</Label>
                <Textarea rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="mis. untuk Pak Budi" />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Kode Undangan
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Daftar Undangan</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : invites.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Belum ada kode undangan.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kedaluwarsa</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-sm">{i.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{i.role === "super_admin" ? "Super" : "Instansi"}</Badge>
                      </TableCell>
                      <TableCell>{statusBadge(i)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(i.expires_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{i.catatan ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => copy(i.code)} title="Salin">
                          <Copy className="h-4 w-4" />
                        </Button>
                        {!i.used_at && !i.revoked_at && (
                          <Button size="icon" variant="ghost" onClick={() => handleRevoke(i.id)} title="Cabut">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
