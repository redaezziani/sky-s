"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
import { lotsApi, CreateLotDto, LotStatus } from "@/services/api/lots";
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

interface CreateLotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateLotDialog({ open, onOpenChange, onSuccess }: CreateLotDialogProps) {
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
  } = useForm<CreateLotDto>({
    defaultValues: {
      status: LotStatus.PENDING,
    },
  });

  const onSubmit = async (data: CreateLotDto) => {
    try {
      setLoading(true);
      await lotsApi.createLot(data);
      toast.success(t.pages.lots.createSuccess);
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to create lot:", error);
      toast.error(t.pages.lots.createError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.pages.lots.createLot}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">{t.pages.lots.companyName}</Label>
            <Input
              id="companyName"
              {...register("companyName", { required: t.common.required })}
              placeholder={t.pages.lots.companyNamePlaceholder}
            />
            {errors.companyName && (
              <p className="text-sm text-destructive">{errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyCity">{t.pages.lots.companyCity}</Label>
            <Input
              id="companyCity"
              {...register("companyCity", { required: t.common.required })}
              placeholder={t.pages.lots.companyCityPlaceholder}
            />
            {errors.companyCity && (
              <p className="text-sm text-destructive">{errors.companyCity.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalQuantity">{t.pages.lots.totalQuantity}</Label>
              <Input
                id="totalQuantity"
                type="number"
                {...register("totalQuantity", {
                  required: t.common.required,
                  valueAsNumber: true,
                  min: { value: 1, message: t.pages.lots.minQuantity },
                })}
                placeholder="100"
              />
              {errors.totalQuantity && (
                <p className="text-sm text-destructive">{errors.totalQuantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPrice">{t.pages.lots.totalPrice}</Label>
              <Input
                id="totalPrice"
                type="number"
                step="0.01"
                {...register("totalPrice", {
                  required: t.common.required,
                  valueAsNumber: true,
                  min: { value: 0, message: t.pages.lots.minPrice },
                })}
                placeholder="1000.00"
              />
              {errors.totalPrice && (
                <p className="text-sm text-destructive">{errors.totalPrice.message}</p>
              )}
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
              {loading ? t.common.creating : t.common.create}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
