import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  BarChart3, Building2, FileText, Image as ImageIcon, LayoutDashboard, LogOut, MessageSquare,
  Settings, Shield, Tag, Users, Vote,
} from "lucide-react";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/kebijakan", label: "Kebijakan", icon: FileText },
  { to: "/admin/event", label: "Event Voting", icon: Vote },
  { to: "/admin/kategori", label: "Kategori", icon: Tag },
  { to: "/admin/instansi", label: "Instansi", icon: Building2 },
  { to: "/admin/komentar", label: "Komentar", icon: MessageSquare },
  { to: "/admin/analitik", label: "Analitik", icon: BarChart3 },
  { to: "/admin/user", label: "Pengguna", icon: Users },
  { to: "/admin/banner", label: "Banner", icon: ImageIcon },
  { to: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="grid lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r bg-card lg:flex flex-col h-screen sticky top-0">
          <Link to="/" className="flex items-center gap-2 border-b px-5 py-4 font-display font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>SuaraKita Admin</span>
          </Link>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {items.map((i) => {
              const active = i.exact ? pathname === i.to : pathname.startsWith(i.to);
              return (
                <Link key={i.to} to={i.to} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                  <i.icon className="h-4 w-4" />{i.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-3 flex items-center gap-2">
            <Avatar className="h-8 w-8"><AvatarImage src={profile?.avatar_url ?? undefined} /><AvatarFallback className="bg-primary text-primary-foreground text-xs">{(profile?.full_name ?? "A").slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
            <div className="flex-1 text-xs"><div className="font-medium truncate">{profile?.full_name ?? "Admin"}</div><div className="text-muted-foreground">Admin</div></div>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </aside>
        <main className="min-w-0 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
