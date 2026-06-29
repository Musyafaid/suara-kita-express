import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookmarkButton } from "@/components/bookmark-button";
import { Bookmark, Calendar, ExternalLink, FileText, Vote as VoteIcon } from "lucide-react";
import { KomentarSection } from "@/components/komentar-section";

const statusFlow = [
  { key: "draft", label: "Draft" },
  { key: "published", label: "Dipublikasikan" },
  { key: "voting_aktif", label: "Voting Aktif" },
  { key: "voting_ditutup", label: "Voting Ditutup" },
  { key: "ditinjau", label: "Ditinjau" },
  { key: "ditindaklanjuti", label: "Ditindaklanjuti" },
  { key: "selesai", label: "Selesai" },
];

export const Route = createFileRoute("/kebijakan/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — SuaraKita` }] }),
  component: KebijakanDetail,
});

function KebijakanDetail() {
  const { slug } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["kebijakan-detail", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("kebijakan")
        .select("*,kategori:kategori_id(*),instansi:instansi_id(*),event_kebijakan(event:event_id(id,slug,judul,status,tanggal_selesai))")
        .eq("slug", slug)
        .maybeSingle();
      if (!data) throw notFound();
      // increment view (best-effort)
      supabase.from("kebijakan").update({ view_count: (data.view_count ?? 0) + 1 }).eq("id", data.id).then(() => {});
      return data;
    },
  });

  useEffect(() => { window.scrollTo({ top: 0 }); }, [slug]);

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="container mx-auto flex-1 px-4 py-12">Memuat...</div>
        <SiteFooter />
      </div>
    );
  }

  const currentIdx = statusFlow.findIndex((s) => s.key === data.status);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <section className="border-b bg-gradient-card">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {data.kategori && <Badge variant="secondary">{data.kategori.nama}</Badge>}
            {data.instansi && <Badge variant="outline">{data.instansi.nama}</Badge>}
            <Badge className="bg-primary/15 text-primary border-primary/30" variant="outline">
              {statusFlow.find((s) => s.key === data.status)?.label ?? data.status}
            </Badge>
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl text-balance">{data.judul}</h1>
          {data.deskripsi && <p className="mt-3 max-w-3xl text-lg text-muted-foreground">{data.deskripsi}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            <BookmarkButton kebijakanId={data.id} />
            {data.dokumen_url && (
              <Button variant="outline" asChild>
                <a href={data.dokumen_url} target="_blank" rel="noreferrer">
                  <FileText className="mr-2 h-4 w-4" /> Lihat Dokumen
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto grid flex-1 gap-8 px-4 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {data.thumbnail_url && (
            <img src={data.thumbnail_url} alt={data.judul} className="w-full rounded-xl border shadow-elegant" />
          )}
          {data.konten && (
            <Card>
              <CardHeader><CardTitle>Tentang Kebijakan</CardTitle></CardHeader>
              <CardContent className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground/90">
                {data.konten}
              </CardContent>
            </Card>
          )}

          {/* Event voting terkait */}
          {data.event_kebijakan && data.event_kebijakan.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Konsultasi Voting</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.event_kebijakan.map((ek: any) => ek.event && (
                  <Link key={ek.event.id} to="/event/$slug" params={{ slug: ek.event.slug }}
                    className="flex items-center justify-between rounded-lg border p-3 transition hover:bg-accent">
                    <div>
                      <div className="font-medium">{ek.event.judul}</div>
                      <div className="text-xs text-muted-foreground">Status: {ek.event.status}</div>
                    </div>
                    <Button size="sm" variant="ghost"><VoteIcon className="mr-1 h-4 w-4" /> Beri Suara</Button>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <KomentarSection kebijakanId={data.id} />
        </div>

        <aside className="space-y-6">
          {/* Timeline transparansi */}
          <Card>
            <CardHeader><CardTitle>Timeline Transparansi</CardTitle></CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {statusFlow.slice(1).map((s, i) => {
                  const idx = i + 1;
                  const active = idx <= currentIdx;
                  return (
                    <li key={s.key} className="flex items-start gap-3">
                      <div className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${active ? "bg-primary" : "bg-muted"}`} />
                      <div>
                        <div className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</div>
                        {idx === currentIdx && <div className="text-xs text-primary">Tahap saat ini</div>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Informasi</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Dilihat</span><span>{data.view_count}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dibagikan</span><span>{data.share_count}</span></div>
              {data.tanggal_mulai && <div className="flex justify-between"><span className="text-muted-foreground">Mulai</span><span>{new Date(data.tanggal_mulai).toLocaleDateString("id-ID")}</span></div>}
              {data.tanggal_selesai && <div className="flex justify-between"><span className="text-muted-foreground">Selesai</span><span>{new Date(data.tanggal_selesai).toLocaleDateString("id-ID")}</span></div>}
            </CardContent>
          </Card>
        </aside>
      </section>
      <SiteFooter />
    </div>
  );
}
