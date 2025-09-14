import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface LimitSelectorProps {
  availableLimits: number[];
  currentLimit: number;
  onLimitChange: (limit: number) => void;
}

export default function LimitSelector({
  availableLimits = [10, 20, 50, 100],
  currentLimit = 10,
  onLimitChange,
}: LimitSelectorProps) {
  const [customLimit, setCustomLimit] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleCustomLimitSubmit = () => {
    const limit = parseInt(customLimit);
    if (!isNaN(limit) && limit > 0) {
      onLimitChange(limit);
      setShowCustomInput(false);
      setCustomLimit('');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={'sm'} className="">
          <span className="text-xs font-semibold">
             {currentLimit} items
          </span>
          <ChevronDown
            size={16}
            strokeWidth={2}
            className="ms-2 opacity-60"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel className="flex min-w-0 flex-col space-y-2">
          <span className="truncate text-xs font-semibold">
            Select items per page
          </span>
          {showCustomInput ? (
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Enter custom limit..."
                value={customLimit}
                onChange={(e) => setCustomLimit(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleCustomLimitSubmit()
                }
                className="h-8 text-xs"
                min="1"
              />
              <Button
                size="sm"
                onClick={handleCustomLimitSubmit}
                className="h-8"
              >
                Apply
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomInput(true)}
              className="w-full justify-start text-xs"
            >
              <Search className="mr-2 h-4 w-4" />
              Custom limit...
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[200px] overflow-y-auto overflow-x-hidden">
          {availableLimits.map((limit) => (
            <DropdownMenuItem
              key={limit}
              onClick={() => onLimitChange(limit)}
              className={currentLimit === limit ? 'bg-accent' : ''}
            >
              <span
                className={`text-xs font-semibold ${currentLimit === limit ? 'text-primary' : 'text-neutral-600'}`}
              >
                {limit} items
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
