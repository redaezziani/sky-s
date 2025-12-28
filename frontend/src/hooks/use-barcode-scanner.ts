"use client";

import { useEffect, useRef, useState } from "react";

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
  timeout?: number;
}

export function useBarcodeScanner({
  onScan,
  minLength = 3,
  timeout = 100,
}: BarcodeScannerOptions) {
  const [isScanning, setIsScanning] = useState(false);
  const bufferRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in ANY input field or textarea
      // The BarcodeInput component handles its own scanning
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Enter key typically signals end of barcode scan
      if (e.key === "Enter") {
        e.preventDefault();
        if (bufferRef.current.length >= minLength) {
          setIsScanning(false);
          onScan(bufferRef.current);
          bufferRef.current = "";
        }
        return;
      }

      // Add character to buffer if it's alphanumeric or hyphen/underscore
      if (/^[a-zA-Z0-9\-_]$/.test(e.key)) {
        e.preventDefault();
        setIsScanning(true);
        bufferRef.current += e.key;

        // Set timeout to auto-trigger scan
        timeoutRef.current = setTimeout(() => {
          if (bufferRef.current.length >= minLength) {
            setIsScanning(false);
            onScan(bufferRef.current);
            bufferRef.current = "";
          } else {
            bufferRef.current = "";
            setIsScanning(false);
          }
        }, timeout);
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onScan, minLength, timeout]);

  return { isScanning };
}
