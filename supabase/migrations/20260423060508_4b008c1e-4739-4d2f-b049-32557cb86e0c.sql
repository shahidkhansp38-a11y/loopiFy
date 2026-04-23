-- Fix mutable search_path on validate_invite
CREATE OR REPLACE FUNCTION public.validate_invite()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= now() THEN
    RAISE EXCEPTION 'expires_at must be in the future';
  END IF;
  RETURN NEW;
END;
$$;

-- Storage: bucket is already private (public=false), but ensure no broad listing policy slipped in.
-- Our existing policies already scope SELECT to admins of the folder's group; no change needed beyond confirming privacy.
-- Re-assert bucket privacy in case it was toggled:
UPDATE storage.buckets SET public = false WHERE id = 'lecture-videos';