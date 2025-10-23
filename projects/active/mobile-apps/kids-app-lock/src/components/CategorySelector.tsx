import React from 'react';
import { TaskCategory, DEFAULT_CATEGORIES } from '../types/task';

interface CategorySelectorProps {
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string) => void;
  categories?: TaskCategory[];
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategoryId,
  onCategorySelect,
  categories = DEFAULT_CATEGORIES
}) => {
  return (
    <div className="category-selector">
      <h3 className="text-lg font-semibold mb-3">Categories</h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`
              px-3 py-2 rounded-full text-sm font-medium transition-colors
              flex items-center gap-2
              ${selectedCategoryId === category.id 
                ? 'text-white' 
                : 'text-gray-700 border border-gray-300'}
            `}
            style={{
              backgroundColor: selectedCategoryId === category.id ? category.color : 'transparent',
              borderColor: selectedCategoryId === category.id ? category.color : '#d1d5db'
            }}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};