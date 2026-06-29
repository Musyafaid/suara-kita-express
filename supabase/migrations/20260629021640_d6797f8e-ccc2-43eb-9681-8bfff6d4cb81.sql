
-- 1. Generic audit writer (SECURITY DEFINER so triggers can insert regardless of caller)
CREATE OR REPLACE FUNCTION public.write_audit(_action text, _resource_type text, _resource_id text, _metadata jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (auth.uid(), _action, _resource_type, _resource_id, _metadata);
END; $$;

-- 2. Kebijakan trigger: audit + auto-create event_voting on publish
CREATE OR REPLACE FUNCTION public.tg_audit_kebijakan()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_event_id uuid;
  new_slug text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit('create', 'kebijakan', NEW.id::text, jsonb_build_object('judul', NEW.judul, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      PERFORM public.write_audit('delete', 'kebijakan', NEW.id::text, jsonb_build_object('judul', NEW.judul));
    ELSE
      PERFORM public.write_audit('update', 'kebijakan', NEW.id::text, jsonb_build_object('judul', NEW.judul, 'status', NEW.status));
    END IF;

    -- Auto-create event_voting when status transitions from draft -> published
    IF OLD.status = 'draft' AND NEW.status <> 'draft' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.event_kebijakan ek
        JOIN public.event_voting ev ON ev.id = ek.event_id
        WHERE ek.kebijakan_id = NEW.id AND ev.is_auto_generated = true
      ) THEN
        new_slug := public.slugify(NEW.judul) || '-' || substring(NEW.id::text, 1, 6);
        INSERT INTO public.event_voting (judul, slug, deskripsi, thumbnail_url, instansi_id, created_by, status, tanggal_mulai, tanggal_selesai, is_auto_generated)
        VALUES (
          'Voting: ' || NEW.judul,
          new_slug,
          NEW.deskripsi,
          NEW.thumbnail_url,
          NEW.instansi_id,
          NEW.created_by,
          'aktif',
          now(),
          now() + interval '30 days',
          true
        )
        RETURNING id INTO new_event_id;
        INSERT INTO public.event_kebijakan (event_id, kebijakan_id) VALUES (new_event_id, NEW.id);
        PERFORM public.write_audit('auto_create_event', 'event_voting', new_event_id::text, jsonb_build_object('kebijakan_id', NEW.id, 'judul', NEW.judul));
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_audit_kebijakan ON public.kebijakan;
CREATE TRIGGER trg_audit_kebijakan AFTER INSERT OR UPDATE ON public.kebijakan
FOR EACH ROW EXECUTE FUNCTION public.tg_audit_kebijakan();

-- 3. Event voting trigger
CREATE OR REPLACE FUNCTION public.tg_audit_event_voting()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit('create', 'event_voting', NEW.id::text, jsonb_build_object('judul', NEW.judul, 'status', NEW.status, 'auto', NEW.is_auto_generated));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      PERFORM public.write_audit('delete', 'event_voting', NEW.id::text, jsonb_build_object('judul', NEW.judul));
    ELSE
      PERFORM public.write_audit('update', 'event_voting', NEW.id::text, jsonb_build_object('judul', NEW.judul, 'status', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_audit_event_voting ON public.event_voting;
CREATE TRIGGER trg_audit_event_voting AFTER INSERT OR UPDATE ON public.event_voting
FOR EACH ROW EXECUTE FUNCTION public.tg_audit_event_voting();

-- 4. Voting (cast vote) trigger
CREATE OR REPLACE FUNCTION public.tg_audit_voting()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.write_audit('vote', 'event_voting', NEW.event_id::text, jsonb_build_object('pilihan', NEW.pilihan));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_audit_voting ON public.voting;
CREATE TRIGGER trg_audit_voting AFTER INSERT ON public.voting
FOR EACH ROW EXECUTE FUNCTION public.tg_audit_voting();

-- 5. Komentar moderation trigger
CREATE OR REPLACE FUNCTION public.tg_audit_komentar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    PERFORM public.write_audit(
      CASE WHEN NEW.status = 'approved' THEN 'approve_komentar' ELSE 'reject_komentar' END,
      'komentar', NEW.id::text,
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_audit_komentar ON public.komentar;
CREATE TRIGGER trg_audit_komentar AFTER UPDATE ON public.komentar
FOR EACH ROW EXECUTE FUNCTION public.tg_audit_komentar();
