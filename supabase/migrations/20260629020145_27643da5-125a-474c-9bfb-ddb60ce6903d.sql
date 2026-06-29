
-- =============== ENUMS ===============
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin_instansi', 'masyarakat');
CREATE TYPE public.kebijakan_status AS ENUM ('draft','published','voting_aktif','voting_ditutup','ditinjau','ditindaklanjuti','selesai');
CREATE TYPE public.event_status AS ENUM ('draft','aktif','ditutup','dibatalkan');
CREATE TYPE public.vote_choice AS ENUM ('setuju','netral','tidak_setuju');
CREATE TYPE public.komentar_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.sentiment_label AS ENUM ('positif','netral','negatif');
CREATE TYPE public.notif_type AS ENUM ('voting_baru','voting_hampir_berakhir','hasil_voting','komentar_dibalas','pengumuman');

-- =============== HELPERS ===============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.slugify(value TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(regexp_replace(regexp_replace(coalesce(value,''), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
$$;

-- =============== PROFILES ===============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  instansi_id UUID,
  provinsi TEXT,
  kota TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============== USER ROLES (separate table per security guidelines) ===============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  instansi_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','admin_instansi'));
$$;

CREATE OR REPLACE FUNCTION public.user_instansi(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT instansi_id FROM public.user_roles WHERE user_id = _user_id AND role = 'admin_instansi' LIMIT 1;
$$;

CREATE POLICY "user_roles self read" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "user_roles super admin manage" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- =============== AUTO PROFILE + DEFAULT ROLE ON SIGNUP ===============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'masyarakat') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============== INSTANSI ===============
CREATE TABLE public.instansi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  deskripsi TEXT,
  logo_url TEXT,
  website TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
GRANT SELECT ON public.instansi TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.instansi TO authenticated;
GRANT ALL ON public.instansi TO service_role;
ALTER TABLE public.instansi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "instansi public read" ON public.instansi FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "instansi super admin write" ON public.instansi FOR ALL USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_instansi_updated BEFORE UPDATE ON public.instansi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ADD CONSTRAINT profiles_instansi_fk FOREIGN KEY (instansi_id) REFERENCES public.instansi(id) ON DELETE SET NULL;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_instansi_fk FOREIGN KEY (instansi_id) REFERENCES public.instansi(id) ON DELETE SET NULL;

-- =============== KATEGORI ===============
CREATE TABLE public.kategori (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  deskripsi TEXT,
  warna TEXT DEFAULT '#DC2626',
  ikon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
GRANT SELECT ON public.kategori TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.kategori TO authenticated;
GRANT ALL ON public.kategori TO service_role;
ALTER TABLE public.kategori ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kategori public read" ON public.kategori FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "kategori admin write" ON public.kategori FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_kategori_updated BEFORE UPDATE ON public.kategori FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============== KEBIJAKAN ===============
CREATE TABLE public.kebijakan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  deskripsi TEXT,
  konten TEXT,
  thumbnail_url TEXT,
  dokumen_url TEXT,
  kategori_id UUID REFERENCES public.kategori(id) ON DELETE SET NULL,
  instansi_id UUID REFERENCES public.instansi(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.kebijakan_status NOT NULL DEFAULT 'draft',
  tanggal_mulai DATE,
  tanggal_selesai DATE,
  view_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
GRANT SELECT ON public.kebijakan TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.kebijakan TO authenticated;
GRANT ALL ON public.kebijakan TO service_role;
ALTER TABLE public.kebijakan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kebijakan public read" ON public.kebijakan FOR SELECT USING (deleted_at IS NULL AND (status <> 'draft' OR public.is_admin(auth.uid())));
CREATE POLICY "kebijakan admin write" ON public.kebijakan FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_kebijakan_updated BEFORE UPDATE ON public.kebijakan FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_kebijakan_status ON public.kebijakan(status);
CREATE INDEX idx_kebijakan_kategori ON public.kebijakan(kategori_id);
CREATE INDEX idx_kebijakan_instansi ON public.kebijakan(instansi_id);

-- =============== EVENT VOTING ===============
CREATE TABLE public.event_voting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  deskripsi TEXT,
  thumbnail_url TEXT,
  instansi_id UUID REFERENCES public.instansi(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.event_status NOT NULL DEFAULT 'draft',
  tanggal_mulai TIMESTAMPTZ,
  tanggal_selesai TIMESTAMPTZ,
  is_auto_generated BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
GRANT SELECT ON public.event_voting TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.event_voting TO authenticated;
GRANT ALL ON public.event_voting TO service_role;
ALTER TABLE public.event_voting ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event public read" ON public.event_voting FOR SELECT USING (deleted_at IS NULL AND (status <> 'draft' OR public.is_admin(auth.uid())));
CREATE POLICY "event admin write" ON public.event_voting FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_event_updated BEFORE UPDATE ON public.event_voting FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_event_status ON public.event_voting(status);

-- =============== EVENT ↔ KEBIJAKAN ===============
CREATE TABLE public.event_kebijakan (
  event_id UUID NOT NULL REFERENCES public.event_voting(id) ON DELETE CASCADE,
  kebijakan_id UUID NOT NULL REFERENCES public.kebijakan(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, kebijakan_id)
);
GRANT SELECT ON public.event_kebijakan TO anon, authenticated;
GRANT INSERT, DELETE ON public.event_kebijakan TO authenticated;
GRANT ALL ON public.event_kebijakan TO service_role;
ALTER TABLE public.event_kebijakan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_kebijakan public read" ON public.event_kebijakan FOR SELECT USING (true);
CREATE POLICY "event_kebijakan admin write" ON public.event_kebijakan FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =============== VOTING (one vote per user per event) ===============
CREATE TABLE public.voting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.event_voting(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pilihan public.vote_choice NOT NULL,
  alasan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
GRANT SELECT ON public.voting TO anon, authenticated;
GRANT INSERT ON public.voting TO authenticated;
GRANT ALL ON public.voting TO service_role;
ALTER TABLE public.voting ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voting public read" ON public.voting FOR SELECT USING (true);
CREATE POLICY "voting self insert" ON public.voting FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_voting_event ON public.voting(event_id);
CREATE INDEX idx_voting_user ON public.voting(user_id);

-- =============== KOMENTAR ===============
CREATE TABLE public.komentar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.event_voting(id) ON DELETE CASCADE,
  kebijakan_id UUID REFERENCES public.kebijakan(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.komentar(id) ON DELETE CASCADE,
  konten TEXT NOT NULL,
  status public.komentar_status NOT NULL DEFAULT 'approved',
  sentiment public.sentiment_label,
  sentiment_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
GRANT SELECT ON public.komentar TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.komentar TO authenticated;
GRANT ALL ON public.komentar TO service_role;
ALTER TABLE public.komentar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "komentar public read approved" ON public.komentar FOR SELECT USING (deleted_at IS NULL AND (status='approved' OR user_id=auth.uid() OR public.is_admin(auth.uid())));
CREATE POLICY "komentar self insert" ON public.komentar FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "komentar self update" ON public.komentar FOR UPDATE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "komentar admin delete" ON public.komentar FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE TRIGGER trg_komentar_updated BEFORE UPDATE ON public.komentar FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_komentar_event ON public.komentar(event_id);
CREATE INDEX idx_komentar_kebijakan ON public.komentar(kebijakan_id);

-- =============== BOOKMARK ===============
CREATE TABLE public.bookmark (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kebijakan_id UUID NOT NULL REFERENCES public.kebijakan(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kebijakan_id)
);
GRANT SELECT, INSERT, DELETE ON public.bookmark TO authenticated;
GRANT ALL ON public.bookmark TO service_role;
ALTER TABLE public.bookmark ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmark self" ON public.bookmark FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============== NOTIFIKASI ===============
CREATE TABLE public.notifikasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notif_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifikasi TO authenticated;
GRANT ALL ON public.notifikasi TO service_role;
ALTER TABLE public.notifikasi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif self read" ON public.notifikasi FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif self update" ON public.notifikasi FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif admin insert" ON public.notifikasi FOR INSERT WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = user_id);

-- =============== BANNER ===============
CREATE TABLE public.banner (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  subjudul TEXT,
  image_url TEXT,
  link TEXT,
  urutan INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
GRANT SELECT ON public.banner TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.banner TO authenticated;
GRANT ALL ON public.banner TO service_role;
ALTER TABLE public.banner ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banner public read" ON public.banner FOR SELECT USING (deleted_at IS NULL AND is_active);
CREATE POLICY "banner super admin write" ON public.banner FOR ALL USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_banner_updated BEFORE UPDATE ON public.banner FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============== FAQ ===============
CREATE TABLE public.faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pertanyaan TEXT NOT NULL,
  jawaban TEXT NOT NULL,
  kategori TEXT,
  urutan INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
GRANT SELECT ON public.faq TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.faq TO authenticated;
GRANT ALL ON public.faq TO service_role;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faq public read" ON public.faq FOR SELECT USING (deleted_at IS NULL AND is_active);
CREATE POLICY "faq super admin write" ON public.faq FOR ALL USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_faq_updated BEFORE UPDATE ON public.faq FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============== LAPORAN ===============
CREATE TABLE public.laporan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  alasan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.laporan TO authenticated;
GRANT ALL ON public.laporan TO service_role;
ALTER TABLE public.laporan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "laporan self read" ON public.laporan FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "laporan self insert" ON public.laporan FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "laporan admin update" ON public.laporan FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE TRIGGER trg_laporan_updated BEFORE UPDATE ON public.laporan FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============== SETTINGS ===============
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings super admin write" ON public.settings FOR ALL USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- =============== AUDIT LOGS ===============
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit super admin read" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "audit any insert" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============== AI SUMMARY ===============
CREATE TABLE public.ai_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.event_voting(id) ON DELETE CASCADE,
  kebijakan_id UUID REFERENCES public.kebijakan(id) ON DELETE CASCADE,
  ringkasan TEXT NOT NULL,
  mayoritas_setuju TEXT,
  mayoritas_tidak_setuju TEXT,
  kekhawatiran TEXT,
  harapan TEXT,
  rekomendasi TEXT,
  sentiment_positif INTEGER DEFAULT 0,
  sentiment_netral INTEGER DEFAULT 0,
  sentiment_negatif INTEGER DEFAULT 0,
  total_komentar INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_summary TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ai_summary TO authenticated;
GRANT ALL ON public.ai_summary TO service_role;
ALTER TABLE public.ai_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_summary public read" ON public.ai_summary FOR SELECT USING (true);
CREATE POLICY "ai_summary admin write" ON public.ai_summary FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =============== TRENDING SCORE FUNCTION ===============
CREATE OR REPLACE FUNCTION public.trending_score(_kebijakan_id UUID)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH k AS (SELECT view_count, share_count FROM public.kebijakan WHERE id=_kebijakan_id),
       v AS (SELECT count(*) c FROM public.voting v JOIN public.event_kebijakan ek ON ek.event_id=v.event_id WHERE ek.kebijakan_id=_kebijakan_id),
       c AS (SELECT count(*) c FROM public.komentar WHERE kebijakan_id=_kebijakan_id AND status='approved')
  SELECT COALESCE((SELECT c FROM v),0)*0.4 + COALESCE((SELECT c FROM c),0)*0.3 + COALESCE((SELECT view_count FROM k),0)*0.2 + COALESCE((SELECT share_count FROM k),0)*0.1;
$$;

-- =============== REALTIME ===============
ALTER PUBLICATION supabase_realtime ADD TABLE public.voting;
ALTER PUBLICATION supabase_realtime ADD TABLE public.komentar;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifikasi;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_voting;

-- =============== SEED ===============
INSERT INTO public.kategori (nama, slug, warna, ikon) VALUES
  ('Pendidikan','pendidikan','#DC2626','GraduationCap'),
  ('Kesehatan','kesehatan','#16A34A','HeartPulse'),
  ('Infrastruktur','infrastruktur','#2563EB','Building2'),
  ('Lingkungan','lingkungan','#15803D','Leaf'),
  ('Ekonomi','ekonomi','#CA8A04','TrendingUp'),
  ('Sosial','sosial','#9333EA','Users'),
  ('Hukum','hukum','#475569','Scale'),
  ('Teknologi','teknologi','#0891B2','Cpu');

INSERT INTO public.instansi (nama, slug, deskripsi) VALUES
  ('Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi','kemendikbudristek','Kementerian yang menyelenggarakan urusan pemerintahan di bidang pendidikan dan kebudayaan.'),
  ('Kementerian Kesehatan','kemenkes','Kementerian yang menyelenggarakan urusan pemerintahan di bidang kesehatan.'),
  ('Kementerian Pekerjaan Umum dan Perumahan Rakyat','pupr','Kementerian yang menyelenggarakan urusan pemerintahan di bidang pekerjaan umum dan perumahan rakyat.'),
  ('Kementerian Lingkungan Hidup dan Kehutanan','klhk','Kementerian yang menyelenggarakan urusan pemerintahan di bidang lingkungan hidup dan kehutanan.'),
  ('Kementerian Komunikasi dan Informatika','kominfo','Kementerian yang menyelenggarakan urusan pemerintahan di bidang komunikasi dan informatika.');

INSERT INTO public.faq (pertanyaan, jawaban, urutan) VALUES
  ('Apa itu SuaraKita?','SuaraKita adalah platform e-participation resmi tempat masyarakat dapat memberikan suara terhadap kebijakan pemerintah secara transparan dan akuntabel.',1),
  ('Apakah suara saya rahasia?','Identitas pribadi Anda dilindungi. Yang dipublikasikan hanyalah agregat suara (jumlah & persentase), bukan identitas pemilih individual.',2),
  ('Berapa kali saya bisa memilih?','Setiap pengguna hanya dapat memberikan satu suara per event konsultasi. Hal ini dijamin oleh sistem pada level basis data.',3),
  ('Bagaimana hasil voting ditindaklanjuti?','Hasil voting menjadi bahan pertimbangan resmi bagi instansi pembuat kebijakan, dan progres tindak lanjut dapat diikuti melalui timeline transparansi setiap kebijakan.',4);

INSERT INTO public.banner (judul, subjudul, urutan) VALUES
  ('Suarakan Pendapatmu untuk Indonesia','Platform resmi konsultasi publik digital — transparan, akuntabel, untuk semua warga.',1);

INSERT INTO public.settings (key, value) VALUES
  ('app_name','"SuaraKita"'::jsonb),
  ('app_tagline','"Platform E-Participation Indonesia"'::jsonb);
