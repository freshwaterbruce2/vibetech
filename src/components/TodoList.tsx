
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ListTodo, Trash2, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: Date;
};

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: "1", text: "Research new technologies", completed: false, dueDate: new Date(2025, 4, 21) },
    { id: "2", text: "Update portfolio content", completed: true },
    { id: "3", text: "Schedule client meeting", completed: false, dueDate: new Date(2025, 4, 23) },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const addTodo = () => {
    if (inputValue.trim() === "") return;
    
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: inputValue,
      completed: false,
      dueDate: selectedDate,
    };
    
    setTodos([...todos, newTodo]);
    setInputValue("");
    setSelectedDate(undefined);
    toast({
      title: "Task added",
      description: `"${inputValue}" has been added to your list`,
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const getTodoDueStatus = (dueDate?: Date) => {
    if (!dueDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDateCopy = new Date(dueDate);
    dueDateCopy.setHours(0, 0, 0, 0);
    
    const diffTime = dueDateCopy.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays < 0) return "overdue";
    if (diffDays === 0) return "today";
    if (diffDays <= 2) return "soon";
    return "future";
  };

  const getDueStatusClass = (status: string | null) => {
    if (!status) return "";
    
    switch (status) {
      case "overdue":
        return "text-red-500";
      case "today":
        return "text-yellow-500";
      case "soon":
        return "text-amber-400";
      default:
        return "text-aura-textSecondary";
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
        <div className="flex items-center mb-4">
          <div className="flex-1 mr-2">
            <Input
              placeholder="Add new task..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className={cn(
                  "mr-2",
                  selectedDate ? "text-aura-accent" : "text-aura-textSecondary"
                )}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          <Button onClick={addTodo} className="bg-aura-accent hover:bg-aura-accent/90">
            Add
          </Button>
        </div>
        
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
                  <div className="flex items-start justify-between py-2 border-b border-aura-accent/5">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`todo-${todo.id}`}
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo.id)}
                        className="border-aura-accent/50 data-[state=checked]:bg-aura-accent mt-1"
                      />
                      <div className="flex flex-col">
                        <label
                          htmlFor={`todo-${todo.id}`}
                          className={`text-sm ${
                            todo.completed
                              ? "line-through text-aura-textSecondary"
                              : "text-aura-text"
                          }`}
                        >
                          {todo.text}
                        </label>
                        {todo.dueDate && (
                          <div 
                            className={`text-xs mt-1 flex items-center ${getDueStatusClass(getTodoDueStatus(todo.dueDate))}`}
                          >
                            <Calendar className="h-3 w-3 mr-1 inline" />
                            {format(todo.dueDate, "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTodo(todo.id)}
                      className="h-8 w-8 text-aura-textSecondary hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
