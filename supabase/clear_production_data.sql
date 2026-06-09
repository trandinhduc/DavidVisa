-- Clear all application records and notification logs
TRUNCATE TABLE public.applications CASCADE;
TRUNCATE TABLE public.notification_logs CASCADE;

-- Reset the application ID sequence back to 1
ALTER SEQUENCE IF EXISTS public.application_seq RESTART WITH 1;
