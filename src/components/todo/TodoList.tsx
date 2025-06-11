
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TodoForm from "./TodoForm";
import TodoItem from "./TodoItem";
import { Todo, TodoPriority } from "./types";

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(["general", "work", "personal", "shopping"]);

  // Fetch todos from Supabase
  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching todos:', error);
        toast({
          title: "Error",
          description: "Failed to load tasks",
          variant: "destructive",
        });
        return;
      }

      const formattedTodos: Todo[] = data.map(todo => ({
        id: todo.id,
        text: todo.title,
        completed: todo.completed || false,
        dueDate: todo.due_date ? new Date(todo.due_date) : undefined,
        category: todo.category || 'general',
        priority: (todo.priority as TodoPriority) || 'medium',
      }));

      setTodos(formattedTodos);
      
      // Update categories from existing todos
      const existingCategories = [...new Set(formattedTodos.map(todo => todo.category))];
      setCategories(prev => [...new Set([...prev, ...existingCategories])]);
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchTodos();

    const channel = supabase
      .channel('todos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchTodos(); // Refetch todos when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addTodo = async (text: string, dueDate?: Date, category?: string, priority?: TodoPriority) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to add tasks",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('todos')
        .insert({
          title: text,
          user_id: user.id,
          due_date: dueDate?.toISOString().split('T')[0],
          completed: false,
          category: category || 'general',
          priority: priority || 'medium',
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding todo:', error);
        toast({
          title: "Error",
          description: "Failed to add task",
          variant: "destructive",
        });
        return;
      }

      // Add category to list if new
      if (category && !categories.includes(category)) {
        setCategories(prev => [...prev, category]);
      }

      toast({
        title: "Task added",
        description: `"${text}" has been added to your list`,
      });
    } catch (error) {
      console.error('Error adding todo:', error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', id);

      if (error) {
        console.error('Error updating todo:', error);
        toast({
          title: "Error",
          description: "Failed to update task",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const todoToDelete = todos.find(todo => todo.id === id);
      
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting todo:', error);
        toast({
          title: "Error",
          description: "Failed to delete task",
          variant: "destructive",
        });
        return;
      }
      
      if (todoToDelete) {
        toast({
          title: "Task removed",
          description: `"${todoToDelete.text}" has been removed from your list`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const clearAllTodos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to clear tasks",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing todos:', error);
        toast({
          title: "Error",
          description: "Failed to clear tasks",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "List cleared",
        description: "All tasks have been removed",
      });
    } catch (error) {
      console.error('Error clearing todos:', error);
      toast({
        title: "Error",
        description: "Failed to clear tasks",
        variant: "destructive",
      });
    }
  };

  // Sort todos by priority and completion status
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto border-aura-accent/10 bg-aura-backgroundLight shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-aura-accent" />
            <CardTitle>Task Manager</CardTitle>
          </div>
          <CardDescription>Loading your tasks...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-aura-accent/5 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border-aura-accent/10 bg-aura-backgroundLight shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-aura-accent" />
          <CardTitle>Task Manager</CardTitle>
        </div>
        <CardDescription>Manage your daily tasks and projects</CardDescription>
      </CardHeader>
      <CardContent>
        <TodoForm addTodo={addTodo} categories={categories} />
        
        <div className="space-y-2 max-h-[45vh] overflow-y-auto">
          <AnimatePresence>
            {sortedTodos.length === 0 ? (
              <div className="text-center py-4 text-aura-textSecondary">
                No tasks yet. Add one to get started!
              </div>
            ) : (
              sortedTodos.map((todo) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TodoItem 
                    todo={todo} 
                    toggleTodo={toggleTodo} 
                    deleteTodo={deleteTodo} 
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-aura-accent/10 pt-4">
        <div className="text-sm text-aura-textSecondary">
          {todos.filter(t => t.completed).length} of {todos.length} completed
        </div>
        {todos.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllTodos}
            className="text-xs"
          >
            Clear All
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TodoList;
