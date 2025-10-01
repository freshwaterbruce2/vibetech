import React from 'react'
import { ChevronDown, SortAsc, SortDesc } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SearchSorting } from '@/types/liteapi'

interface SearchSortingProps {
  sorting: SearchSorting
  onSortingChange: (sorting: SearchSorting) => void
}

const SearchSorting: React.FC<SearchSortingProps> = ({ sorting, onSortingChange }) => {
  const sortOptions = [
    { field: 'popularity' as const, label: 'Popularity', description: 'Most booked first' },
    { field: 'price' as const, label: 'Price', description: 'Low to high' },
    { field: 'rating' as const, label: 'Guest Rating', description: 'Highest rated first' },
    { field: 'stars' as const, label: 'Star Rating', description: '5 to 1 stars' },
    { field: 'distance' as const, label: 'Distance', description: 'Closest first' },
  ]

  const currentOption = sortOptions.find(option => option.field === sorting.field)

  const handleSortChange = (field: SearchSorting['field']) => {
    // If same field, toggle direction; otherwise use default direction
    const direction = field === sorting.field && sorting.direction === 'asc' ? 'desc' :
                     field === 'price' ? 'asc' : 'desc'

    onSortingChange({ field, direction })
  }

  const getSortIcon = () => {
    if (sorting.direction === 'asc') {
      return <SortAsc className="w-4 h-4 ml-1" />
    } else {
      return <SortDesc className="w-4 h-4 ml-1" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <span className="hidden sm:inline">Sort by:</span>
          <span className="font-medium">{currentOption?.label}</span>
          {getSortIcon()}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.field}
            onClick={() => handleSortChange(option.field)}
            className="flex flex-col items-start gap-1 p-3"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium">{option.label}</span>
              {sorting.field === option.field && getSortIcon()}
            </div>
            <span className="text-sm text-gray-500">{option.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SearchSorting