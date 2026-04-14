-- Drop the overly permissive policy that allowed users to update any profile field
-- (including approval_status, company_id, etc.)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a security-definer function that ONLY allows updating name and avatar_url.
-- SECURITY DEFINER runs as the function owner (postgres) but the WHERE clause
-- ensures only the caller's own row is updated.
CREATE OR REPLACE FUNCTION public.update_own_profile(p_name text, p_avatar_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    name       = p_name,
    avatar_url = p_avatar_url,
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- Only authenticated (approved) users may call this function
GRANT EXECUTE ON FUNCTION public.update_own_profile(text, text) TO authenticated;
