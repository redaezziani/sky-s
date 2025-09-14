"use client";

import { memo, useCallback, useRef } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import { Loader } from "./loader";
import { registerSchema, RegisterFormData } from "@/types/validation.types";
import Link from "next/link";

interface RegisterFormProps {
  className?: string;
}

// Memoized input field component to prevent unnecessary re-renders
const FormField = memo<{
  register: ReturnType<typeof useForm<RegisterFormData>>["register"];
  name: keyof RegisterFormData;
  label: string;
  type: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}>(({ register, name, label, type, placeholder, error, required = false }) => (
  <div className="grid gap-2">
    <Label htmlFor={name}>
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
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
const SubmitButton = memo<{ isSubmitting: boolean }>(({ isSubmitting }) => (
  <Button type="submit" className="w-full" disabled={isSubmitting}>
    {isSubmitting ? (
      <span className="flex items-center">
        <Loader size={16} />
        <span className="ml-2">Creating account...</span>
      </span>
    ) : (
      "Create Account"
    )}
  </Button>
));

SubmitButton.displayName = "SubmitButton";

export const RegisterForm = memo<RegisterFormProps>(({ className }) => {
  const router = useRouter();
  const { login } = useAuth();
  const isSubmittingRef = useRef(false);

  const { register, handleSubmit, formState } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const { errors, isSubmitting } = formState;

  const onSubmit = useCallback(
    async (data: RegisterFormData) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      try {
        const response = await AuthService.register(data);
        await login(response);

        toast.success("Account created successfully!", {
          description: "Welcome! Please check your email to verify your account.",
        });

        // Navigate to dashboard
        router.push("/dashboard");
      } catch (error: any) {
        console.error("Registration error:", error);
        toast.error("Registration failed", {
          description: error?.message || "An error occurred while creating your account.",
        });
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [router, login]
  );

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Enter your information to create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-4">
              <FormField
                register={register}
                name="name"
                label="Full Name"
                type="text"
                placeholder="John Doe"
                error={errors.name?.message}
              />

              <FormField
                register={register}
                name="email"
                label="Email"
                type="email"
                placeholder="m@example.com"
                error={errors.email?.message}
                required
              />

              <FormField
                register={register}
                name="password"
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                error={errors.password?.message}
                required
              />

              <div className="flex flex-col gap-3">
                <SubmitButton isSubmitting={isSubmitting} />
                
                <div className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
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
        </CardContent>
      </Card>
    </div>
  );
});

RegisterForm.displayName = "RegisterForm";
