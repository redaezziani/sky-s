"use client";

import { memo, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
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
import { Loader } from "./loader";
import { resetPasswordSchema, ResetPasswordFormData } from "@/types/validation.types";
import Link from "next/link";

interface ResetPasswordFormProps {
  className?: string;
  token: string;
}

// Memoized input field component to prevent unnecessary re-renders
const FormField = memo<{
  register: ReturnType<typeof useForm<ResetPasswordFormData>>["register"];
  name: keyof ResetPasswordFormData;
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
    <Button type="submit" className="w-full" disabled={isSubmitting || isSuccess}>
      {isSubmitting ? (
        <span className="flex items-center">
          <Loader size={16} />
          <span className="ml-2">Resetting password...</span>
        </span>
      ) : isSuccess ? (
        "Password Reset!"
      ) : (
        "Reset Password"
      )}
    </Button>
  )
);

SubmitButton.displayName = "SubmitButton";

export const ResetPasswordForm = memo<ResetPasswordFormProps>(({ className, token }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const isSubmittingRef = useRef(false);

  const { register, handleSubmit, formState, setValue } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onSubmit",
    defaultValues: {
      token: token,
      newPassword: "",
    },
  });

  // Set the token when component mounts
  setValue("token", token);

  const { errors, isSubmitting } = formState;

  const onSubmit = useCallback(
    async (data: ResetPasswordFormData) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      try {
        await AuthService.resetPassword(data);
        setIsSuccess(true);

        toast.success("Password reset successful!", {
          description: "Your password has been reset. You can now sign in with your new password.",
        });

        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } catch (error: any) {
        console.error("Reset password error:", error);
        toast.error("Failed to reset password", {
          description: error?.message || "The reset token may be invalid or expired.",
        });
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [router]
  );

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            {isSuccess 
              ? "Your password has been reset successfully"
              : "Enter your new password below"
            }
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
                      Password reset successful
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>
                        Your password has been reset successfully. 
                        You will be redirected to the login page shortly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link 
                  href="/auth/login" 
                  className="text-blue-600 hover:underline text-sm"
                >
                  Go to Login Page
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="flex flex-col gap-4">
                <FormField
                  register={register}
                  name="newPassword"
                  label="New Password"
                  type="password"
                  placeholder="At least 8 characters"
                  error={errors.newPassword?.message}
                />

                <div className="flex flex-col gap-3">
                  <SubmitButton isSubmitting={isSubmitting} isSuccess={isSuccess} />
                  
                  <div className="text-center text-sm text-gray-600">
                    Remember your password?{" "}
                    <Link 
                      href="/auth/login" 
                      className="text-blue-600 hover:underline"
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
});

ResetPasswordForm.displayName = "ResetPasswordForm";
