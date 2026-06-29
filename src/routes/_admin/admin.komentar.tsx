import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CircleCheck as CheckCircle2, MessageSquare, Trash2, Circle as XCircle } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/komentar")({
  head: () => ({ meta: [{ title: "Komentar — SuaraKita Admin" }] }),
  component: AdminKomentar,
});

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  approved: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

const sentimentColors: Record<string, string> = {
  positif: "bg-success/10 text-success",
  netral: "bg-muted text-muted-foreground",
  negatif: "bg-destructive/10 text-destructive",
};

function AdminKomentar() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [replying, setReplying] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-komentar", filter],
    queryFn: async () => {
      let q = supabase
        .from("komentar")
        .select("*,profiles:user_id(full_name,avatar_url),event:event_id(judul,slug),kebijakan:kebijakan_id(judul,slug)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter !== "all") q = q.eq("status", filter);
      const { data } = await q;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("komentar").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status komentar diperbarui");
      qc.invalidateQueries({ queryKey: ["admin-komentar"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("komentar").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Komentar dihapus");
      qc.invalidateQueries({ queryKey: ["admin-komentar"] });
    },
  });

  const replyMut = useMutation({
    mutationFn: async ({ parentId, text }: { parentId: string; text: string }) => {
      const parent = (rows ?? []).find((r: any) => r.id === parentId);
      if (!parent) throw new Error("Parent not found");
      const { error } = await supabase.from("komentar").insert({
        konten: text,
        parent_id: parentId,
        event_id: parent.event_id,
        kebijakan_id: parent.kebijakan_id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        status: "approved",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Balasan dikirim");
      setReplying(null);
      setReplyText("");
      qc.invalidateQueries({ queryKey: ["admin-komentar"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Gagal mengirim balasan"),
  });

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Komentar</h1>
          <p className="text-sm text-muted-foreground">Moderasi diskusi publik.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : (rows ?? []).length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Belum ada komentar.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Konten</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sentimen</TableHead>
                  <TableHead className="w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rows ?? []).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{r.profiles?.full_name ?? "Warga"}</div>
                      <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("id-ID")}</div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-sm line-clamp-3">{r.konten}</div>
                      {replying === r.id && (
                        <div className="mt-2 space-y-2">
                          <Textarea rows={2} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Tulis balasan..." />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => replyMut.mutate({ parentId: r.id, text: replyText })} disabled={replyMut.isPending || !replyText.trim()}>Kirim</Button>
                            <Button size="sm" variant="outline" onClick={() => { setReplying(null); setReplyText(""); }}>Batal</Button>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.event && <div className="text-primary">Event: {r.event.judul}</div>}
                      {r.kebijakan && <div className="text-primary">Kebijakan: {r.kebijakan.judul}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[r.status] ?? ""}>{r.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.sentiment && <Badge variant="outline" className={sentimentColors[r.sentiment] ?? ""}>{r.sentiment}</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {r.status !== "approved" && (
                          <Button size="icon" variant="ghost" onClick={() => updateStatus.mutate({ id: r.id, status: "approved" })} title="Approve"><CheckCircle2 className="h-4 w-4 text-success" /></Button>
                        )}
                        {r.status !== "rejected" && (
                          <Button size="icon" variant="ghost" onClick={() => updateStatus.mutate({ id: r.id, status: "rejected" })} title="Reject"><XCircle className="h-4 w-4 text-destructive" /></Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => { setReplying(r.id); setReplyText(""); }} title="Balas"><MessageSquare className="h-4 w-4" /></Button>
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
