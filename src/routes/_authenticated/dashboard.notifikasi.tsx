import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/notifikasi")({
  head: () => ({ meta: [{ title: "Notifikasi — SuaraKita" }] }),
  component: NotifPage,
});

function NotifPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notif", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("notifikasi").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("notif-self").on("postgres_changes", { event: "*", schema: "public", table: "notifikasi", filter: `user_id=eq.${user.id}` }, () => qc.invalidateQueries({ queryKey: ["notif", user.id] })).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  useEffect(() => {
    if (!user) return;
    supabase.from("notifikasi").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false).then(() => {});
  }, [user]);

  return (
    <DashboardShell>
      <h1 className="mb-4 font-display text-2xl font-bold">Notifikasi</h1>
      <div className="space-y-2">
        {(data ?? []).map((n: any) => (
          <Card key={n.id} className={!n.is_read ? "border-primary/40" : ""}>
            <CardContent className="p-4 flex gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="font-medium">{n.title}</div>
                {n.body && <div className="text-sm text-muted-foreground">{n.body}</div>}
                <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("id-ID")}</div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!data || data.length === 0) && <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground">Belum ada notifikasi.</CardContent></Card>}
      </div>
    </DashboardShell>
  );
}
