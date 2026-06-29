import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, Loader as Loader2 } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/pengaturan")({
  head: () => ({ meta: [{ title: "Pengaturan — SuaraKita Admin" }] }),
  component: AdminPengaturan,
});

type Setting = { key: string; value: unknown };

function AdminPengaturan() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*");
      return (data ?? []) as Setting[];
    },
  });

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach((s) => {
        map[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
      });
      setForm(map);
    }
  }, [settings]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const entries = Object.entries(form).map(([key, val]) => ({
      key,
      value: val,
    }));
    for (const entry of entries) {
      const { error } = await supabase.from("settings").upsert({ key: entry.key, value: entry.value });
      if (error) { toast.error(error.message); setLoading(false); return; }
    }
    setLoading(false);
    toast.success("Pengaturan disimpan");
    qc.invalidateQueries({ queryKey: ["admin-settings"] });
  };

  const setVal = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <AdminShell>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero">
          <Settings className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Pengaturan</h1>
          <p className="text-sm text-muted-foreground">Konfigurasi platform SuaraKita.</p>
        </div>
      </div>

      <form onSubmit={save} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Identitas Aplikasi</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nama Aplikasi</Label>
                <Input value={form["app_name"] ?? "SuaraKita"} onChange={(e) => setVal("app_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Tagline</Label>
                <Input value={form["app_tagline"] ?? "Platform E-Participation Indonesia"} onChange={(e) => setVal("app_tagline", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Fitur</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Voting Dibuka (otomatis aktifkan event)</Label>
                <Switch checked={form["auto_open_voting"] === "true"} onCheckedChange={(v) => setVal("auto_open_voting", String(v))} />
              </div>
              <div className="space-y-1.5">
                <Label>Komentar Moderasi (pending sebelum tampil)</Label>
                <Switch checked={form["moderate_comments"] !== "false"} onCheckedChange={(v) => setVal("moderate_comments", String(v))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Pengaturan
          </Button>
        </div>
      </form>
    </AdminShell>
  );
}
