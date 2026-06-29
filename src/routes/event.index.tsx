import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Vote as VoteIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/event/")({
  head: () => ({
    meta: [
      { title: "Voting Konsultasi Publik — SuaraKita" },
      { name: "description", content: "Daftar konsultasi voting aktif dan terbaru di Indonesia." },
    ],
  }),
  component: EventIndex,
});

function EventIndex() {
  const { data, isLoading } = useQuery({
    queryKey: ["event-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_voting")
        .select("id,slug,judul,deskripsi,thumbnail_url,status,tanggal_selesai,instansi:instansi_id(nama)")
        .neq("status", "draft")
        .is("deleted_at", null)
        .order("status", { ascending: true })
        .order("tanggal_selesai", { ascending: true })
        .limit(60);
      return data ?? [];
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <section className="border-b bg-gradient-card">
        <div className="container mx-auto px-4 py-12">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Voting Konsultasi Publik</h1>
          <p className="mt-2 text-muted-foreground">Berikan suaramu untuk masa depan Indonesia.</p>
        </div>
      </section>

      <section className="container mx-auto flex-1 px-4 py-10">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map((e: any) => (
              <Link key={e.id} to="/event/$slug" params={{ slug: e.slug }}>
                <Card className="h-full bg-gradient-card transition-all hover:shadow-elegant hover:-translate-y-0.5">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={e.status === "aktif" ? "bg-success/15 text-success border-success/30" : ""}>
                        {e.status === "aktif" ? "Aktif" : e.status === "ditutup" ? "Ditutup" : e.status}
                      </Badge>
                      {e.instansi && <Badge variant="secondary">{e.instansi.nama}</Badge>}
                    </div>
                    <h3 className="font-display font-semibold leading-tight line-clamp-2">{e.judul}</h3>
                    {e.deskripsi && <p className="text-sm text-muted-foreground line-clamp-3">{e.deskripsi}</p>}
                    {e.tanggal_selesai && (
                      <div className="flex items-center gap-1 pt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Berakhir {new Date(e.tanggal_selesai).toLocaleDateString("id-ID")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed"><CardContent className="p-12 text-center text-muted-foreground">Belum ada event voting.</CardContent></Card>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
