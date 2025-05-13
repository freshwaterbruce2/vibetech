
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TodoFormProps {
  addTodo: (text: string, dueDate?: Date) => void;
}

const TodoForm = ({ addTodo }: TodoFormProps) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleAddTodo = () => {
    if (inputValue.trim() === "") return;
    addTodo(inputValue, selectedDate);
    setInputValue("");
    setSelectedDate(undefined);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTodo();
    }
  };

  return (
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
      
      <Button onClick={handleAddTodo} className="bg-aura-accent hover:bg-aura-accent/90">
        Add
      </Button>
    </div>
  );
};

export default TodoForm;
