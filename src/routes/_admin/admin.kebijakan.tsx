import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/kebijakan")({
  head: () => ({ meta: [{ title: "Kebijakan — SuaraKita Admin" }] }),
  component: AdminKebijakan,
});

const statusList = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Dipublikasikan" },
  { value: "voting_aktif", label: "Voting Aktif" },
  { value: "voting_ditutup", label: "Voting Ditutup" },
  { value: "ditinjau", label: "Ditinjau" },
  { value: "ditindaklanjuti", label: "Ditindaklanjuti" },
  { value: "selesai", label: "Selesai" },
];

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-info/15 text-info border-info/30",
  voting_aktif: "bg-success/15 text-success border-success/30",
  voting_ditutup: "bg-muted text-muted-foreground",
  ditinjau: "bg-warning/15 text-warning-foreground border-warning/30",
  ditindaklanjuti: "bg-primary/15 text-primary border-primary/30",
  selesai: "bg-success/15 text-success border-success/30",
};

function AdminKebijakan() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    judul: "",
    slug: "",
    deskripsi: "",
    konten: "",
    status: "draft" as string,
    kategori_id: "",
    instansi_id: "",
    dokumen_url: "",
    thumbnail_url: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
  });

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-kebijakan"],
    queryFn: async () => {
      const { data } = await supabase
        .from("kebijakan")
        .select("*,kategori:kategori_id(nama),instansi:instansi_id(nama)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const { data: kategoriList } = useQuery({
    queryKey: ["admin-kategori-options"],
    queryFn: async () => {
      const { data } = await supabase.from("kategori").select("id,nama").is("deleted_at", null).order("nama");
      return data ?? [];
    },
  });

  const { data: instansiList } = useQuery({
    queryKey: ["admin-instansi-options"],
    queryFn: async () => {
      const { data } = await supabase.from("instansi").select("id,nama").is("deleted_at", null).order("nama");
      return data ?? [];
    },
  });

  const resetForm = () => {
    setEditId(null);
    setForm({
      judul: "", slug: "", deskripsi: "", konten: "", status: "draft",
      kategori_id: "", instansi_id: "", dokumen_url: "", thumbnail_url: "",
      tanggal_mulai: "", tanggal_selesai: "",
    });
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const openEdit = (row: any) => {
    setEditId(row.id);
    setForm({
      judul: row.judul ?? "",
      slug: row.slug ?? "",
      deskripsi: row.deskripsi ?? "",
      konten: row.konten ?? "",
      status: row.status ?? "draft",
      kategori_id: row.kategori_id ?? "",
      instansi_id: row.instansi_id ?? "",
      dokumen_url: row.dokumen_url ?? "",
      thumbnail_url: row.thumbnail_url ?? "",
      tanggal_mulai: row.tanggal_mulai ? row.tanggal_mulai.slice(0, 10) : "",
      tanggal_selesai: row.tanggal_selesai ? row.tanggal_selesai.slice(0, 10) : "",
    });
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.judul) throw new Error("Judul wajib diisi");
      const payload: any = {
        judul: form.judul,
        slug: form.slug || form.judul.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80) + "-" + Math.random().toString(36).slice(2, 6),
        deskripsi: form.deskripsi || null,
        konten: form.konten || null,
        status: form.status,
        kategori_id: form.kategori_id || null,
        instansi_id: form.instansi_id || null,
        dokumen_url: form.dokumen_url || null,
        thumbnail_url: form.thumbnail_url || null,
        tanggal_mulai: form.tanggal_mulai || null,
        tanggal_selesai: form.tanggal_selesai || null,
      };
      if (editId) {
        const { error } = await supabase.from("kebijakan").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kebijakan").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Kebijakan diperbarui" : "Kebijakan dibuat");
      setOpen(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin-kebijakan"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Gagal menyimpan"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kebijakan").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kebijakan dihapus");
      qc.invalidateQueries({ queryKey: ["admin-kebijakan"] });
    },
  });

  return (
    <AdminShell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Kebijakan</h1>
          <p className="text-sm text-muted-foreground">Kelola seluruh kebijakan publik.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Kebijakan Baru</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Edit Kebijakan" : "Buat Kebijakan"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Judul *</Label><Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} /></div>
              <div><Label>Slug (auto jika kosong)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div><Label>Deskripsi</Label><Textarea rows={2} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} /></div>
              <div><Label>Konten</Label><Textarea rows={4} value={form.konten} onChange={(e) => setForm({ ...form, konten: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusList.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Select value={form.kategori_id || "none"} onValueChange={(v) => setForm({ ...form, kategori_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Tanpa kategori —</SelectItem>
                      {(kategoriList ?? []).map((k: any) => <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Instansi</Label>
                  <Select value={form.instansi_id || "none"} onValueChange={(v) => setForm({ ...form, instansi_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih instansi" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Tanpa instansi —</SelectItem>
                      {(instansiList ?? []).map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dokumen URL</Label><Input value={form.dokumen_url} onChange={(e) => setForm({ ...form, dokumen_url: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <Label>Thumbnail URL</Label><Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tanggal Mulai</Label><Input type="date" value={form.tanggal_mulai} onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })} /></div>
                <div><Label>Tanggal Selesai</Label><Input type="date" value={form.tanggal_selesai} onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Batal</Button>
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : (rows ?? []).length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Belum ada kebijakan.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Instansi</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rows ?? []).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.judul}</div>
                      <div className="text-xs text-muted-foreground">{r.slug}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor[r.status] ?? ""}>{statusList.find(s => s.value === r.status)?.label ?? r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.kategori?.nama ?? "—"}</TableCell>
                    <TableCell className="text-sm">{r.instansi?.nama ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" asChild>
                          <Link to="/kebijakan/$slug" params={{ slug: r.slug }} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
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
