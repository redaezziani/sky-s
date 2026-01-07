"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
import { lotsApi, UpdateLotDto, LotStatus, Lot } from "@/services/api/lots";
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

interface EditLotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lot: Lot;
  onSuccess: () => void;
}

export function EditLotDialog({ open, onOpenChange, lot, onSuccess }: EditLotDialogProps) {
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
  } = useForm<UpdateLotDto>();

  useEffect(() => {
    if (lot) {
      reset({
        companyName: lot.companyName,
        companyCity: lot.companyCity,
        totalQuantity: lot.totalQuantity,
        totalPrice: lot.totalPrice,
        status: lot.status,
        notes: lot.notes || "",
      });
    }
  }, [lot, reset]);

  const onSubmit = async (data: UpdateLotDto) => {
    try {
      setLoading(true);
      await lotsApi.updateLot(lot.id, data);
      toast.success(t.pages.lots.updateSuccess);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to update lot:", error);
      toast.error(t.pages.lots.updateError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.pages.lots.editLot} #{lot.lotId}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">{t.pages.lots.companyName}</Label>
            <Input
              id="companyName"
              {...register("companyName")}
              placeholder={t.pages.lots.companyNamePlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyCity">{t.pages.lots.companyCity}</Label>
            <Input
              id="companyCity"
              {...register("companyCity")}
              placeholder={t.pages.lots.companyCityPlaceholder}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalQuantity">{t.pages.lots.totalQuantity}</Label>
              <Input
                id="totalQuantity"
                type="number"
                {...register("totalQuantity", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPrice">{t.pages.lots.totalPrice}</Label>
              <Input
                id="totalPrice"
                type="number"
                step="0.01"
                {...register("totalPrice", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t.pages.lots.status.label}</Label>
            <Select
              value={watch("status")}
              onValueChange={(value) => setValue("status", value as LotStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LotStatus.PENDING}>{t.pages.lots.status.pending}</SelectItem>
                <SelectItem value={LotStatus.IN_TRANSIT}>{t.pages.lots.status.inTransit}</SelectItem>
                <SelectItem value={LotStatus.ARRIVED}>{t.pages.lots.status.arrived}</SelectItem>
                <SelectItem value={LotStatus.VERIFIED}>{t.pages.lots.status.verified}</SelectItem>
                <SelectItem value={LotStatus.COMPLETED}>{t.pages.lots.status.completed}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t.pages.lots.notes}</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder={t.pages.lots.notesPlaceholder}
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
              {loading ? t.common.updating : t.common.update}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
