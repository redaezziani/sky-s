"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { XIcon, ImageIcon, UploadIcon, AlertCircleIcon } from "lucide-react";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

export interface MultiImageUploaderProps {
  value?: File[];
  onChange?: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export function MultiImageUploader({
  value = [],
  onChange,
  maxFiles = 6,
  maxSizeMB = 5,
}: MultiImageUploaderProps) {
  const { locale } = useLocale();
  const t = getMessages(locale).multiImageUploader;

  const [files, setFiles] = useState<File[]>(value);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setFiles(value);
  }, [value]);

  const handleFilesChange = (selected: FileList | null) => {
    if (!selected) return;
    const newFiles: File[] = Array.from(selected);
    const validFiles: File[] = [];
    const newErrors: string[] = [];

    newFiles.forEach((file) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        newErrors.push(t.errors.maxSize.replace("{name}", file.name));
      } else {
        validFiles.push(file);
      }
    });

    const combined = [...files, ...validFiles].slice(0, maxFiles);
    setFiles(combined);
    setErrors(newErrors);
    onChange?.(combined);
  };

  const removeFile = (index: number) => {
    const updated = [...files];
    updated.splice(index, 1);
    setFiles(updated);
    onChange?.(updated);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Drop / Upload Area */}
      <div className="border-input relative flex min-h-40 flex-col items-center overflow-hidden rounded-xl border border-dashed p-4">
        <input
          type="file"
          multiple
          accept="image/*"
          className="sr-only"
          id="multi-upload-input"
          onChange={(e) => handleFilesChange(e.target.files)}
        />
        {files.length === 0 ? (
          <label
            htmlFor="multi-upload-input"
            className="flex cursor-pointer flex-col items-center justify-center text-center"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border bg-background">
              <ImageIcon className="h-5 w-5 opacity-60" />
            </div>
            <p className="text-sm font-medium">{t.dropHere}</p>
            <p className="text-xs text-muted-foreground">
              {t.formats.replace("{maxSizeMB}", String(maxSizeMB))}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() =>
                document.getElementById("multi-upload-input")?.click()
              }
            >
              <UploadIcon className="mr-1 h-4 w-4" /> {t.selectImages}
            </Button>
          </label>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {files.map((file, i) => {
              const url = URL.createObjectURL(file);
              return (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-md"
                >
                  <img
                    src={url}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                  <Button
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => removeFile(i)}
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div
          className="flex items-center gap-1 text-destructive text-xs"
          role="alert"
        >
          <AlertCircleIcon className="h-3 w-3" />
          <span>{errors[0]}</span>
        </div>
      )}
    </div>
  );
}
