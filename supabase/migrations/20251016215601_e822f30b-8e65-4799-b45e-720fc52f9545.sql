-- Create learnings table for personal learning diary
CREATE TABLE public.learnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('erro', 'vitoria', 'licao', 'reflexao')),
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  linked_project_id UUID,
  linked_idea_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.learnings ENABLE ROW LEVEL SECURITY;

-- Create policies for learnings
CREATE POLICY "Users can view their own learnings"
ON public.learnings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own learnings"
ON public.learnings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learnings"
ON public.learnings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learnings"
ON public.learnings
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_learnings_updated_at
BEFORE UPDATE ON public.learnings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_learnings_user_id ON public.learnings(user_id);
CREATE INDEX idx_learnings_category ON public.learnings(category);
CREATE INDEX idx_learnings_date ON public.learnings(date DESC);
CREATE INDEX idx_learnings_tags ON public.learnings USING GIN(tags);