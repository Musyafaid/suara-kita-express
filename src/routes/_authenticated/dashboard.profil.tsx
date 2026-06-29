import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/profil")({
  head: () => ({ meta: [{ title: "Profil — SuaraKita" }] }),
  component: ProfilPage,
});

function ProfilPage() {
  const { user, profile, refresh } = useAuth();
  const [full_name, setFn] = useState("");
  const [username, setU] = useState("");
  const [bio, setBio] = useState("");
  const [kota, setKota] = useState("");
  const [provinsi, setProv] = useState("");

  useEffect(() => {
    if (profile) {
      setFn(profile.full_name ?? "");
      setU(profile.username ?? "");
      setBio((profile as any).bio ?? "");
      setKota((profile as any).kota ?? "");
      setProv((profile as any).provinsi ?? "");
    }
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name, username, bio, kota, provinsi }).eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("Profil diperbarui"); refresh(); }
  };

  return (
    <DashboardShell>
      <Card>
        <CardHeader><CardTitle>Profil Saya</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Nama Lengkap</Label><Input value={full_name} onChange={(e) => setFn(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Username</Label><Input value={username} onChange={(e) => setU(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
              <div className="space-y-1.5"><Label>Provinsi</Label><Input value={provinsi} onChange={(e) => setProv(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Kota</Label><Input value={kota} onChange={(e) => setKota(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5"><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} /></div>
            <Button type="submit">Simpan</Button>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
