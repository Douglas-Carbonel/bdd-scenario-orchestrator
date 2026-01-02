-- Create function to auto-assign admin role for specific email
CREATE OR REPLACE FUNCTION public.assign_admin_for_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-approve and assign admin role for designated admin email
  IF NEW.email = 'douglascarbonell@outlook.com' THEN
    UPDATE public.profiles 
    SET approval_status = 'approved', approved_at = now()
    WHERE id = NEW.id;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to run after profile is created
CREATE TRIGGER on_profile_created_check_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_for_email();