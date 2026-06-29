import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { ChartBar as BarChart3, Users, Vote, MessageSquare, FileText, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/analitik")({
  head: () => ({ meta: [{ title: "Analitik — SuaraKita Admin" }] }),
  component: AdminAnalitik,
});

function AdminAnalitik() {
  const { data: kpi, isLoading: kpiLoading } = useQuery({
    queryKey: ["analitik-kpi"],
    queryFn: async () => {
      const [users, keb, ev, vot, kom] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("kebijakan").select("id", { count: "exact", head: true }),
        supabase.from("event_voting").select("id", { count: "exact", head: true }),
        supabase.from("voting").select("id", { count: "exact", head: true }),
        supabase.from("komentar").select("id", { count: "exact", head: true }),
      ]);
      return { users: users.count ?? 0, keb: keb.count ?? 0, ev: ev.count ?? 0, vot: vot.count ?? 0, kom: kom.count ?? 0 };
    },
  });

  const { data: voteDist } = useQuery({
    queryKey: ["analitik-vote-dist"],
    queryFn: async () => {
      const { data } = await supabase.from("voting").select("pilihan").limit(5000);
      const tally: Record<string, number> = {};
      (data ?? []).forEach((v: any) => { tally[v.pilihan] = (tally[v.pilihan] || 0) + 1; });
      return Object.entries(tally).map(([name, value]) => ({ name: name === "setuju" ? "Setuju" : name === "netral" ? "Netral" : "Tidak Setuju", value }));
    },
  });

  const { data: voteTimeline } = useQuery({
    queryKey: ["analitik-vote-timeline"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase.from("voting").select("created_at,pilihan").gte("created_at", since).limit(5000);
      const buckets: Record<string, { date: string; setuju: number; netral: number; tidak_setuju: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        buckets[d] = { date: d.slice(5), setuju: 0, netral: 0, tidak_setuju: 0 };
      }
      (data ?? []).forEach((v: any) => { const k = v.created_at.slice(0, 10); if (buckets[k]) (buckets[k] as any)[v.pilihan]++; });
      return Object.values(buckets);
    },
  });

  const { data: topEvents } = useQuery({
    queryKey: ["analitik-top-events"],
    queryFn: async () => {
      const { data } = await supabase.from("event_voting").select("id,judul,view_count").is("deleted_at", null).order("view_count", { ascending: false }).limit(10);
      return (data ?? []).map((e: any) => ({ name: e.judul.slice(0, 30), value: e.view_count }));
    },
  });

  const { data: sentimentDist } = useQuery({
    queryKey: ["analitik-sentiment"],
    queryFn: async () => {
      const { data } = await supabase.from("komentar").select("sentiment").not("sentiment", "is", null).limit(5000);
      const tally: Record<string, number> = {};
      (data ?? []).forEach((k: any) => { tally[k.sentiment] = (tally[k.sentiment] || 0) + 1; });
      return Object.entries(tally).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
    },
  });

  const pieColors = ["hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

  const cards = [
    { label: "Pengguna", value: kpi?.users ?? 0, icon: Users },
    { label: "Kebijakan", value: kpi?.keb ?? 0, icon: FileText },
    { label: "Event", value: kpi?.ev ?? 0, icon: TrendingUp },
    { label: "Suara", value: kpi?.vot ?? 0, icon: Vote },
    { label: "Komentar", value: kpi?.kom ?? 0, icon: MessageSquare },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Analitik</h1>
          <p className="text-muted-foreground">Wawasan data platform secara mendalam.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {kpiLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
            : cards.map((c) => (
                <Card key={c.label} className="bg-gradient-card">
                  <CardContent className="p-5">
                    <c.icon className="mb-2 h-5 w-5 text-primary" />
                    <div className="font-display text-2xl font-bold">{c.value.toLocaleString("id-ID")}</div>
                    <div className="text-xs text-muted-foreground">{c.label}</div>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Distribusi Suara</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={voteDist ?? []} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
                    {(voteDist ?? []).map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Distribusi Sentimen Komentar</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentDist ?? []} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
                    {(sentimentDist ?? []).map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Tren Suara 30 Hari</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={voteTimeline ?? []}>
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

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Event Paling Banyak Dilihat</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEvents ?? []} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" fontSize={11} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={200} />
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
