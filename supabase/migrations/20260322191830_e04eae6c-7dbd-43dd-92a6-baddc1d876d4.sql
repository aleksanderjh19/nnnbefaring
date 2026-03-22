
CREATE OR REPLACE FUNCTION public.cleanup_expired_draft_voltage_rounds()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.voltage_rounds
  WHERE status = 'draft'
    AND created_at < now() - interval '24 hours';
$$;
