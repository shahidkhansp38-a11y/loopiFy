CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.study_groups(id) ON DELETE SET NULL,
  caller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  callee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing','accepted','connected','rejected','busy','missed','ended','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz,
  ended_at timestamptz,
  end_reason text
);

CREATE INDEX idx_calls_callee ON public.calls(callee_id, status);
CREATE INDEX idx_calls_caller ON public.calls(caller_id, status);

GRANT SELECT, INSERT, UPDATE ON public.calls TO authenticated;
GRANT ALL ON public.calls TO service_role;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their calls" ON public.calls
  FOR SELECT TO authenticated
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "Callers can start calls" ON public.calls
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = caller_id AND caller_id <> callee_id);

CREATE POLICY "Participants can update their calls" ON public.calls
  FOR UPDATE TO authenticated
  USING (auth.uid() = caller_id OR auth.uid() = callee_id)
  WITH CHECK (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE OR REPLACE FUNCTION public.is_call_participant(_user_id uuid, _call_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.calls c
    WHERE c.id = _call_id AND (c.caller_id = _user_id OR c.callee_id = _user_id)
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_call_participant(uuid, uuid) FROM PUBLIC, anon;

CREATE TABLE public.call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('offer','answer','ice')),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_signals_call ON public.call_signals(call_id, created_at);

GRANT SELECT, INSERT ON public.call_signals TO authenticated;
GRANT ALL ON public.call_signals TO service_role;
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read call signals" ON public.call_signals
  FOR SELECT TO authenticated
  USING (public.is_call_participant(auth.uid(), call_id));

CREATE POLICY "Participants can send call signals" ON public.call_signals
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_call_participant(auth.uid(), call_id));

ALTER TABLE public.calls REPLICA IDENTITY FULL;
ALTER TABLE public.call_signals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;