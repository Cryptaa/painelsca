-- Fix nullable user_id columns to enforce proper RLS isolation
-- First, ensure all existing records have a user_id (if any are null, this would need manual intervention)
-- Note: This assumes all existing records have user_id set correctly

-- Add NOT NULL constraints to user_id columns
ALTER TABLE public.projects ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.investments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.revenues ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.notes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.tasks ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policies to be defensive with explicit null checks
-- Projects table
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

CREATE POLICY "Users can view their own projects"
ON public.projects
FOR SELECT
USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
ON public.projects
FOR INSERT
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.projects
FOR UPDATE
USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.projects
FOR DELETE
USING (user_id IS NOT NULL AND auth.uid() = user_id);

-- Investments table
DROP POLICY IF EXISTS "Users can view their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can create their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can delete their own investments" ON public.investments;

CREATE POLICY "Users can view their own investments"
ON public.investments
FOR SELECT
USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can create their own investments"
ON public.investments
FOR INSERT
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own investments"
ON public.investments
FOR UPDATE
USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments"
ON public.investments
FOR DELETE
USING (user_id IS NOT NULL AND auth.uid() = user_id);

-- Revenues table
DROP POLICY IF EXISTS "Users can view their own revenues" ON public.revenues;
DROP POLICY IF EXISTS "Users can create their own revenues" ON public.revenues;
DROP POLICY IF EXISTS "Users can update their own revenues" ON public.revenues;
DROP POLICY IF EXISTS "Users can delete their own revenues" ON public.revenues;

CREATE POLICY "Users can view their own revenues"
ON public.revenues
FOR SELECT
USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can create their own revenues"
ON public.revenues
FOR INSERT
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own revenues"
ON public.revenues
FOR UPDATE
USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own revenues"
ON public.revenues
FOR DELETE
USING (user_id IS NOT NULL AND auth.uid() = user_id);

-- Notes table
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

CREATE POLICY "Users can view their own notes"
ON public.notes
FOR SELECT
USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
ON public.notes
FOR INSERT
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON public.notes
FOR UPDATE
USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.notes
FOR DELETE
USING (user_id IS NOT NULL AND auth.uid() = user_id);

-- Tasks table
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

CREATE POLICY "Users can view their own tasks"
ON public.tasks
FOR SELECT
USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
ON public.tasks
FOR INSERT
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON public.tasks
FOR UPDATE
USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON public.tasks
FOR DELETE
USING (user_id IS NOT NULL AND auth.uid() = user_id);

-- Add explicit anonymous denial policies for profiles and subscriptions
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

CREATE POLICY "Block anonymous access to subscriptions"
ON public.subscriptions
FOR SELECT
TO anon
USING (false);

-- Add user-scoped policy for subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);