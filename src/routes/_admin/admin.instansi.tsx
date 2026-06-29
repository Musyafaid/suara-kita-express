import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/instansi")({
  head: () => ({ meta: [{ title: "Instansi — SuaraKita Admin" }] }),
  component: AdminInstansi,
});

function AdminInstansi() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nama: "", slug: "", deskripsi: "", logo_url: "", website: "", email: "" });

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-instansi"],
    queryFn: async () => {
      const { data } = await supabase.from("instansi").select("*").is("deleted_at", null).order("nama");
      return data ?? [];
    },
  });

  const resetForm = () => {
    setEditId(null);
    setForm({ nama: "", slug: "", deskripsi: "", logo_url: "", website: "", email: "" });
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const openEdit = (row: any) => {
    setEditId(row.id);
    setForm({
      nama: row.nama ?? "",
      slug: row.slug ?? "",
      deskripsi: row.deskripsi ?? "",
      logo_url: row.logo_url ?? "",
      website: row.website ?? "",
      email: row.email ?? "",
    });
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.nama) throw new Error("Nama wajib diisi");
      const payload = {
        nama: form.nama,
        slug: form.slug || form.nama.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 40),
        deskripsi: form.deskripsi || null,
        logo_url: form.logo_url || null,
        website: form.website || null,
        email: form.email || null,
      };
      if (editId) {
        const { error } = await supabase.from("instansi").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("instansi").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Instansi diperbarui" : "Instansi dibuat");
      setOpen(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin-instansi"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Gagal menyimpan"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instansi").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Instansi dihapus");
      qc.invalidateQueries({ queryKey: ["admin-instansi"] });
    },
  });

  return (
    <AdminShell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Instansi</h1>
          <p className="text-sm text-muted-foreground">Kelola instansi pemerintah.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Instansi Baru</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Edit Instansi" : "Buat Instansi"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nama *</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
              <div><Label>Slug (auto jika kosong)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div><Label>Deskripsi</Label><Textarea rows={2} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} /></div>
              <div><Label>Logo URL</Label><Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@domain.go.id" /></div>
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
            <div className="p-12 text-center text-muted-foreground">Belum ada instansi.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Nama</TableHead><TableHead>Slug</TableHead><TableHead>Website</TableHead><TableHead className="w-24">Aksi</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {(rows ?? []).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.nama}</div>
                      {r.deskripsi && <div className="text-xs text-muted-foreground line-clamp-1">{r.deskripsi}</div>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.slug}</TableCell>
                    <TableCell className="text-sm">{r.website ? <a href={r.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{r.website}</a> : "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
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
