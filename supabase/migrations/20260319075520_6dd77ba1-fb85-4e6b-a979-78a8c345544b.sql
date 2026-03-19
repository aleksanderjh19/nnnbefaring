INSERT INTO public.user_roles (user_id, role)
VALUES ('c16ad0de-0c73-4b2f-9972-63d59a8c14ea', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;