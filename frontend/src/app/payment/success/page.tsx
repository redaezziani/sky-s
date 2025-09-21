'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/loader';
import { cn } from '@/lib/utils';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const method = searchParams.get('method');
  const [status, setStatus] = useState<'loading' | 'confirmed' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId || !method) return;

    const confirmPayment = async () => {
      try {
        const res = await fetch(`http://localhost:8080/payments/confirm?method=${method}&transactionId=${sessionId}`);
        console.log('Confirmation response:', res);
        if (!res.ok) throw new Error('Failed to confirm');
        setStatus('confirmed');
      } catch {
        setStatus('error');
      }
    };

    confirmPayment();
  }, [sessionId, method]);

  return (
    <div className={cn("flex flex-col gap-6 items-center justify-center min-h-screen bg-gray-50 p-6")}>
      <Card className="border-none bg-transparent w-full max-w-md">
        <CardHeader>
          <CardTitle>Payment {status === 'confirmed' ? 'Successful' : status === 'error' ? 'Failed ' : 'Processing...'}</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Confirming your payment...'}
            {status === 'confirmed' && 'Your payment has been successfully confirmed. Thank you for your order!'}
            {status === 'error' && 'We could not confirm your payment. Please try again or contact support.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {status === 'loading' && (
            <div className="flex justify-center">
              <Loader size={24} />
            </div>
          )}

          {status === 'error' && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Retry Confirmation
            </Button>
          )}

          {status === 'confirmed' && (
            <Button
              className="w-full"
              onClick={() => (window.location.href = '/dashboard/orders')}
            >
              View My Orders
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
