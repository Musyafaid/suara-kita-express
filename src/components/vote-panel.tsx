import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ThumbsDown, ThumbsUp, Vote as VoteIcon, MinusCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from "recharts";

const choices = [
  { key: "setuju", label: "Setuju", icon: ThumbsUp, color: "var(--color-success)" },
  { key: "netral", label: "Netral", icon: MinusCircle, color: "var(--color-warning)" },
  { key: "tidak_setuju", label: "Tidak Setuju", icon: ThumbsDown, color: "var(--color-destructive)" },
] as const;

type Choice = (typeof choices)[number]["key"];

export function VotePanel({ eventId, isActive }: { eventId: string; isActive: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [pilihan, setPilihan] = useState<Choice | null>(null);
  const [alasan, setAlasan] = useState("");

  const { data: counts } = useQuery({
    queryKey: ["vote-counts", eventId],
    queryFn: async () => {
      const { data } = await supabase.from("voting").select("pilihan").eq("event_id", eventId);
      const c = { setuju: 0, netral: 0, tidak_setuju: 0 };
      (data ?? []).forEach((v: any) => { c[v.pilihan as Choice]++; });
      return c;
    },
  });

  const { data: myVote } = useQuery({
    queryKey: ["my-vote", eventId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("voting").select("*").eq("event_id", eventId).eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  // Realtime — refresh on any vote insert
  useEffect(() => {
    const ch = supabase.channel(`vote:${eventId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "voting", filter: `event_id=eq.${eventId}` }, () => {
        qc.invalidateQueries({ queryKey: ["vote-counts", eventId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [eventId, qc]);

  const total = (counts?.setuju ?? 0) + (counts?.netral ?? 0) + (counts?.tidak_setuju ?? 0);

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (!pilihan) throw new Error("pilih");
      const { error } = await supabase.from("voting").insert({
        event_id: eventId, user_id: user.id, pilihan, alasan: alasan.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Suara Anda telah tercatat. Terima kasih!");
      qc.invalidateQueries({ queryKey: ["vote-counts", eventId] });
      qc.invalidateQueries({ queryKey: ["my-vote", eventId, user?.id] });
    },
    onError: (e: any) => {
      if (e?.code === "23505" || /duplicate/i.test(e?.message ?? "")) {
        toast.error("Anda sudah memberikan suara untuk event ini.");
        qc.invalidateQueries({ queryKey: ["my-vote", eventId, user?.id] });
      } else if (e.message === "auth") {
        toast.error("Silakan masuk terlebih dahulu.");
      } else if (e.message === "pilih") {
        toast.error("Pilih salah satu opsi.");
      } else {
        toast.error(e.message ?? "Gagal mengirim suara");
      }
    },
  });

  const pieData = useMemo(() => choices.map((c) => ({
    name: c.label, value: counts?.[c.key] ?? 0, color: c.color,
  })), [counts]);

  return (
    <Card className="bg-gradient-card border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <VoteIcon className="h-5 w-5 text-primary" /> Beri Suara Anda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Result chart - always visible (live) */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {choices.map((c) => {
              const v = counts?.[c.key] ?? 0;
              const pct = total ? Math.round((v / total) * 100) : 0;
              return (
                <div key={c.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5"><c.icon className="h-3.5 w-3.5" style={{ color: c.color }} />{c.label}</span>
                    <span className="font-mono text-xs">{v} ({pct}%)</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
            <div className="pt-1 text-xs text-muted-foreground">Total {total} suara · diperbarui realtime</div>
          </div>
        </div>

        {/* Vote action */}
        {!user ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-sm">Masuk untuk memberikan suara Anda.</p>
            <Button asChild className="mt-3"><Link to="/auth">Masuk</Link></Button>
          </div>
        ) : myVote ? (
          <div className="rounded-lg border border-success/30 bg-success/5 p-4">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Anda sudah memberikan suara.</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Pilihan Anda: <Badge variant="outline">{choices.find(c => c.key === myVote.pilihan)?.label}</Badge>
            </p>
            {myVote.alasan && <p className="mt-2 text-sm italic">"{myVote.alasan}"</p>}
          </div>
        ) : !isActive ? (
          <div className="rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            Voting sudah ditutup.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {choices.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setPilihan(c.key)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    pilihan === c.key ? "border-primary bg-primary/5 shadow-elegant" : "border-border hover:border-primary/40"
                  }`}
                >
                  <c.icon className="h-6 w-6" style={{ color: c.color }} />
                  <span className="font-medium">{c.label}</span>
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Alasan (opsional)"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <Button className="w-full" onClick={() => submit.mutate()} disabled={submit.isPending || !pilihan}>
              Kirim Suara
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
