import { createFileRoute, Link, useSearch, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { KebijakanCard } from "@/components/kebijakan-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const searchSchema = z.object({
  q: z.string().optional(),
  kategori: z.string().optional(),
  status: z.string().optional(),
});

export const Route = createFileRoute("/kebijakan/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Kebijakan — SuaraKita" },
      { name: "description", content: "Telusuri seluruh kebijakan publik yang sedang dikonsultasikan." },
    ],
  }),
  component: KebijakanIndex,
});

function KebijakanIndex() {
  const search = useSearch({ from: "/kebijakan/" });
  const navigate = useNavigate();

  const { data: kategoriList } = useQuery({
    queryKey: ["kategori"],
    queryFn: async () => (await supabase.from("kategori").select("*").is("deleted_at", null)).data ?? [],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["kebijakan-list", search],
    queryFn: async () => {
      let q = supabase
        .from("kebijakan")
        .select("id,slug,judul,deskripsi,thumbnail_url,status,view_count,kategori:kategori_id(slug,nama,warna),instansi:instansi_id(nama)")
        .neq("status", "draft")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (search.q) q = q.ilike("judul", `%${search.q}%`);
      if (search.status) q = q.eq("status", search.status as never);
      const { data: rows } = await q.limit(60);
      const filtered = search.kategori ? (rows ?? []).filter((r: any) => r.kategori?.slug === search.kategori) : rows ?? [];
      return filtered;
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <section className="border-b bg-gradient-card">
        <div className="container mx-auto px-4 py-12">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Kebijakan Publik</h1>
          <p className="mt-2 text-muted-foreground">Telusuri kebijakan yang sedang dikonsultasikan dan tindak lanjutnya.</p>
          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari kebijakan..."
                className="pl-9"
                defaultValue={search.q ?? ""}
                onChange={(e) => navigate({ to: "/kebijakan", search: (s) => ({ ...s, q: e.target.value || undefined }) })}
              />
            </div>
            <Select value={search.kategori ?? "all"} onValueChange={(v) => navigate({ to: "/kebijakan", search: (s) => ({ ...s, kategori: v === "all" ? undefined : v }) })}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {kategoriList?.map((k) => <SelectItem key={k.id} value={k.slug}>{k.nama}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={search.status ?? "all"} onValueChange={(v) => navigate({ to: "/kebijakan", search: (s) => ({ ...s, status: v === "all" ? undefined : v }) })}>
              <SelectTrigger className="w-full md:w-52"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="published">Dipublikasikan</SelectItem>
                <SelectItem value="voting_aktif">Voting Aktif</SelectItem>
                <SelectItem value="voting_ditutup">Voting Ditutup</SelectItem>
                <SelectItem value="ditindaklanjuti">Ditindaklanjuti</SelectItem>
                <SelectItem value="selesai">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="container mx-auto flex-1 px-4 py-10">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.map((k: any) => <KebijakanCard key={k.id} k={k} />)}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Badge variant="outline" className="mb-3">Kosong</Badge>
              <h3 className="font-semibold">Belum ada kebijakan yang cocok</h3>
              <p className="mt-1 text-sm text-muted-foreground">Coba ubah filter atau kata kunci pencarian.</p>
            </CardContent>
          </Card>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
