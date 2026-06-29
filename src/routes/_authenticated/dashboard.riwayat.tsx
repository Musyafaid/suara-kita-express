import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard/riwayat")({
  head: () => ({ meta: [{ title: "Riwayat Voting — SuaraKita" }] }),
  component: RiwayatPage,
});

const label: Record<string, string> = { setuju: "Setuju", netral: "Netral", tidak_setuju: "Tidak Setuju" };

function RiwayatPage() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["riwayat", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase
      .from("voting")
      .select("id,pilihan,alasan,created_at,event:event_id(slug,judul,status)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })).data ?? [],
  });

  return (
    <DashboardShell>
      <h1 className="mb-4 font-display text-2xl font-bold">Riwayat Voting</h1>
      <div className="space-y-3">
        {(data ?? []).map((v: any) => (
          <Card key={v.id}>
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div>
                {v.event && <Link to="/event/$slug" params={{ slug: v.event.slug }} className="font-medium hover:underline">{v.event.judul}</Link>}
                <div className="text-xs text-muted-foreground mt-0.5">{new Date(v.created_at).toLocaleString("id-ID")}</div>
                {v.alasan && <p className="text-sm italic mt-1">"{v.alasan}"</p>}
              </div>
              <Badge variant="outline">{label[v.pilihan]}</Badge>
            </CardContent>
          </Card>
        ))}
        {(!data || data.length === 0) && (
          <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground">Belum ada riwayat voting.</CardContent></Card>
        )}
      </div>
    </DashboardShell>
  );
}
