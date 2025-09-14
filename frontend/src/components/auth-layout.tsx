"use client";

import { ReactNode } from "react";
import Link from "next/link";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center bg-blue-600">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Sky-S Platform</h1>
            <p className="text-xl text-blue-100">
              Your secure authentication portal
            </p>
          </div>
        </div>

        {/* Right side - Content */}
        <div className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
