-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.calculate_duration_hours()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Real number conversion: minutes to hours (division operation)
  NEW.duration_hours := NEW.duration_minutes::REAL / 60.0;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_week_start(input_date DATE)
RETURNS DATE 
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN input_date - ((EXTRACT(DOW FROM input_date)::INTEGER + 6) % 7);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;