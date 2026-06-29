import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — SuaraKita" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password"));
    const confirm = String(fd.get("confirm"));
    if (password !== confirm) { toast.error("Password tidak cocok"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Password berhasil diperbarui"); navigate({ to: "/dashboard" }); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Masukkan password baru Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">Password baru</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Konfirmasi password</Label>
              <Input id="confirm" name="confirm" type="password" required minLength={8} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
