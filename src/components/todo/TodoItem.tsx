
import React from "react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Todo } from "./types";

interface TodoItemProps {
  todo: Todo;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
}

const priorityColors = {
  low: "bg-green-100 text-green-800 border-green-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300", 
  high: "bg-red-100 text-red-800 border-red-300"
};

const TodoItem = ({ todo, toggleTodo, deleteTodo }: TodoItemProps) => {
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
    <div className="flex items-start justify-between py-3 border-b border-aura-accent/5">
      <div className="flex items-start gap-3 flex-1">
        <Checkbox
          id={`todo-${todo.id}`}
          checked={todo.completed}
          onCheckedChange={() => toggleTodo(todo.id)}
          className="border-aura-accent/50 data-[state=checked]:bg-aura-accent mt-1"
        />
        <div className="flex flex-col gap-2 flex-1">
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
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {todo.category}
            </Badge>
            <Badge className={`text-xs ${priorityColors[todo.priority]}`}>
              {todo.priority}
            </Badge>
            {todo.dueDate && (
              <div 
                className={`text-xs flex items-center ${getDueStatusClass(getTodoDueStatus(todo.dueDate))}`}
              >
                <Calendar className="h-3 w-3 mr-1 inline" />
                {format(todo.dueDate, "MMM d, yyyy")}
              </div>
            )}
          </div>
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
  );
};

export default TodoItem;
