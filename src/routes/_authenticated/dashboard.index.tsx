import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bookmark, History, MessageSquare, Vote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — SuaraKita" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, profile } = useAuth();
  const { data: stats } = useQuery({
    queryKey: ["dash-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [v, b, k, n] = await Promise.all([
        supabase.from("voting").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("bookmark").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("komentar").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("notifikasi").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_read", false),
      ]);
      return { v: v.count ?? 0, b: b.count ?? 0, k: k.count ?? 0, n: n.count ?? 0 };
    },
  });

  const { data: trending } = useQuery({
    queryKey: ["dash-trending"],
    queryFn: async () => (await supabase.from("kebijakan").select("id,slug,judul,view_count,status").neq("status","draft").order("view_count",{ascending:false}).limit(5)).data ?? [],
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Halo, {profile?.full_name ?? "Warga"} 👋</h1>
          <p className="text-muted-foreground">Selamat datang kembali di SuaraKita.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Suara Diberikan", value: stats?.v ?? 0, icon: Vote },
            { label: "Bookmark", value: stats?.b ?? 0, icon: Bookmark },
            { label: "Komentar", value: stats?.k ?? 0, icon: MessageSquare },
            { label: "Notifikasi Baru", value: stats?.n ?? 0, icon: History },
          ].map((s) => (
            <Card key={s.label} className="bg-gradient-card">
              <CardContent className="p-5">
                <s.icon className="mb-2 h-5 w-5 text-primary" />
                <div className="font-display text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader><CardTitle>Sedang Trending</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(trending ?? []).map((k: any) => (
              <Link key={k.id} to="/kebijakan/$slug" params={{ slug: k.slug }} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent">
                <span className="font-medium">{k.judul}</span>
                <Badge variant="secondary">{k.view_count} view</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
