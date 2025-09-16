"use client";

import { memo, useCallback, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthService } from "@/services/auth.service";
import { Loader } from "../loader";
import Link from "next/link";

interface VerifyEmailFormProps {
  className?: string;
  token: string;
}

export const VerifyEmailForm = memo<VerifyEmailFormProps>(
  ({ className, token }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const hasAttemptedRef = useRef(false);

    const verifyEmail = useCallback(async () => {
      if (hasAttemptedRef.current) return;
      hasAttemptedRef.current = true;

      try {
        await AuthService.verifyEmail({ token });
        setIsSuccess(true);
        setError(null);

        toast.success("Email verified successfully!", {
          description:
            "Your email has been verified. You can now use all features of your account.",
        });

        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } catch (error: any) {
        console.error("Email verification error:", error);
        setError(
          error?.message || "The verification token may be invalid or expired."
        );
        setIsSuccess(false);
      } finally {
        setIsLoading(false);
      }
    }, [token, router]);

    useEffect(() => {
      verifyEmail();
    }, [verifyEmail]);

    const retryVerification = useCallback(() => {
      setIsLoading(true);
      setError(null);
      hasAttemptedRef.current = false;
      verifyEmail();
    }, [verifyEmail]);

    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <Card>
          <CardHeader>
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>
              {isLoading
                ? "Verifying your email address..."
                : isSuccess
                ? "Your email has been verified successfully"
                : "Failed to verify your email address"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader size={32} />
                <p className="text-sm text-gray-600 text-center">
                  Please wait while we verify your email address...
                </p>
              </div>
            ) : isSuccess ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Email verified successfully
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          Your email address has been verified. You will be
                          redirected to the login page shortly.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    href="/auth/login"
                    className="text-primary hover:underline text-sm"
                  >
                    Go to Login Page
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Verification failed
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={retryVerification}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <Loader size={16} />
                        <span className="ml-2">Retrying...</span>
                      </span>
                    ) : (
                      "Try Again"
                    )}
                  </Button>

                  <div className="text-center text-sm text-gray-600">
                    <Link
                      href="/auth/resend-verification"
                      className="text-primary hover:underline"
                    >
                      Request a new verification link
                    </Link>
                  </div>

                  <div className="text-center text-sm text-gray-600">
                    <Link
                      href="/auth/login"
                      className="text-primary hover:underline"
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);

VerifyEmailForm.displayName = "VerifyEmailForm";
