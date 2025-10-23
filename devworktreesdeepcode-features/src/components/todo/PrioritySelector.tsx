
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TodoPriority } from "./types";

interface PrioritySelectorProps {
  value: TodoPriority;
  onChange: (value: TodoPriority) => void;
}

const priorityColors = {
  low: "bg-green-100 text-green-800 border-green-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300", 
  high: "bg-red-100 text-red-800 border-red-300"
};

const PrioritySelector = ({ value, onChange }: PrioritySelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue>
          <Badge className={`text-xs ${priorityColors[value]}`}>
            {value}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(['low', 'medium', 'high'] as TodoPriority[]).map((priority) => (
          <SelectItem key={priority} value={priority}>
            <Badge className={`text-xs ${priorityColors[priority]}`}>
              {priority}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default PrioritySelector;
