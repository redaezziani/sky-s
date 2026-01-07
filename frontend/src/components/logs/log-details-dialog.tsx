"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LogEntry } from "@/services/api/logs";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
import { format } from "date-fns";

interface LogDetailsDialogProps {
  log: LogEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogDetailsDialog({
  log,
  open,
  onOpenChange,
}: LogDetailsDialogProps) {
  const { locale } = useLocale();
  const t = getMessages(locale);

  const DetailRow = ({ label, value }: { label: string; value: any }) => {
    if (!value) return null;

    return (
      <div className="grid grid-cols-3 gap-4 py-2 border-b">
        <div className="font-medium text-sm text-muted-foreground">{label}</div>
        <div className="col-span-2 text-sm break-all">
          {typeof value === "object" ? (
            <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(value, null, 2)}
            </pre>
          ) : (
            value
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.pages.logs.details.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          <DetailRow
            label={t.pages.logs.details.timestamp}
            value={format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
          />

          {log.userName && (
            <DetailRow label={t.pages.logs.details.userName} value={log.userName} />
          )}

          {log.userEmail && (
            <DetailRow label={t.pages.logs.details.userEmail} value={log.userEmail} />
          )}

          {log.userRole && (
            <DetailRow label={t.pages.logs.details.userRole} value={log.userRole} />
          )}

          {log.action && (
            <div className="grid grid-cols-3 gap-4 py-2 border-b">
              <div className="font-medium text-sm text-muted-foreground">
                {t.pages.logs.details.action}
              </div>
              <div className="col-span-2">
                <Badge variant="secondary">
                  {t.pages.logs.actions[log.action as keyof typeof t.pages.logs.actions]}
                </Badge>
              </div>
            </div>
          )}

          {log.entity && (
            <DetailRow label={t.pages.logs.details.entity} value={log.entity} />
          )}

          {log.entityId && (
            <DetailRow label={t.pages.logs.details.entityId} value={log.entityId} />
          )}

          <DetailRow
            label={t.pages.logs.details.description}
            value={log.message}
          />

          {log.metadata && (
            <DetailRow
              label={t.pages.logs.details.metadata}
              value={log.metadata}
            />
          )}

          {log.ipAddress && (
            <DetailRow
              label={t.pages.logs.details.ipAddress}
              value={log.ipAddress}
            />
          )}

          {log.userAgent && (
            <DetailRow
              label={t.pages.logs.details.userAgent}
              value={log.userAgent}
            />
          )}

          {log.stack && (
            <DetailRow label="Stack Trace" value={log.stack} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
