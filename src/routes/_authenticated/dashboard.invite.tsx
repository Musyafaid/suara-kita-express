import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/invite")({
  head: () => ({ meta: [{ title: "Tukar Kode Admin — SuaraKita" }] }),
  component: RedeemPage,
});

const ERR_MAP: Record<string, string> = {
  invalid_code: "Kode tidak ditemukan.",
  expired: "Kode sudah kedaluwarsa.",
  already_used: "Kode sudah pernah dipakai.",
  revoked: "Kode telah dicabut oleh admin.",
  not_authenticated: "Anda harus masuk terlebih dahulu.",
};

function RedeemPage() {
  const { refresh, isAdmin } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("redeem_admin_invite", { _code: code.trim().toUpperCase() });
    setLoading(false);
    if (error) {
      const msg = error.message.match(/[a-z_]+$/)?.[0] ?? "";
      toast.error(ERR_MAP[msg] ?? error.message);
      return;
    }
    toast.success("Berhasil! Anda kini memiliki akses admin.");
    setCode("");
    await refresh();
    setTimeout(() => { window.location.href = "/admin"; }, 800);
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero">
            <KeyRound className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Tukar Kode Undangan</h1>
            <p className="text-sm text-muted-foreground">Masukkan kode dari admin untuk mendapatkan akses panel admin.</p>
          </div>
        </div>

        {isAdmin && (
          <Card className="mb-4 border-green-500/30 bg-green-500/5">
            <CardContent className="flex items-center gap-3 p-4 text-sm">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div>Akun Anda sudah memiliki akses admin. Anda tetap bisa menukar kode tambahan jika diperlukan.</div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kode Undangan</CardTitle>
            <CardDescription>Kode terdiri dari huruf & angka, tidak peka huruf besar/kecil.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Kode</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="contoh: ABCD23XYZ9"
                  className="font-mono tracking-widest uppercase"
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tukar Kode
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
