import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Bookmark, History, LayoutDashboard, LogOut, User as UserIcon, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/bookmark", label: "Bookmark", icon: Bookmark },
  { to: "/dashboard/riwayat", label: "Riwayat Voting", icon: History },
  { to: "/dashboard/notifikasi", label: "Notifikasi", icon: Bell },
  { to: "/dashboard/profil", label: "Profil", icon: UserIcon },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { profile, user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="glass sticky top-0 z-40 border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
              <Vote className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>SuaraKita</span>
          </Link>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {(profile?.full_name ?? user?.email ?? "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          {items.map((i) => {
            const active = i.exact ? pathname === i.to : pathname.startsWith(i.to);
            return (
              <Link key={i.to} to={i.to} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                <i.icon className="h-4 w-4" />{i.label}
              </Link>
            );
          })}
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
