import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

function make(path: string, title: string) {
  return createFileRoute(path as any)({
    head: () => ({ meta: [{ title: `${title} — SuaraKita Admin` }] }),
    component: () => (
      <AdminShell>
        <h1 className="mb-4 font-display text-2xl font-bold">{title}</h1>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
            <Construction className="h-10 w-10 text-primary/60" />
            <div>Modul <strong>{title}</strong> sedang dipersiapkan.</div>
            <div className="text-xs">CRUD lengkap akan tersedia segera.</div>
          </CardContent>
        </Card>
      </AdminShell>
    ),
  });
}

export { make };
