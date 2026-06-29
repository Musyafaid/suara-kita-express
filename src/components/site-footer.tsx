import { Link } from "@tanstack/react-router";
import { Vote } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-display font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
                <Vote className="h-4 w-4 text-primary-foreground" />
              </div>
              <span>SuaraKita</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Platform e-participation resmi Indonesia untuk konsultasi publik yang transparan dan akuntabel.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/kebijakan" className="hover:text-foreground">Kebijakan</Link></li>
              <li><Link to="/event" className="hover:text-foreground">Voting Aktif</Link></li>
              <li><Link to="/tentang" className="hover:text-foreground">Tentang</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Bantuan</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/tentang" hash="faq" className="hover:text-foreground">FAQ</Link></li>
              <li><a href="mailto:halo@suarakita.id" className="hover:text-foreground">Kontak</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="opacity-60">Kebijakan Privasi</span></li>
              <li><span className="opacity-60">Syarat Layanan</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SuaraKita — Platform E-Participation Indonesia.
        </div>
      </div>
    </footer>
  );
}
