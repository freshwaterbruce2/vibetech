
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import TodoForm from "./TodoForm";
import TodoItem, { Todo } from "./TodoItem";

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: "1", text: "Research new technologies", completed: false, dueDate: new Date(2025, 4, 21) },
    { id: "2", text: "Update portfolio content", completed: true },
    { id: "3", text: "Schedule client meeting", completed: false, dueDate: new Date(2025, 4, 23) },
  ]);

  const addTodo = (text: string, dueDate?: Date) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      text,
      completed: false,
      dueDate,
    };
    
    setTodos([...todos, newTodo]);
    toast({
      title: "Task added",
      description: `"${text}" has been added to your list`,
    });
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    const todoToDelete = todos.find(todo => todo.id === id);
    setTodos(todos.filter((todo) => todo.id !== id));
    
    if (todoToDelete) {
      toast({
        title: "Task removed",
        description: `"${todoToDelete.text}" has been removed from your list`,
        variant: "destructive",
      });
    }
  };

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
        <TodoForm addTodo={addTodo} />
        
        <div className="space-y-2 max-h-[45vh] overflow-y-auto">
          <AnimatePresence>
            {todos.length === 0 ? (
              <div className="text-center py-4 text-aura-textSecondary">
                No tasks yet. Add one to get started!
              </div>
            ) : (
              todos.map((todo) => (
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
            onClick={() => {
              setTodos([]);
              toast({
                title: "List cleared",
                description: "All tasks have been removed",
              });
            }}
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
