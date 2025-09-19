"use client";

import { memo, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthService } from "@/services/auth.service";
import { Loader } from "../loader";
import {
  resendVerificationSchema,
  ResendVerificationFormData,
} from "@/types/validation.types";
import Link from "next/link";

interface ResendVerificationFormProps {
  className?: string;
}

// Memoized input field component to prevent unnecessary re-renders
const FormField = memo<{
  register: ReturnType<typeof useForm<ResendVerificationFormData>>["register"];
  name: keyof ResendVerificationFormData;
  label: string;
  type: string;
  placeholder?: string;
  error?: string;
}>(({ register, name, label, type, placeholder, error }) => (
  <div className="grid gap-2">
    <Label htmlFor={name}>{label}</Label>
    <Input
      {...register(name)}
      id={name}
      type={type}
      placeholder={placeholder}
      className={error ? "border-red-500" : ""}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
));

FormField.displayName = "FormField";

// Memoized submit button to prevent re-renders
const SubmitButton = memo<{ isSubmitting: boolean; isSuccess: boolean }>(
  ({ isSubmitting, isSuccess }) => (
    <Button
      type="submit"
      className="w-full"
      disabled={isSubmitting || isSuccess}
    >
      {isSubmitting ? (
        <span className="flex items-center">
          <Loader size={16} />
          <span className="ml-2">Sending verification email...</span>
        </span>
      ) : isSuccess ? (
        "Email Sent!"
      ) : (
        "Send Verification Email"
      )}
    </Button>
  )
);

SubmitButton.displayName = "SubmitButton";

export const ResendVerificationForm = memo<ResendVerificationFormProps>(
  ({ className }) => {
    const [isSuccess, setIsSuccess] = useState(false);
    const isSubmittingRef = useRef(false);

    const { register, handleSubmit, formState, watch } =
      useForm<ResendVerificationFormData>({
        resolver: zodResolver(resendVerificationSchema),
        mode: "onSubmit",
        defaultValues: {
          email: "",
        },
      });

    const { errors, isSubmitting } = formState;
    const email = watch("email");

    const onSubmit = useCallback(async (data: ResendVerificationFormData) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      try {
        await AuthService.resendEmailVerification(data);
        setIsSuccess(true);

        toast.success("Verification email sent!", {
          description:
            "If an account with that email exists, we've sent a new verification link.",
        });
      } catch (error: any) {
        console.error("Resend verification error:", error);
        toast.error("Failed to send verification email", {
          description: error?.message || "An error occurred. Please try again.",
        });
      } finally {
        isSubmittingRef.current = false;
      }
    }, []);

    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <Card className="border-none bg-transparent  ">
          <CardHeader>
            <CardTitle>Resend Email Verification</CardTitle>
            <CardDescription>
              {isSuccess
                ? "Check your email for a new verification link"
                : "Enter your email address and we'll send you a new verification link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
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
                        Verification email sent
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          We've sent a new verification link to{" "}
                          <span className="font-medium">{email}</span>. Please
                          check your email and follow the instructions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => setIsSuccess(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Send Another Email
                  </Button>

                  <div className="text-center text-sm text-gray-600">
                    Already verified?{" "}
                    <Link
                      href="/auth/login"
                      className="text-primary hover:underline"
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="flex flex-col gap-4">
                  <FormField
                    register={register}
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="m@example.com"
                    error={errors.email?.message}
                  />

                  <div className="flex flex-col gap-3">
                    <SubmitButton
                      isSubmitting={isSubmitting}
                      isSuccess={isSuccess}
                    />

                    <div className="text-center text-sm text-gray-600">
                      Already verified?{" "}
                      <Link
                        href="/auth/login"
                        className="text-primary hover:underline"
                      >
                        Sign in
                      </Link>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);

ResendVerificationForm.displayName = "ResendVerificationForm";
