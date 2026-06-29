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

export const Route = createFileRoute("/_admin/admin/kategori")({
  head: () => ({ meta: [{ title: "Kategori — SuaraKita Admin" }] }),
  component: AdminKategori,
});

function AdminKategori() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nama: "", slug: "", deskripsi: "", warna: "#DC2626", ikon: "" });

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-kategori"],
    queryFn: async () => {
      const { data } = await supabase.from("kategori").select("*").is("deleted_at", null).order("nama");
      return data ?? [];
    },
  });

  const resetForm = () => {
    setEditId(null);
    setForm({ nama: "", slug: "", deskripsi: "", warna: "#DC2626", ikon: "" });
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const openEdit = (row: any) => {
    setEditId(row.id);
    setForm({
      nama: row.nama ?? "",
      slug: row.slug ?? "",
      deskripsi: row.deskripsi ?? "",
      warna: row.warna ?? "#DC2626",
      ikon: row.ikon ?? "",
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
        warna: form.warna || "#DC2626",
        ikon: form.ikon || null,
      };
      if (editId) {
        const { error } = await supabase.from("kategori").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kategori").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Kategori diperbarui" : "Kategori dibuat");
      setOpen(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin-kategori"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Gagal menyimpan"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kategori").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kategori dihapus");
      qc.invalidateQueries({ queryKey: ["admin-kategori"] });
    },
  });

  return (
    <AdminShell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Kategori</h1>
          <p className="text-sm text-muted-foreground">Kelola kategori kebijakan.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Kategori Baru</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Edit Kategori" : "Buat Kategori"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nama *</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
              <div><Label>Slug (auto jika kosong)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div><Label>Deskripsi</Label><Textarea rows={2} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Warna</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.warna} onChange={(e) => setForm({ ...form, warna: e.target.value })} className="h-9 w-14 rounded border" />
                    <Input value={form.warna} onChange={(e) => setForm({ ...form, warna: e.target.value })} />
                  </div>
                </div>
                <div><Label>Ikon (Lucide name)</Label><Input value={form.ikon} onChange={(e) => setForm({ ...form, ikon: e.target.value })} placeholder="Vote" /></div>
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
            <div className="p-12 text-center text-muted-foreground">Belum ada kategori.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Nama</TableHead><TableHead>Slug</TableHead><TableHead>Warna</TableHead><TableHead className="w-24">Aksi</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {(rows ?? []).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: r.warna }} />
                        <span className="font-medium">{r.nama}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.slug}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{r.warna}</TableCell>
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
