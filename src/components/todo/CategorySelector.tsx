
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
}

const CategorySelector = ({ value, onChange, categories }: CategorySelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select category">
          {value && (
            <Badge variant="secondary" className="text-xs">
              {value}
            </Badge>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category} value={category}>
            <Badge variant="outline" className="text-xs">
              {category}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CategorySelector;
