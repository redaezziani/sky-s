"use client";

import type React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BarcodeInputProps {
  onScan: (barcode: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

export function BarcodeInput({
  onScan,
  placeholder = "Scan or type barcode...",
  label = "Barcode",
  className,
  autoFocus = false,
  disabled = false,
  readOnly = false,
}: BarcodeInputProps) {
  const [value, setValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!readOnly) {
      setValue(e.target.value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      e.preventDefault();
      handleScan();
    }
  };

  const handleScan = async () => {
    if (!value.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      await onScan(value.trim());
      setShowSuccess(true);
      setValue("");

      // Hide success indicator after 1 second
      setTimeout(() => {
        setShowSuccess(false);
      }, 1000);
    } catch (error) {
      // Error handling is done by parent component
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="barcode-input" className="flex items-center gap-2">
        <Scan className="h-4 w-4" />
        {label}
      </Label>
      <div className="relative">
        <Input
          id="barcode-input"
          className="barcode-input pr-10"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled || isProcessing}
          readOnly={readOnly}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isProcessing && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {showSuccess && (
            <CheckCircle2 className="h-4 w-4 text-green-500 animate-in fade-in zoom-in" />
          )}
        </div>
      </div>
    </div>
  );
}
