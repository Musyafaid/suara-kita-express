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
import { ExternalLink, Pencil, Plus, Sparkles, Trash2, FileText } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/event")({
  head: () => ({ meta: [{ title: "Event Voting — SuaraKita Admin" }] }),
  component: AdminEvent,
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

function AdminEvent() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [artikelOpen, setArtikelOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [artikelForm, setArtikelForm] = useState({ judul: "", konten: "", sumber: "", penulis: "", urutan: 0 });

  const [form, setForm] = useState({
    judul: "",
    deskripsi: "",
    kebijakan_id: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
    status: "aktif" as "draft" | "aktif" | "ditutup",
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_voting")
        .select("id,judul,slug,status,is_auto_generated,tanggal_mulai,tanggal_selesai,created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const { data: kebijakanList } = useQuery({
    queryKey: ["admin-kebijakan-options"],
    queryFn: async () => {
      const { data } = await supabase
        .from("kebijakan")
        .select("id,judul")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const { data: artikelList } = useQuery({
    queryKey: ["admin-artikel", selectedEventId],
    enabled: !!selectedEventId,
    queryFn: async () => {
      const { data } = await supabase
        .from("artikel")
        .select("*")
        .eq("event_id", selectedEventId!)
        .order("urutan", { ascending: true });
      return data ?? [];
    },
  });

  const resetForm = () => {
    setEditId(null);
    setForm({ judul: "", deskripsi: "", kebijakan_id: "", tanggal_mulai: "", tanggal_selesai: "", status: "aktif" });
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const openEdit = (row: any) => {
    setEditId(row.id);
    setForm({
      judul: row.judul ?? "",
      deskripsi: row.deskripsi ?? "",
      kebijakan_id: "",
      tanggal_mulai: row.tanggal_mulai ? new Date(row.tanggal_mulai).toISOString().slice(0, 16) : "",
      tanggal_selesai: row.tanggal_selesai ? new Date(row.tanggal_selesai).toISOString().slice(0, 16) : "",
      status: row.status ?? "aktif",
    });
    setOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.judul) throw new Error("Judul wajib diisi");
      const slug = slugify(form.judul) + "-" + Math.random().toString(36).slice(2, 6);
      const payload: any = {
        judul: form.judul,
        slug: editId ? undefined : slug,
        deskripsi: form.deskripsi || null,
        status: form.status,
        tanggal_mulai: form.tanggal_mulai ? new Date(form.tanggal_mulai).toISOString() : null,
        tanggal_selesai: form.tanggal_selesai ? new Date(form.tanggal_selesai).toISOString() : null,
      };
      if (editId) {
        const { error } = await supabase.from("event_voting").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { data: ev, error } = await supabase
          .from("event_voting")
          .insert({ ...payload, is_auto_generated: false })
          .select("id")
          .single();
        if (error) throw error;
        if (form.kebijakan_id) {
          await supabase.from("event_kebijakan").insert({ event_id: ev.id, kebijakan_id: form.kebijakan_id });
        }
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Event diperbarui" : "Event voting dibuat");
      setOpen(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin-events"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Gagal menyimpan"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_voting").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event dihapus");
      qc.invalidateQueries({ queryKey: ["admin-events"] });
    },
  });

  const saveArtikel = useMutation({
    mutationFn: async () => {
      if (!selectedEventId || !artikelForm.judul || !artikelForm.konten) throw new Error("Judul & konten wajib diisi");
      const { error } = await supabase.from("artikel").insert({
        event_id: selectedEventId,
        judul: artikelForm.judul,
        konten: artikelForm.konten,
        sumber: artikelForm.sumber || null,
        penulis: artikelForm.penulis || null,
        urutan: artikelForm.urutan,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Artikel ditambahkan");
      setArtikelForm({ judul: "", konten: "", sumber: "", penulis: "", urutan: 0 });
      qc.invalidateQueries({ queryKey: ["admin-artikel", selectedEventId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Gagal menyimpan artikel"),
  });

  const deleteArtikel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("artikel").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Artikel dihapus");
      qc.invalidateQueries({ queryKey: ["admin-artikel", selectedEventId] });
    },
  });

  const openArtikel = (eventId: string) => {
    setSelectedEventId(eventId);
    setArtikelOpen(true);
  };

  return (
    <AdminShell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Event Voting</h1>
          <p className="text-sm text-muted-foreground">Kelola event voting dan artikel penjelasan terkait.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Event Baru</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Edit Event" : "Buat Event Voting"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Judul *</Label><Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} /></div>
              <div><Label>Deskripsi</Label><Textarea rows={3} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} /></div>
              {!editId && (
                <div>
                  <Label>Kebijakan Terkait (opsional)</Label>
                  <Select value={form.kebijakan_id} onValueChange={(v) => setForm({ ...form, kebijakan_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih kebijakan" /></SelectTrigger>
                    <SelectContent>
                      {(kebijakanList ?? []).map((k: any) => (
                        <SelectItem key={k.id} value={k.id}>{k.judul}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Mulai</Label><Input type="datetime-local" value={form.tanggal_mulai} onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })} /></div>
                <div><Label>Selesai</Label><Input type="datetime-local" value={form.tanggal_selesai} onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })} /></div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="ditutup">Ditutup</SelectItem>
                  </SelectContent>
                </Select>
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
          ) : (events ?? []).length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Belum ada event voting.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead>Selesai</TableHead>
                  <TableHead className="w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(events ?? []).map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.judul}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={e.status === "aktif" ? "bg-success/15 text-success border-success/30" : ""}>{e.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {e.is_auto_generated ? (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30"><Sparkles className="mr-1 h-3 w-3" />Auto</Badge>
                      ) : (
                        <Badge variant="secondary">Manual</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.tanggal_selesai ? new Date(e.tanggal_selesai).toLocaleDateString("id-ID") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" asChild>
                          <Link to="/event/$slug" params={{ slug: e.slug }} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => openArtikel(e.id)} title="Artikel"><FileText className="h-4 w-4 text-primary" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Artikel Dialog */}
      <Dialog open={artikelOpen} onOpenChange={setArtikelOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Artikel Terkait</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Tambah Artikel</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Judul Artikel *</Label><Input value={artikelForm.judul} onChange={(e) => setArtikelForm({ ...artikelForm, judul: e.target.value })} /></div>
                <div><Label>Konten *</Label><Textarea rows={4} value={artikelForm.konten} onChange={(e) => setArtikelForm({ ...artikelForm, konten: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Sumber URL</Label><Input value={artikelForm.sumber} onChange={(e) => setArtikelForm({ ...artikelForm, sumber: e.target.value })} placeholder="https://..." /></div>
                  <div><Label>Penulis</Label><Input value={artikelForm.penulis} onChange={(e) => setArtikelForm({ ...artikelForm, penulis: e.target.value })} /></div>
                </div>
                <div><Label>Urutan</Label><Input type="number" value={artikelForm.urutan} onChange={(e) => setArtikelForm({ ...artikelForm, urutan: Number(e.target.value) })} /></div>
                <Button onClick={() => saveArtikel.mutate()} disabled={saveArtikel.isPending}>Tambah Artikel</Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {(artikelList ?? []).length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4">Belum ada artikel untuk event ini.</div>
              ) : (
                (artikelList ?? []).map((a: any) => (
                  <Card key={a.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-medium">{a.judul}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2 mt-1">{a.konten}</div>
                          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                            {a.penulis && <span>Penulis: {a.penulis}</span>}
                            {a.sumber && <a href={a.sumber} target="_blank" rel="noreferrer" className="text-primary hover:underline">Sumber</a>}
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => deleteArtikel.mutate(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
