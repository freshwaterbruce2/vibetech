
-- Enable RLS on the todos table
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Create a consolidated policy for users to see and modify their own todos
CREATE POLICY "Users can manage their own todos"
ON public.todos
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.todos TO authenticated;
