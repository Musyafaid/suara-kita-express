import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Vote } from "lucide-react";

const searchSchema = z.object({
  tab: z.enum(["login", "register", "forgot"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Masuk — SuaraKita" }] }),
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [tab, setTab] = useState(search.tab ?? "login");

  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error(res.error.message);
    else if (!res.redirected) navigate({ to: search.redirect ?? "/dashboard" });
  };

  // LOGIN
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Selamat datang kembali!"); navigate({ to: search.redirect ?? "/dashboard" }); }
  };

  // REGISTER
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: String(fd.get("full_name")) },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Akun berhasil dibuat!"); navigate({ to: "/dashboard" }); }
  };

  // FORGOT
  const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(String(fd.get("email")), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Link reset password telah dikirim ke email Anda.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
      <Link to="/" className="absolute left-4 top-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>
      <Card className="relative w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-hero shadow-glow">
            <Vote className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">SuaraKita</CardTitle>
          <CardDescription>Platform e-participation resmi Indonesia</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as never)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="register">Daftar</TabsTrigger>
              <TabsTrigger value="forgot">Lupa</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" name="email" type="email" required placeholder="anda@email.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-pass">Kata sandi</Label>
                  <Input id="login-pass" name="password" type="password" required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Masuk
                </Button>
              </form>
              <Separator label="atau" />
              <Button variant="outline" className="w-full" onClick={handleGoogle}>
                <GoogleIcon className="mr-2 h-4 w-4" /> Lanjutkan dengan Google
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name">Nama Lengkap</Label>
                  <Input id="reg-name" name="full_name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" name="email" type="email" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-pass">Kata sandi</Label>
                  <Input id="reg-pass" name="password" type="password" required minLength={8} />
                  <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Daftar
                </Button>
              </form>
              <Separator label="atau" />
              <Button variant="outline" className="w-full" onClick={handleGoogle}>
                <GoogleIcon className="mr-2 h-4 w-4" /> Daftar dengan Google
              </Button>
            </TabsContent>

            <TabsContent value="forgot" className="space-y-4">
              <form onSubmit={handleForgot} className="space-y-3">
                <p className="text-sm text-muted-foreground">Masukkan email Anda. Kami akan kirim link reset.</p>
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input id="forgot-email" name="email" type="email" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kirim Link Reset
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function Separator({ label }: { label: string }) {
  return (
    <div className="relative my-2">
      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="#EA4335" d="M12 5.04c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.42 1.7 14.93.5 12 .5 7.4.5 3.43 3.14 1.5 7l3.66 2.84C6.07 6.96 8.78 5.04 12 5.04z" />
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.51h6.47c-.28 1.4-1.07 2.59-2.27 3.39l3.55 2.76c2.08-1.92 3.74-4.74 3.74-8.39z" />
      <path fill="#FBBC05" d="M5.16 14.16a7.04 7.04 0 010-4.32L1.5 7C.55 8.84 0 10.86 0 13s.55 4.16 1.5 6l3.66-2.84z" />
      <path fill="#34A853" d="M12 23.5c3.24 0 5.96-1.07 7.95-2.91l-3.55-2.76c-1 .67-2.29 1.07-4.4 1.07-3.22 0-5.93-1.92-6.84-4.84L1.5 17c1.93 3.86 5.9 6.5 10.5 6.5z" />
    </svg>
  );
}
