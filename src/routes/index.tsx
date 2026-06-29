import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, BarChart3, Clock, Flame, ShieldCheck, Sparkles, Users, Vote as VoteIcon } from "lucide-react";
import { KebijakanCard } from "@/components/kebijakan-card";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SuaraKita — Platform E-Participation Indonesia" },
      { name: "description", content: "Suarakan pendapatmu terhadap kebijakan pemerintah. Transparan, akuntabel, dan berbasis data." },
      { property: "og:title", content: "SuaraKita — Platform E-Participation Indonesia" },
      { property: "og:description", content: "Suarakan pendapatmu terhadap kebijakan pemerintah." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { data: stats } = useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const [users, instansi, kebijakan, voting] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("instansi").select("id", { count: "exact", head: true }),
        supabase.from("kebijakan").select("id", { count: "exact", head: true }),
        supabase.from("voting").select("id", { count: "exact", head: true }),
      ]);
      return {
        users: users.count ?? 0,
        instansi: instansi.count ?? 0,
        kebijakan: kebijakan.count ?? 0,
        voting: voting.count ?? 0,
      };
    },
  });

  const { data: trending } = useQuery({
    queryKey: ["landing-trending"],
    queryFn: async () => {
      const { data } = await supabase
        .from("kebijakan")
        .select("id,slug,judul,deskripsi,thumbnail_url,status,view_count,kategori:kategori_id(nama,warna),instansi:instansi_id(nama)")
        .neq("status", "draft")
        .order("view_count", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const { data: aktif } = useQuery({
    queryKey: ["landing-aktif"],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_voting")
        .select("id,slug,judul,deskripsi,thumbnail_url,status,tanggal_selesai,instansi:instansi_id(nama)")
        .eq("status", "aktif")
        .order("tanggal_selesai", { ascending: true })
        .limit(4);
      return data ?? [];
    },
  });

  const { data: kategoriList } = useQuery({
    queryKey: ["landing-kategori"],
    queryFn: async () => {
      const { data } = await supabase.from("kategori").select("*").is("deleted_at", null);
      return data ?? [];
    },
  });

  const { data: faqs } = useQuery({
    queryKey: ["landing-faq"],
    queryFn: async () => {
      const { data } = await supabase.from("faq").select("*").eq("is_active", true).order("urutan");
      return data ?? [];
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-hero" />
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            >
              <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/5 text-primary">
                <Sparkles className="mr-1 h-3 w-3" /> Platform Resmi Konsultasi Publik
              </Badge>
              <h1 className="font-display text-balance text-4xl font-bold leading-tight md:text-6xl">
                Suarakan Pendapatmu untuk{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">Indonesia</span>
              </h1>
              <p className="mt-6 text-balance text-lg text-muted-foreground md:text-xl">
                Berpartisipasi dalam pengambilan keputusan publik secara transparan, akuntabel, dan berbasis data. Satu suaramu, satu langkah perubahan.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" asChild className="shadow-glow">
                  <Link to="/event">Mulai Memberi Suara <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/kebijakan">Jelajahi Kebijakan</Link>
                </Button>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Warga Aktif", value: stats?.users ?? 0, icon: Users },
                { label: "Instansi", value: stats?.instansi ?? 0, icon: ShieldCheck },
                { label: "Kebijakan", value: stats?.kebijakan ?? 0, icon: BarChart3 },
                { label: "Suara Terkumpul", value: stats?.voting ?? 0, icon: VoteIcon },
              ].map((s) => (
                <Card key={s.label} className="glass border-border/60">
                  <CardContent className="p-4 text-center">
                    <s.icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                    <div className="font-display text-2xl font-bold">{s.value.toLocaleString("id-ID")}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VOTING AKTIF */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <Clock className="h-4 w-4" /> Voting Aktif
            </div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Berikan suaramu sekarang</h2>
          </div>
          <Button variant="ghost" asChild><Link to="/event">Lihat semua <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        {aktif && aktif.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {aktif.map((e) => (
              <Link key={e.id} to="/event/$slug" params={{ slug: e.slug }}>
                <Card className="h-full bg-gradient-card border-primary/20 transition-all hover:shadow-glow hover:-translate-y-0.5">
                  <CardContent className="p-5 space-y-3">
                    <Badge className="bg-success/15 text-success border-success/30" variant="outline">Aktif</Badge>
                    <h3 className="font-semibold leading-tight line-clamp-2">{e.judul}</h3>
                    {e.deskripsi && <p className="text-sm text-muted-foreground line-clamp-2">{e.deskripsi}</p>}
                    {e.instansi && <p className="text-xs text-muted-foreground">{e.instansi.nama}</p>}
                    {e.tanggal_selesai && (
                      <div className="flex items-center gap-1 pt-2 text-xs text-warning-foreground">
                        <Clock className="h-3 w-3" />
                        Berakhir {new Date(e.tanggal_selesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed"><CardContent className="p-10 text-center text-muted-foreground">Belum ada voting aktif. Periksa kembali nanti.</CardContent></Card>
        )}
      </section>

      {/* TRENDING */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                <Flame className="h-4 w-4" /> Sedang Trending
              </div>
              <h2 className="font-display text-2xl font-bold md:text-3xl">Kebijakan paling banyak dibahas</h2>
            </div>
            <Button variant="ghost" asChild><Link to="/kebijakan">Lihat semua <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
          {trending && trending.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {trending.map((k) => <KebijakanCard key={k.id} k={k as never} />)}
            </div>
          ) : (
            <Card className="border-dashed"><CardContent className="p-10 text-center text-muted-foreground">Belum ada kebijakan dipublikasikan.</CardContent></Card>
          )}
        </div>
      </section>

      {/* KATEGORI */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Telusuri berdasarkan kategori</h2>
          <p className="mt-2 text-muted-foreground">Pilih bidang kebijakan yang paling penting bagimu</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {kategoriList?.map((k) => (
            <Link key={k.id} to="/kebijakan" search={{ kategori: k.slug }}>
              <Card className="group h-full transition-all hover:shadow-elegant hover:-translate-y-0.5">
                <CardContent className="p-5 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-sm"
                    style={{ backgroundColor: k.warna ?? "#DC2626" }}
                  >
                    <VoteIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{k.nama}</div>
                    {k.deskripsi && <div className="text-xs text-muted-foreground line-clamp-1">{k.deskripsi}</div>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-8 text-center">
            <h2 className="font-display text-2xl font-bold md:text-3xl">Pertanyaan yang Sering Diajukan</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs?.map((f) => (
              <AccordionItem key={f.id} value={f.id} className="rounded-lg border bg-card px-4">
                <AccordionTrigger className="text-left font-semibold">{f.pertanyaan}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.jawaban}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
