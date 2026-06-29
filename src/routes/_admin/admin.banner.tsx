import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/banner")({
  head: () => ({ meta: [{ title: "Banner — SuaraKita Admin" }] }),
  component: AdminBanner,
});

function AdminBanner() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ judul: "", subjudul: "", image_url: "", link: "", urutan: 0, is_active: true });

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-banner"],
    queryFn: async () => {
      const { data } = await supabase.from("banner").select("*").is("deleted_at", null).order("urutan", { ascending: true });
      return data ?? [];
    },
  });

  const resetForm = () => {
    setEditId(null);
    setForm({ judul: "", subjudul: "", image_url: "", link: "", urutan: 0, is_active: true });
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const openEdit = (row: any) => {
    setEditId(row.id);
    setForm({
      judul: row.judul ?? "",
      subjudul: row.subjudul ?? "",
      image_url: row.image_url ?? "",
      link: row.link ?? "",
      urutan: row.urutan ?? 0,
      is_active: row.is_active ?? true,
    });
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.judul) throw new Error("Judul wajib diisi");
      const payload: any = {
        judul: form.judul,
        subjudul: form.subjudul || null,
        image_url: form.image_url || null,
        link: form.link || null,
        urutan: form.urutan,
        is_active: form.is_active,
      };
      if (editId) {
        const { error } = await supabase.from("banner").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banner").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Banner diperbarui" : "Banner dibuat");
      setOpen(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin-banner"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Gagal menyimpan"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banner").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner dihapus");
      qc.invalidateQueries({ queryKey: ["admin-banner"] });
    },
  });

  return (
    <AdminShell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Banner</h1>
          <p className="text-sm text-muted-foreground">Kelola banner promosi di beranda.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Banner Baru</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Edit Banner" : "Buat Banner"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Judul *</Label><Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} /></div>
              <div><Label>Subjudul</Label><Input value={form.subjudul} onChange={(e) => setForm({ ...form, subjudul: e.target.value })} /></div>
              <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
              <div><Label>Link</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Urutan</Label><Input type="number" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) })} /></div>
                <div className="flex items-end gap-2 pb-1">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <Label>Aktif</Label>
                </div>
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
            <div className="p-12 text-center text-muted-foreground">Belum ada banner.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Judul</TableHead><TableHead>Urutan</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Aksi</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {(rows ?? []).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {r.image_url ? <img src={r.image_url} alt="" className="h-8 w-8 rounded object-cover" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                        <div>
                          <div className="font-medium">{r.judul}</div>
                          {r.subjudul && <div className="text-xs text-muted-foreground">{r.subjudul}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{r.urutan}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${r.is_active ? "text-success" : "text-muted-foreground"}`}>{r.is_active ? "Aktif" : "Nonaktif"}</span>
                    </TableCell>
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
