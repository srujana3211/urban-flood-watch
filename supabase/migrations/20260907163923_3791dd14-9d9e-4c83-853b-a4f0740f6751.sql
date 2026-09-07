CREATE TABLE public.sim_state (
  id TEXT PRIMARY KEY,
  tick INTEGER NOT NULL DEFAULT 0,
  running BOOLEAN NOT NULL DEFAULT false,
  speed NUMERIC NOT NULL DEFAULT 1,
  scenario TEXT NOT NULL DEFAULT 'zone_a_d17',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sim_state TO anon, authenticated;
GRANT ALL ON public.sim_state TO service_role;
ALTER TABLE public.sim_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sim_state public read" ON public.sim_state FOR SELECT USING (true);
CREATE POLICY "sim_state public update" ON public.sim_state FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "sim_state public insert" ON public.sim_state FOR INSERT WITH CHECK (true);
INSERT INTO public.sim_state (id, tick, running, speed) VALUES ('demo', 0, false, 1);

CREATE TABLE public.citizen_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id TEXT NOT NULL,
  report_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  water_depth_cm INTEGER,
  description TEXT,
  reporter_name TEXT,
  lat NUMERIC,
  lng NUMERIC,
  tick INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unverified',
  trust_score NUMERIC NOT NULL DEFAULT 0.6,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.citizen_reports TO anon, authenticated;
GRANT ALL ON public.citizen_reports TO service_role;
ALTER TABLE public.citizen_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports public read" ON public.citizen_reports FOR SELECT USING (true);
CREATE POLICY "reports public insert" ON public.citizen_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "reports public update" ON public.citizen_reports FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE public.decision_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id TEXT NOT NULL,
  zone_id TEXT,
  decision TEXT NOT NULL,
  officer_role TEXT NOT NULL DEFAULT 'Municipal Commissioner',
  notes TEXT,
  tick INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decision_log TO anon, authenticated;
GRANT ALL ON public.decision_log TO service_role;
ALTER TABLE public.decision_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "decisions public read" ON public.decision_log FOR SELECT USING (true);
CREATE POLICY "decisions public insert" ON public.decision_log FOR INSERT WITH CHECK (true);
CREATE POLICY "decisions public update" ON public.decision_log FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "decisions public delete" ON public.decision_log FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.sim_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.citizen_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.decision_log;