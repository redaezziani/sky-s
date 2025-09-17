"use client";

import { useId } from "react";
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getMessages } from "@/lib/locale";
import { useLocale } from "@/components/local-lang-swither"; // LocaleProvider hook

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export default function PaginationTable({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const id = useId();
  const { locale } = useLocale();
  const t = getMessages(locale); // translation object

  // Ensure current pageSize is in the options
  const pageSizeOptions = [10, 25, 50, 100];
  if (!pageSizeOptions.includes(pageSize)) {
    pageSizeOptions.push(pageSize);
    pageSizeOptions.sort((a, b) => a - b);
  }

  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value);
    onPageSizeChange(newPageSize);
    onPageChange(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && totalPages > 1) {
      onPageChange(page);
    }
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-8">
      <div className="flex items-center gap-3">
        <Label htmlFor={id}>{t.pagination.rowsPerPage}</Label>
        <Select
          value={pageSize.toString()}
          onValueChange={handlePageSizeChange}
        >
          <SelectTrigger id={id} className="w-fit whitespace-nowrap">
            <SelectValue placeholder={t.pagination.selectRows} />
          </SelectTrigger>
          <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Page number info */}
      <div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
        <p aria-live="polite">
          <span className="text-foreground">
            {startItem}-{endItem}
          </span>{" "}
          {t.pagination.of}{" "}
          <span className="text-foreground">{totalItems}</span>
        </p>
      </div>

      {/* Pagination */}
      <div>
        <Pagination>
          <PaginationContent>
            {/* First */}
            <PaginationItem>
              <PaginationLink
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50 cursor-pointer"
                onClick={() => handlePageChange(1)}
                aria-label={t.pagination.firstPage}
                aria-disabled={
                  currentPage === 1 || totalPages <= 1 ? true : undefined
                }
              >
                <ChevronFirstIcon size={16} aria-hidden="true" />
              </PaginationLink>
            </PaginationItem>

            {/* Prev */}
            <PaginationItem>
              <PaginationLink
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50 cursor-pointer"
                onClick={() => handlePageChange(currentPage - 1)}
                aria-label={t.pagination.prevPage}
                aria-disabled={
                  currentPage === 1 || totalPages <= 1 ? true : undefined
                }
              >
                <ChevronLeftIcon size={16} aria-hidden="true" />
              </PaginationLink>
            </PaginationItem>

            {/* Next */}
            <PaginationItem>
              <PaginationLink
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50 cursor-pointer"
                onClick={() => handlePageChange(currentPage + 1)}
                aria-label={t.pagination.nextPage}
                aria-disabled={
                  currentPage === totalPages || totalPages <= 1
                    ? true
                    : undefined
                }
              >
                <ChevronRightIcon size={16} aria-hidden="true" />
              </PaginationLink>
            </PaginationItem>

            {/* Last */}
            <PaginationItem>
              <PaginationLink
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50 cursor-pointer"
                onClick={() => handlePageChange(totalPages)}
                aria-label={t.pagination.lastPage}
                aria-disabled={
                  currentPage === totalPages || totalPages <= 1
                    ? true
                    : undefined
                }
              >
                <ChevronLastIcon size={16} aria-hidden="true" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
