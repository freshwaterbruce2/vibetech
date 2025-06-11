
-- Add new columns to the todos table for categories and priorities
ALTER TABLE public.todos 
ADD COLUMN category TEXT DEFAULT 'general',
ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));

-- Enable realtime for the todos table
ALTER TABLE public.todos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
