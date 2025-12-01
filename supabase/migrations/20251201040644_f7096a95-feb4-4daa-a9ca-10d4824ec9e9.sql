-- Create study_sessions table with real number columns
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
  duration_hours REAL NOT NULL DEFAULT 0,
  mood_score REAL NOT NULL CHECK (mood_score >= 0 AND mood_score <= 10),
  focus_score REAL NOT NULL CHECK (focus_score >= 0 AND focus_score <= 10),
  efficiency_score REAL NOT NULL CHECK (efficiency_score >= 0 AND efficiency_score <= 1),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  week_start DATE NOT NULL
);

-- Create index for user queries
CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_study_sessions_week_start ON public.study_sessions(week_start);

-- Enable Row Level Security
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_sessions
CREATE POLICY "Users can view their own study sessions"
  ON public.study_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study sessions"
  ON public.study_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
  ON public.study_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sessions"
  ON public.study_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to calculate duration in hours (real number conversion)
CREATE OR REPLACE FUNCTION public.calculate_duration_hours()
RETURNS TRIGGER AS $$
BEGIN
  -- Real number conversion: minutes to hours (division operation)
  NEW.duration_hours := NEW.duration_minutes::REAL / 60.0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate duration_hours
CREATE TRIGGER trigger_calculate_duration_hours
  BEFORE INSERT OR UPDATE OF duration_minutes ON public.study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_duration_hours();

-- Function to get week start date (Monday of the week)
CREATE OR REPLACE FUNCTION public.get_week_start(input_date DATE)
RETURNS DATE AS $$
BEGIN
  RETURN input_date - ((EXTRACT(DOW FROM input_date)::INTEGER + 6) % 7);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;