import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { DashboardShell } from "@/components/dashboard-shell";
import { KebijakanCard } from "@/components/kebijakan-card";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/dashboard/bookmark")({
  head: () => ({ meta: [{ title: "Bookmark — SuaraKita" }] }),
  component: BookmarkPage,
});

function BookmarkPage() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["user-bookmarks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("bookmark")
        .select("kebijakan:kebijakan_id(id,slug,judul,deskripsi,thumbnail_url,status,view_count,kategori:kategori_id(nama,warna),instansi:instansi_id(nama))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []).map((r: any) => r.kebijakan).filter(Boolean);
    },
  });
  return (
    <DashboardShell>
      <h1 className="mb-4 font-display text-2xl font-bold">Bookmark Saya</h1>
      {data && data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((k: any) => <KebijakanCard key={k.id} k={k} />)}
        </div>
      ) : (
        <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground">Belum ada bookmark.</CardContent></Card>
      )}
    </DashboardShell>
  );
}
