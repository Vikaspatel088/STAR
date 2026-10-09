
-- Add 'organisation' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'organisation';

-- Create organisations table
CREATE TABLE public.organisations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  organisation_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  organisation_type TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

-- RLS policies for organisations
CREATE POLICY "Users can view their own organisation"
  ON public.organisations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own organisation"
  ON public.organisations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organisation"
  ON public.organisations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all organisations"
  ON public.organisations FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
