import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export function BookmarkButton({ kebijakanId }: { kebijakanId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: bm } = useQuery({
    queryKey: ["bookmark", kebijakanId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("bookmark").select("id").eq("user_id", user!.id).eq("kebijakan_id", kebijakanId).maybeSingle();
      return data;
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (bm) {
        await supabase.from("bookmark").delete().eq("id", bm.id);
      } else {
        await supabase.from("bookmark").insert({ user_id: user.id, kebijakan_id: kebijakanId });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookmark", kebijakanId] });
      qc.invalidateQueries({ queryKey: ["user-bookmarks"] });
      toast.success(bm ? "Bookmark dihapus" : "Disimpan ke bookmark");
    },
    onError: () => navigate({ to: "/auth" }),
  });

  return (
    <Button variant={bm ? "default" : "outline"} onClick={() => toggle.mutate()} disabled={toggle.isPending}>
      {bm ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
      {bm ? "Tersimpan" : "Simpan"}
    </Button>
  );
}
