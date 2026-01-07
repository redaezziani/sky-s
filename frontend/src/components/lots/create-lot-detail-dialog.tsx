"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
import { lotsApi, CreateLotDetailDto, Lot, PieceDetail } from "@/services/api/lots";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface CreateLotDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lot: Lot;
  onSuccess: () => void;
}

export function CreateLotDetailDialog({
  open,
  onOpenChange,
  lot,
  onSuccess,
}: CreateLotDetailDialogProps) {
  const { locale } = useLocale();
  const t = getMessages(locale);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<CreateLotDetailDto>({
    defaultValues: {
      lotId: lot.id,
      pieceDetails: [{ name: "", quantity: 1, status: "new" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pieceDetails",
  });

  const onSubmit = async (data: CreateLotDetailDto) => {
    try {
      setLoading(true);
      await lotsApi.createLotDetail({ ...data, lotId: lot.id });
      toast.success(t.pages.lots.createDetailSuccess);
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to create lot detail:", error);
      toast.error(t.pages.lots.createDetailError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t.pages.lots.createDetail} - {t.pages.lots.lot} #{lot.lotId}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">{t.pages.lots.quantity}</Label>
              <Input
                id="quantity"
                type="number"
                {...register("quantity", {
                  required: t.common.required,
                  valueAsNumber: true,
                  min: { value: 1, message: t.pages.lots.minQuantity },
                })}
                placeholder="10"
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{t.pages.lots.price}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", {
                  required: t.common.required,
                  valueAsNumber: true,
                  min: { value: 0, message: t.pages.lots.minPrice },
                })}
                placeholder="299.99"
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingCompany">{t.pages.lots.shippingCompany}</Label>
            <Input
              id="shippingCompany"
              {...register("shippingCompany", { required: t.common.required })}
              placeholder="FedEx"
            />
            {errors.shippingCompany && (
              <p className="text-sm text-destructive">{errors.shippingCompany.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingCompanyCity">{t.pages.lots.shippingCity}</Label>
            <Input
              id="shippingCompanyCity"
              {...register("shippingCompanyCity", { required: t.common.required })}
              placeholder="Los Angeles"
            />
            {errors.shippingCompanyCity && (
              <p className="text-sm text-destructive">{errors.shippingCompanyCity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>{t.pages.lots.pieceDetails}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: "", quantity: 1, status: "new" })}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t.pages.lots.addPiece}
              </Button>
            </div>

            <div className="space-y-2 border rounded-lg p-3 max-h-[200px] overflow-y-auto">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      {...register(`pieceDetails.${index}.name`, { required: true })}
                      placeholder={t.pages.lots.pieceName}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      {...register(`pieceDetails.${index}.quantity`, {
                        required: true,
                        valueAsNumber: true,
                        min: 1,
                      })}
                      placeholder={t.pages.lots.qty}
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      {...register(`pieceDetails.${index}.status`)}
                      placeholder={t.pages.lots.status.label}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
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
