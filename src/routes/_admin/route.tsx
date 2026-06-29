import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    const ok = (roles ?? []).some((r: any) => r.role === "super_admin" || r.role === "admin_instansi");
    if (!ok) throw redirect({ to: "/dashboard" });
    return { user: u.user };
  },
  component: () => <Outlet />,
});
