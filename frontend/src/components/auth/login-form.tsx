'use client';

import { memo, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthService } from '@/services/auth.service';
import { useAuth } from '@/hooks/use-auth';
import { Loader } from '../loader';
import { loginSchema, LoginFormData } from '@/types/validation.types';
import { useTranslations } from 'next-intl';

interface LoginFormProps {
  className?: string;
}

// Memoized input field component to prevent unnecessary re-renders
const FormField = memo<{
  register: ReturnType<typeof useForm<LoginFormData>>['register'];
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
      className={error ? 'border-red-500' : ''}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
));

FormField.displayName = 'FormField';

// Memoized submit button to prevent re-renders
const SubmitButton = memo<{
  isSubmitting: boolean;
  loggingInText: string;
  loginText: string;
}>(({ isSubmitting, loggingInText, loginText }) => (
  <Button type="submit" className="w-full" disabled={isSubmitting}>
    {isSubmitting ? (
      <span className="flex items-center">
        <Loader size={16} />
        <span className="ml-2">{loggingInText}</span>
      </span>
    ) : (
      loginText
    )}
  </Button>
));

SubmitButton.displayName = 'SubmitButton';

export const LoginForm = memo<LoginFormProps>(({ className }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const isSubmittingRef = useRef(false);
  const t = useTranslations('pages.login');
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { errors, isSubmitting } = form.formState;

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      try {
        const response = await AuthService.login({ ...data });
        await login(response);

        // Get the return URL from query params or default to dashboard
        const returnUrl = searchParams?.get('returnUrl');
        const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/dashboard';

        router.push(redirectTo);
      } catch (error: unknown) {
        console.error('Login error:', error);
        const errorMessage = error instanceof Error ? error.message : t('toast.invalid');
        toast.error(t('toast.failed'), {
          description: errorMessage,
        });
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [router, login, t, searchParams],
  );

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Card className="border-none bg-transparent  ">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(onSubmit)(e);
            }}
            noValidate
          >
            <div className="flex flex-col gap-4">
              <FormField
                register={form.register}
                name="email"
                label={t('email')}
                type="email"
                placeholder="m@example.com"
                error={errors.email?.message}
              />

              <FormField
                register={form.register}
                name="password"
                label={t('password')}
                type="password"
                error={errors.password?.message}
              />

              <div className="flex flex-col gap-3">
                <SubmitButton
                  isSubmitting={isSubmitting}
                  loggingInText={t('loggingIn')}
                  loginText={t('login')}
                />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
});

LoginForm.displayName = 'LoginForm';
