
-- Admin invite codes table
CREATE TABLE public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'admin_instansi',
  instansi_id uuid REFERENCES public.instansi(id) ON DELETE CASCADE,
  catatan text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_invites TO authenticated;
GRANT ALL ON public.admin_invites TO service_role;

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

-- Super admin & admin_instansi (untuk instansinya) bisa kelola undangan
CREATE POLICY "admin_invites super read" ON public.admin_invites
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'admin_instansi') AND instansi_id = public.user_instansi(auth.uid()))
  );

CREATE POLICY "admin_invites super insert" ON public.admin_invites
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'admin_instansi') AND instansi_id = public.user_instansi(auth.uid()) AND role = 'admin_instansi')
  );

CREATE POLICY "admin_invites super update" ON public.admin_invites
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (public.has_role(auth.uid(), 'admin_instansi') AND instansi_id = public.user_instansi(auth.uid()))
  );

CREATE INDEX admin_invites_code_idx ON public.admin_invites(code);

-- Redeem function (SECURITY DEFINER): authenticated user submits a code → role granted
CREATE OR REPLACE FUNCTION public.redeem_admin_invite(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_invite public.admin_invites;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_invite FROM public.admin_invites
   WHERE code = upper(trim(_code))
   LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;
  IF v_invite.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'revoked';
  END IF;
  IF v_invite.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'already_used';
  END IF;
  IF v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'expired';
  END IF;

  -- Grant role
  INSERT INTO public.user_roles (user_id, role, instansi_id)
  VALUES (v_uid, v_invite.role, v_invite.instansi_id)
  ON CONFLICT (user_id, role) DO UPDATE SET instansi_id = EXCLUDED.instansi_id;

  -- Sync profile.instansi_id if provided
  IF v_invite.instansi_id IS NOT NULL THEN
    UPDATE public.profiles SET instansi_id = v_invite.instansi_id WHERE id = v_uid;
  END IF;

  -- Mark used
  UPDATE public.admin_invites
     SET used_by = v_uid, used_at = now()
   WHERE id = v_invite.id;

  -- Audit log
  PERFORM public.write_audit(
    'redeem_invite', 'admin_invites', v_invite.id::text,
    jsonb_build_object('role', v_invite.role, 'instansi_id', v_invite.instansi_id)
  );

  RETURN jsonb_build_object('ok', true, 'role', v_invite.role, 'instansi_id', v_invite.instansi_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_admin_invite(text) TO authenticated;
