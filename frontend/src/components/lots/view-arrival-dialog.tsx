"use client";

import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
import { LotArrival } from "@/services/api/lots";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ViewArrivalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arrival: LotArrival;
}

export function ViewArrivalDialog({ open, onOpenChange, arrival }: ViewArrivalDialogProps) {
  const { locale } = useLocale();
  const t = getMessages(locale);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t.pages.lotArrivals.arrivalDetails} #{arrival.arrivalId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t.pages.lotArrivals.quantity}
              </p>
              <p className="text-lg">{arrival.quantity}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t.pages.lotArrivals.price}
              </p>
              <p className="text-lg">{Number(arrival.price).toFixed(2)} MAD</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t.pages.lotArrivals.shippingCompany}
              </p>
              <p>{arrival.shippingCompany}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t.pages.lotArrivals.shippingCity}
              </p>
              <p>{arrival.shippingCompanyCity}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {t.pages.lotArrivals.status.label}
            </p>
            <Badge>{arrival.status}</Badge>
          </div>

          {arrival.pieceDetails && arrival.pieceDetails.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t.pages.lotArrivals.pieceDetails}
              </p>
              <div className="space-y-2">
                {arrival.pieceDetails.map((piece, idx) => (
                  <div key={idx} className="border rounded p-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{piece.name}</span>
                      <span>
                        {t.pages.lotArrivals.qty}: {piece.quantity}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">
                      {t.pages.lotArrivals.status.label}: {piece.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {arrival.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t.pages.lotArrivals.notes}
              </p>
              <p className="text-sm border rounded p-3 bg-muted/50">{arrival.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t.pages.lotArrivals.createdAt}
              </p>
              <p className="text-sm">
                {new Date(arrival.createdAt).toLocaleString(locale)}
              </p>
            </div>
            {arrival.verifiedAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t.pages.lotArrivals.verifiedAt}
                </p>
                <p className="text-sm">
                  {new Date(arrival.verifiedAt).toLocaleString(locale)}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
