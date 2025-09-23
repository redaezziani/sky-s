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
import { Loader } from "../loader";
import { loginSchema, LoginFormData } from "@/types/validation.types";
import Link from "next/link";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

interface LoginFormProps {
  className?: string;
}

// Memoized input field component to prevent unnecessary re-renders
const FormField = memo<{
  register: ReturnType<typeof useForm<LoginFormData>>["register"];
  name: keyof LoginFormData;
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
const SubmitButton = memo<{ isSubmitting: boolean; t: any }>(
  ({ isSubmitting, t }) => (
    <Button type="submit" className="w-full" disabled={isSubmitting}>
      {isSubmitting ? (
        <span className="flex items-center">
          <Loader size={16} />
          <span className="ml-2">{t.login.loggingIn}</span>
        </span>
      ) : (
        t.login.login
      )}
    </Button>
  )
);

SubmitButton.displayName = "SubmitButton";

export const LoginForm = memo<LoginFormProps>(({ className }) => {
  const router = useRouter();
  const { login } = useAuth();
  const isSubmittingRef = useRef(false);
  const { locale } = useLocale();
  const t = getMessages(locale).pages;
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { errors, isSubmitting } = form.formState;

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      try {
        const response = await AuthService.login({ ...data }); // backend should accept this field
        await login(response);

        router.push("/dashboard");
      } catch (error: any) {
        console.error("Login error:", error);
        toast.error(t.login.toast.failed, {
          description: error?.message || t.login.toast.invalid,
        });
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [router, login, t]
  );
  

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card className="border-none bg-transparent  ">
        <CardHeader>
          <CardTitle>{t.login.title}</CardTitle>
          <CardDescription>{t.login.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-4">
              <FormField
                register={form.register}
                name="email"
                label={t.login.email}
                type="email"
                placeholder="m@example.com"
                error={errors.email?.message}
              />

              <FormField
                register={form.register}
                name="password"
                label={t.login.password}
                type="password"
                error={errors.password?.message}
              />

              <div className="flex flex-col gap-3">
                <SubmitButton isSubmitting={isSubmitting} t={t} />

                <div className="text-center text-sm text-gray-600">
                  <Link
                    href="/auth/forgot-password"
                    className="text-primary hover:underline"
                  >
                    {t.login.forgotPassword}
                  </Link>
                </div>

                <div className="text-center text-sm text-gray-600">
                  {t.login.noAccount}{" "}
                  <Link
                    href="/auth/register"
                    className="text-primary hover:underline"
                  >
                    {t.login.signUp}
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

LoginForm.displayName = "LoginForm";