import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, FileText, BookOpen } from "lucide-react";
import { VotePanel } from "@/components/vote-panel";
import { KomentarSection } from "@/components/komentar-section";

export const Route = createFileRoute("/event/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — SuaraKita` }] }),
  component: EventDetail,
});

function EventDetail() {
  const { slug } = Route.useParams();

  const { data } = useQuery({
    queryKey: ["event-detail", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_voting")
        .select("*,instansi:instansi_id(nama),event_kebijakan(kebijakan:kebijakan_id(id,slug,judul,deskripsi,thumbnail_url)),artikel(*)")
        .eq("slug", slug)
        .maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="container mx-auto flex-1 px-4 py-12">Memuat...</div>
        <SiteFooter />
      </div>
    );
  }

  const isActive = data.status === "aktif";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <section className="border-b bg-gradient-card">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline" className={isActive ? "bg-success/15 text-success border-success/30" : ""}>
              {isActive ? "Voting Aktif" : data.status === "ditutup" ? "Voting Ditutup" : data.status}
            </Badge>
            {data.instansi && <Badge variant="secondary">{data.instansi.nama}</Badge>}
            {data.tanggal_selesai && (
              <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />Berakhir {new Date(data.tanggal_selesai).toLocaleDateString("id-ID")}</Badge>
            )}
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl text-balance">{data.judul}</h1>
          {data.deskripsi && <p className="mt-3 max-w-3xl text-lg text-muted-foreground">{data.deskripsi}</p>}
        </div>
      </section>

      <section className="container mx-auto grid flex-1 gap-8 px-4 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <VotePanel eventId={data.id} isActive={isActive} />

          {data.event_kebijakan && data.event_kebijakan.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Kebijakan yang dikonsultasikan</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.event_kebijakan.map((ek: any) => ek.kebijakan && (
                  <Link key={ek.kebijakan.id} to="/kebijakan/$slug" params={{ slug: ek.kebijakan.slug }}
                    className="flex gap-3 rounded-lg border p-3 transition hover:bg-accent">
                    {ek.kebijakan.thumbnail_url && (
                      <img src={ek.kebijakan.thumbnail_url} className="h-16 w-24 rounded object-cover" alt="" />
                    )}
                    <div>
                      <div className="font-medium">{ek.kebijakan.judul}</div>
                      {ek.kebijakan.deskripsi && <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{ek.kebijakan.deskripsi}</div>}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Artikel Terkait */}
          {data.artikel && data.artikel.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Artikel Terkait
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.artikel.map((a: any) => (
                  <div key={a.id} className="rounded-lg border p-4 bg-card">
                    <h4 className="font-semibold">{a.judul}</h4>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{a.konten}</p>
                    <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                      {a.penulis && <span>Penulis: {a.penulis}</span>}
                      {a.sumber && (
                        <a href={a.sumber} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          Baca Sumber
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <KomentarSection eventId={data.id} />
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Tentang Konsultasi</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium">{data.status}</span></div>
              {data.tanggal_mulai && <div className="flex justify-between"><span className="text-muted-foreground">Mulai</span><span>{new Date(data.tanggal_mulai).toLocaleDateString("id-ID")}</span></div>}
              {data.tanggal_selesai && <div className="flex justify-between"><span className="text-muted-foreground">Selesai</span><span>{new Date(data.tanggal_selesai).toLocaleDateString("id-ID")}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Dilihat</span><span>{data.view_count}</span></div>
            </CardContent>
          </Card>
        </aside>
      </section>
      <SiteFooter />
    </div>
  );
}
