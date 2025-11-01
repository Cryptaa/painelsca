-- Create trigger to automatically create trial subscription for new users
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set trial end to 24 hours from now
  trial_end := now() + INTERVAL '24 hours';
  
  -- Only create trial if user is not admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = 'admin') THEN
    INSERT INTO public.subscriptions (
      user_id,
      plan_name,
      price,
      status,
      start_date,
      end_date,
      is_trial,
      trial_end_at,
      notes
    ) VALUES (
      NEW.id,
      'Trial 24h',
      0,
      'active',
      now(),
      trial_end,
      true,
      trial_end,
      'Trial gratuito de 24 horas'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to auth.users (this will run after handle_new_user trigger)
DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_trial_subscription();