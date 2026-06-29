import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Sparkles, Trash2 } from "lucide-react";

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

  const createMut = useMutation({
    mutationFn: async () => {
      if (!form.judul) throw new Error("Judul wajib diisi");
      const slug = slugify(form.judul) + "-" + Math.random().toString(36).slice(2, 6);
      const { data: ev, error } = await supabase
        .from("event_voting")
        .insert({
          judul: form.judul,
          slug,
          deskripsi: form.deskripsi || null,
          status: form.status,
          tanggal_mulai: form.tanggal_mulai ? new Date(form.tanggal_mulai).toISOString() : null,
          tanggal_selesai: form.tanggal_selesai ? new Date(form.tanggal_selesai).toISOString() : null,
          is_auto_generated: false,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (form.kebijakan_id) {
        await supabase.from("event_kebijakan").insert({ event_id: ev.id, kebijakan_id: form.kebijakan_id });
      }
    },
    onSuccess: () => {
      toast.success("Event voting dibuat");
      setOpen(false);
      setForm({ judul: "", deskripsi: "", kebijakan_id: "", tanggal_mulai: "", tanggal_selesai: "", status: "aktif" });
      qc.invalidateQueries({ queryKey: ["admin-events"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Gagal membuat event"),
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

  return (
    <AdminShell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Event Voting</h1>
          <p className="text-sm text-muted-foreground">Kebijakan baru otomatis membuat event voting. Tambahkan event manual jika perlu.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1" /> Event Baru</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Buat Event Voting</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Judul *</Label><Input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} /></div>
              <div><Label>Deskripsi</Label><Textarea rows={3} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} /></div>
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
              <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>Simpan</Button>
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
                  <TableHead className="w-12"></TableHead>
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
                      <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(e.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
