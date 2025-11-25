
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import CategorySelector from "./CategorySelector";
import PrioritySelector from "./PrioritySelector";
import { TodoPriority } from "./types";

interface TodoFormProps {
  addTodo: (text: string, dueDate?: Date, category?: string, priority?: TodoPriority) => void;
  categories: string[];
}

const TodoForm = ({ addTodo, categories }: TodoFormProps) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string>("general");
  const [selectedPriority, setSelectedPriority] = useState<TodoPriority>("medium");

  const handleAddTodo = () => {
    if (inputValue.trim() === "") return;
    addTodo(inputValue, selectedDate, selectedCategory, selectedPriority);
    setInputValue("");
    setSelectedDate(undefined);
    setSelectedCategory("general");
    setSelectedPriority("medium");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTodo();
    }
  };

  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
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
        
        <Button onClick={handleAddTodo} className="bg-aura-accent hover:bg-aura-accent/90">
          Add
        </Button>
      </div>
      
      <div className="flex gap-2">
        <div className="flex-1">
          <CategorySelector
            value={selectedCategory}
            onChange={setSelectedCategory}
            categories={categories}
          />
        </div>
        <div className="flex-1">
          <PrioritySelector
            value={selectedPriority}
            onChange={setSelectedPriority}
          />
        </div>
      </div>
    </div>
  );
};

export default TodoForm;
