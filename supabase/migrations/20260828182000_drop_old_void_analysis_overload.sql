-- Drop the old get_void_analysis overload that does not have the filter parameters
-- to prevent ambiguous function call errors via PostgREST.

DROP FUNCTION IF EXISTS public.get_void_analysis(TIMESTAMPTZ, TIMESTAMPTZ);
