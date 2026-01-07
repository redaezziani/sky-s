"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
import { lotsApi, UpdateLotArrivalDto, LotArrival, ArrivalStatus } from "@/services/api/lots";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

interface VerifyArrivalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arrival: LotArrival;
  onSuccess: () => void;
}

export function VerifyArrivalDialog({
  open,
  onOpenChange,
  arrival,
  onSuccess,
}: VerifyArrivalDialogProps) {
  const { locale } = useLocale();
  const t = getMessages(locale);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<UpdateLotArrivalDto>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pieceDetails",
  });

  useEffect(() => {
    if (arrival) {
      reset({
        quantity: arrival.quantity,
        price: arrival.price,
        shippingCompany: arrival.shippingCompany,
        shippingCompanyCity: arrival.shippingCompanyCity,
        pieceDetails: arrival.pieceDetails || [],
        status: arrival.status,
        notes: arrival.notes || "",
      });
    }
  }, [arrival, reset]);

  const onSubmit = async (data: UpdateLotArrivalDto) => {
    try {
      setLoading(true);
      await lotsApi.updateLotArrival(arrival.id, data);
      toast.success(t.pages.lotArrivals.updateSuccess);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to update lot arrival:", error);
      toast.error(t.pages.lotArrivals.updateError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t.pages.lotArrivals.verifyArrival} #{arrival.arrivalId}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">{t.pages.lotArrivals.quantity}</Label>
              <Input
                id="quantity"
                type="number"
                {...register("quantity", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{t.pages.lotArrivals.price}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingCompany">{t.pages.lotArrivals.shippingCompany}</Label>
            <Input id="shippingCompany" {...register("shippingCompany")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingCompanyCity">{t.pages.lotArrivals.shippingCity}</Label>
            <Input id="shippingCompanyCity" {...register("shippingCompanyCity")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t.pages.lotArrivals.status.label}</Label>
            <Select
              value={watch("status")}
              onValueChange={(value) => setValue("status", value as ArrivalStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ArrivalStatus.PENDING}>{t.pages.lotArrivals.status.pending}</SelectItem>
                <SelectItem value={ArrivalStatus.VERIFIED}>{t.pages.lotArrivals.status.verified}</SelectItem>
                <SelectItem value={ArrivalStatus.DAMAGED}>{t.pages.lotArrivals.status.damaged}</SelectItem>
                <SelectItem value={ArrivalStatus.INCOMPLETE}>{t.pages.lotArrivals.status.incomplete}</SelectItem>
                <SelectItem value={ArrivalStatus.EXCESS}>{t.pages.lotArrivals.status.excess}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>{t.pages.lotArrivals.pieceDetails}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: "", quantity: 0, status: "" })}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t.pages.lotArrivals.addPiece}
              </Button>
            </div>

            <div className="space-y-2 border rounded-lg p-3 max-h-[200px] overflow-y-auto">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      {...register(`pieceDetails.${index}.name`)}
                      placeholder={t.pages.lotArrivals.pieceName}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      {...register(`pieceDetails.${index}.quantity`, { valueAsNumber: true })}
                      placeholder={t.pages.lotArrivals.qty}
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      {...register(`pieceDetails.${index}.status`)}
                      placeholder={t.pages.lotArrivals.status.label}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t.pages.lotArrivals.notes}</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder={t.pages.lotArrivals.notesPlaceholder}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t.common.updating : t.pages.lotArrivals.verify}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
