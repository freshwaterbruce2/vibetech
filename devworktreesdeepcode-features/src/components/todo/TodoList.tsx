import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import TodoForm from "./TodoForm";
import TodoItem from "./TodoItem";
import { Todo } from "./types";

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories] = useState<string[]>(["general", "work", "personal", "shopping"]);

  // Load todos from localStorage
  useEffect(() => {
    const storedTodos = localStorage.getItem('vibetech-todos');
    if (storedTodos) {
      try {
        setTodos(JSON.parse(storedTodos));
      } catch (error) {
        console.error('Error loading todos:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('vibetech-todos', JSON.stringify(todos));
  }, [todos]);

  const handleCreateTodo = (newTodo: Omit<Todo, "id" | "created_at" | "updated_at">) => {
    const todo: Todo = {
      ...newTodo,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setTodos([todo, ...todos]);
    
    toast({
      title: "Task Added",
      description: "Your task has been added successfully",
    });
  };

  const handleToggleComplete = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id 
        ? { ...todo, completed: !todo.completed, updated_at: new Date().toISOString() }
        : todo
    ));
  };

  const handleDelete = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
    
    toast({
      title: "Task Deleted",
      description: "The task has been removed",
    });
  };

  const handleEdit = (id: string, updates: Partial<Todo>) => {
    setTodos(todos.map(todo => 
      todo.id === id 
        ? { ...todo, ...updates, updated_at: new Date().toISOString() }
        : todo
    ));
    
    toast({
      title: "Task Updated",
      description: "Your task has been updated successfully",
    });
  };

  // Calculate stats
  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card className="border-2 shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ListTodo className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-bold">My Tasks</CardTitle>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold text-primary">{completionRate}%</p>
            </div>
          </div>
          <CardDescription>
            Keep track of your daily tasks and boost your productivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TodoForm 
            onSubmit={handleCreateTodo} 
            categories={categories}
          />
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : todos.length === 0 ? (
            <div className="text-center py-12">
              <ListTodo className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">No tasks yet. Add your first task above!</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {todos.map((todo) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TodoItem
                      todo={todo}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          {totalCount > 0 && (
            <p>{completedCount} of {totalCount} tasks completed</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default TodoList;