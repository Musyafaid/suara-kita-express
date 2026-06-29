import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, MessageSquare, TrendingUp, Users, Vote } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/_admin/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — SuaraKita" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const qc = useQueryClient();

  const { data: kpi } = useQuery({
    queryKey: ["admin-kpi"],
    queryFn: async () => {
      const ct = (t: string, q?: (b: any) => any) => {
        let b = supabase.from(t).select("id", { count: "exact", head: true });
        if (q) b = q(b);
        return b;
      };
      const [users, ins, keb, ev, va, vd, kom, vot] = await Promise.all([
        ct("profiles"), ct("instansi"), ct("kebijakan"), ct("event_voting"),
        ct("event_voting", (b) => b.eq("status", "aktif")),
        ct("event_voting", (b) => b.eq("status", "ditutup")),
        ct("komentar"), ct("voting"),
      ]);
      return {
        users: users.count ?? 0, ins: ins.count ?? 0, keb: keb.count ?? 0, ev: ev.count ?? 0,
        va: va.count ?? 0, vd: vd.count ?? 0, kom: kom.count ?? 0, vot: vot.count ?? 0,
      };
    },
  });

  const { data: votingTimeline } = useQuery({
    queryKey: ["admin-votes-timeline"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase.from("voting").select("created_at,pilihan").gte("created_at", since).limit(5000);
      const buckets: Record<string, { date: string; setuju: number; netral: number; tidak_setuju: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        buckets[d] = { date: d.slice(5), setuju: 0, netral: 0, tidak_setuju: 0 };
      }
      (data ?? []).forEach((v: any) => {
        const k = v.created_at.slice(0, 10);
        if (buckets[k]) (buckets[k] as any)[v.pilihan]++;
      });
      return Object.values(buckets);
    },
  });

  const { data: topKategori } = useQuery({
    queryKey: ["admin-top-kategori"],
    queryFn: async () => {
      const { data } = await supabase.from("kebijakan").select("kategori:kategori_id(nama,warna)").limit(1000);
      const tally: Record<string, { name: string; value: number; color: string }> = {};
      (data ?? []).forEach((k: any) => {
        const n = k.kategori?.nama; if (!n) return;
        tally[n] = tally[n] || { name: n, value: 0, color: k.kategori?.warna || "#E11D2A" };
        tally[n].value++;
      });
      return Object.values(tally).sort((a, b) => b.value - a.value).slice(0, 6);
    },
  });

  const { data: topInstansi } = useQuery({
    queryKey: ["admin-top-instansi"],
    queryFn: async () => {
      const { data } = await supabase.from("kebijakan").select("instansi:instansi_id(nama)").limit(2000);
      const tally: Record<string, number> = {};
      (data ?? []).forEach((k: any) => { const n = k.instansi?.nama; if (n) tally[n] = (tally[n] || 0) + 1; });
      return Object.entries(tally).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
    },
  });

  useEffect(() => {
    const ch = supabase.channel("admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "voting" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-kpi"] });
        qc.invalidateQueries({ queryKey: ["admin-votes-timeline"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const cards = useMemo(() => [
    { label: "Total Pengguna", value: kpi?.users ?? 0, icon: Users, color: "text-primary" },
    { label: "Total Instansi", value: kpi?.ins ?? 0, icon: Building2, color: "text-secondary" },
    { label: "Total Kebijakan", value: kpi?.keb ?? 0, icon: FileText, color: "text-primary" },
    { label: "Total Event", value: kpi?.ev ?? 0, icon: Vote, color: "text-secondary" },
    { label: "Voting Aktif", value: kpi?.va ?? 0, icon: TrendingUp, color: "text-success" },
    { label: "Voting Ditutup", value: kpi?.vd ?? 0, icon: Vote, color: "text-muted-foreground" },
    { label: "Total Komentar", value: kpi?.kom ?? 0, icon: MessageSquare, color: "text-primary" },
    { label: "Total Suara", value: kpi?.vot ?? 0, icon: Vote, color: "text-success" },
  ], [kpi]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Statistik nasional terkini. Diperbarui realtime.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.label} className="bg-gradient-card">
              <CardContent className="p-5">
                <c.icon className={`mb-2 h-5 w-5 ${c.color}`} />
                <div className="font-display text-2xl font-bold">{c.value.toLocaleString("id-ID")}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Voting 30 Hari Terakhir</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={votingTimeline ?? []}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.5}/><stop offset="100%" stopOpacity={0} stopColor="hsl(var(--success))"/></linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.5}/><stop offset="100%" stopOpacity={0} stopColor="hsl(var(--warning))"/></linearGradient>
                    <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.5}/><stop offset="100%" stopOpacity={0} stopColor="hsl(var(--destructive))"/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Legend />
                  <Area type="monotone" dataKey="setuju" stroke="hsl(var(--success))" fill="url(#g1)" />
                  <Area type="monotone" dataKey="netral" stroke="hsl(var(--warning))" fill="url(#g2)" />
                  <Area type="monotone" dataKey="tidak_setuju" stroke="hsl(var(--destructive))" fill="url(#g3)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Kategori Terpopuler</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topKategori ?? []} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85}>
                    {(topKategori ?? []).map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Instansi Teraktif</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInstansi ?? []} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" fontSize={11} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={140} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
