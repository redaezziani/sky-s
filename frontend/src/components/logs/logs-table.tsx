"use client";

import { useState } from "react";
import { DataTable, TableColumn } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { LogEntry } from "@/services/api/logs";
import { LogDetailsDialog } from "./log-details-dialog";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
import { format } from "date-fns";
import PaginationTable from "@/components/pagination-table";

interface LogsTableProps {
  logs: LogEntry[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function LogsTable({
  logs,
  loading,
  pagination,
  onPageChange,
  searchValue = "",
  onSearchChange,
}: LogsTableProps) {
  const { locale } = useLocale();
  const t = getMessages(locale);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getActionColor = (action?: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "UPDATE":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "DELETE":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "CANCEL":
      case "REFUND":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
      case "LOGIN":
      case "LOGOUT":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    }
  };

  const handleViewDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const columns: TableColumn<LogEntry>[] = [
    {
      key: "timestamp",
      label: t.pages.logs.table.timestamp,
      render: (log) => (
        <span className="font-mono text-sm">
          {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
        </span>
      ),
    },
    {
      key: "userName",
      label: t.pages.logs.table.user,
      render: (log) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {log.userName || "System"}
          </span>
          {log.userEmail && (
            <span className="text-xs text-muted-foreground">
              {log.userEmail}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "action",
      label: t.pages.logs.table.action,
      render: (log) => (
        log.action ? (
          <Badge variant="secondary" className={getActionColor(log.action)}>
            {t.pages.logs.actions[log.action as keyof typeof t.pages.logs.actions]}
          </Badge>
        ) : null
      ),
    },
    {
      key: "entity",
      label: t.pages.logs.table.entity,
      render: (log) => (
        <span className="text-sm">{log.entity || "-"}</span>
      ),
    },
    {
      key: "message",
      label: t.pages.logs.table.description,
      render: (log) => (
        <p className="text-sm line-clamp-2">{log.message}</p>
      ),
    },
    {
      key: "details",
      label: t.pages.logs.table.details,
      render: (log) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(log)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">{t.pages.logs.table.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DataTable
        title={t.pages.logs.title}
        data={logs}
        columns={columns}
        searchKeys={["userName", "userEmail", "action", "entity", "message"]}
        searchPlaceholder={t.pages.logs.table.searchPlaceholder}
        emptyMessage={t.pages.logs.table.noLogs}
        showCount
        searchValue={searchValue}
        onSearchChange={onSearchChange}
      />

      {/* Pagination */}
      {pagination.total > 0 && (
        <PaginationTable
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          pageSize={pagination.limit}
          totalItems={pagination.total}
          onPageChange={onPageChange}
          onPageSizeChange={(newPageSize) => {
            // This would need to be passed as a prop if you want to support changing page size
            console.log("Page size change not implemented yet:", newPageSize);
          }}
        />
      )}

      {/* Details Dialog */}
      {selectedLog && (
        <LogDetailsDialog
          log={selectedLog}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  );
}
