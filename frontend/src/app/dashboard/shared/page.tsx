"use client"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Add this import
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react'; // Add this import
import { ChevronDown, Search } from 'lucide-react'; // Add Search icon

interface PageProps {
  total: number;
  limit: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function PageFilter({
  total = 0,
  limit = 0,
  currentPage = 1,
  onPageChange,
}: PageProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const countPages = () => {
    const pages = Math.ceil(total / limit);
    return pages;
  };

  const filteredPages = Array.from(
    { length: countPages() },
    (_, i) => i + 1
  ).filter((page) => page.toString().includes(searchTerm));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={'sm'} className="">
          <span className="text-xs font-semibold lowercase">
            Page {currentPage}
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
          <span className="truncate text-xs font-semibold lowercase">
            Select a page
          </span>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search page..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup className="max-h-[200px] overflow-y-auto overflow-x-hidden">
          <DropdownMenuSeparator />
          <div className="mt-4">
            {filteredPages.map((pageNum) => (
              <DropdownMenuItem
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={currentPage === pageNum ? 'bg-accent' : ''}
              >
                <span
                  className={`text-xs font-semibold lowercase ${currentPage === pageNum ? 'text-primary' : 'text-neutral-600'}`}
                >
                  Page {pageNum}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
