import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MessageSquare, Vote as VoteIcon } from "lucide-react";

export interface KebijakanCardData {
  id: string;
  slug: string;
  judul: string;
  deskripsi: string | null;
  thumbnail_url: string | null;
  status: string;
  view_count: number;
  kategori?: { nama: string; warna: string | null } | null;
  instansi?: { nama: string } | null;
  vote_count?: number;
  comment_count?: number;
}

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-info/15 text-info border-info/30",
  voting_aktif: "bg-success/15 text-success border-success/30",
  voting_ditutup: "bg-muted text-muted-foreground",
  ditinjau: "bg-warning/15 text-warning-foreground border-warning/30",
  ditindaklanjuti: "bg-primary/15 text-primary border-primary/30",
  selesai: "bg-success/15 text-success border-success/30",
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  published: "Dipublikasikan",
  voting_aktif: "Voting Aktif",
  voting_ditutup: "Voting Ditutup",
  ditinjau: "Sedang Ditinjau",
  ditindaklanjuti: "Ditindaklanjuti",
  selesai: "Selesai",
};

export function KebijakanCard({ k, footer }: { k: KebijakanCardData; footer?: ReactNode }) {
  return (
    <Link to="/kebijakan/$slug" params={{ slug: k.slug }} className="group block">
      <Card className="overflow-hidden h-full bg-gradient-card border-border/60 transition-all hover:shadow-elegant hover:-translate-y-0.5">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {k.thumbnail_url ? (
            <img src={k.thumbnail_url} alt={k.judul} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-hero">
              <VoteIcon className="h-10 w-10 text-primary-foreground/70" />
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <Badge variant="outline" className={`${statusColor[k.status] ?? ""} backdrop-blur`}>
              {statusLabel[k.status] ?? k.status}
            </Badge>
            {k.kategori && (
              <Badge variant="secondary" className="backdrop-blur">{k.kategori.nama}</Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-display font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {k.judul}
          </h3>
          {k.deskripsi && <p className="text-sm text-muted-foreground line-clamp-2">{k.deskripsi}</p>}
          {k.instansi && <p className="text-xs text-muted-foreground">{k.instansi.nama}</p>}
          <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
            {k.vote_count !== undefined && (
              <span className="inline-flex items-center gap-1"><VoteIcon className="h-3 w-3" />{k.vote_count}</span>
            )}
            {k.comment_count !== undefined && (
              <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" />{k.comment_count}</span>
            )}
            <span className="inline-flex items-center gap-1 ml-auto"><Calendar className="h-3 w-3" />{k.view_count} view</span>
          </div>
          {footer}
        </CardContent>
      </Card>
    </Link>
  );
}
