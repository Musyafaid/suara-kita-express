import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

interface Props { eventId?: string; kebijakanId?: string }

export function KomentarSection({ eventId, kebijakanId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const filterKey = eventId ? ["komentar-event", eventId] : ["komentar-kebijakan", kebijakanId];

  const { data: items } = useQuery({
    queryKey: filterKey,
    queryFn: async () => {
      let q = supabase
        .from("komentar")
        .select("id,konten,created_at,sentiment,status,user_id,profiles:user_id(full_name,avatar_url)")
        .eq("status", "approved")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (eventId) q = q.eq("event_id", eventId);
      if (kebijakanId) q = q.eq("kebijakan_id", kebijakanId);
      const { data } = await q;
      return data ?? [];
    },
  });

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel(`komentar:${eventId ?? kebijakanId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "komentar" }, () => {
        qc.invalidateQueries({ queryKey: filterKey });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [eventId, kebijakanId, qc]);

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (text.trim().length < 3) throw new Error("min");
      const payload: any = { user_id: user.id, konten: text.trim(), status: "approved" };
      if (eventId) payload.event_id = eventId;
      if (kebijakanId) payload.kebijakan_id = kebijakanId;
      const { error } = await supabase.from("komentar").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { setText(""); toast.success("Komentar dikirim"); qc.invalidateQueries({ queryKey: filterKey }); },
    onError: (e: any) => toast.error(e.message === "min" ? "Komentar terlalu pendek" : "Gagal mengirim"),
  });

  const sentimentColor = (s: string | null) => {
    if (s === "positif") return "bg-success/10 text-success border-success/30";
    if (s === "negatif") return "bg-destructive/10 text-destructive border-destructive/30";
    return "bg-muted text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Diskusi Publik</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user ? (
          <div className="space-y-2">
            <Textarea
              placeholder="Tuliskan pendapat Anda..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              rows={3}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{text.length}/1000</span>
              <Button size="sm" onClick={() => submit.mutate()} disabled={submit.isPending || text.trim().length < 3}>
                Kirim Komentar
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-4 text-center text-sm">
            <Link to="/auth" className="font-medium text-primary hover:underline">Masuk</Link>
            <span className="text-muted-foreground"> untuk ikut berdiskusi.</span>
          </div>
        )}

        <div className="space-y-3">
          {(items ?? []).map((k: any) => (
            <div key={k.id} className="flex gap-3 rounded-lg border bg-card p-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {(k.profiles?.full_name ?? "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{k.profiles?.full_name ?? "Warga"}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{new Date(k.created_at).toLocaleDateString("id-ID")}</span>
                  {k.sentiment && (
                    <Badge variant="outline" className={`ml-auto ${sentimentColor(k.sentiment)}`}>
                      {k.sentiment === "positif" ? "😊" : k.sentiment === "negatif" ? "☹" : "😐"} {k.sentiment}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap">{k.konten}</p>
              </div>
            </div>
          ))}
          {(!items || items.length === 0) && (
            <p className="text-center text-sm text-muted-foreground py-6">Belum ada komentar. Jadilah yang pertama!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
