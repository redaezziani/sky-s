"use client";

import { memo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Loader } from "../loader";
import Link from "next/link";

interface ProfileViewProps {
  className?: string;
}

export const ProfileView = memo<ProfileViewProps>(({ className }) => {
  const { user, logout, logoutAll } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      await logoutAll();
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader size={32} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6 max-w-2xl mx-auto", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your account details and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-900">{user.email}</p>
                  {user.isEmailVerified ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Not Verified</Badge>
                  )}
                </div>
                {!user.isEmailVerified && (
                  <p className="text-xs text-gray-500">
                    <Link
                      href="/auth/resend-verification"
                      className="text-primary hover:underline"
                    >
                      Resend verification email
                    </Link>
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <p className="text-sm text-gray-900">
                  {user.name || "Not provided"}
                </p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Role
                </label>
                <div>
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                    className={
                      user.role === "ADMIN" ? "bg-blue-100 text-blue-800" : ""
                    }
                  >
                    {user.role}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  User ID
                </label>
                <p className="text-sm text-gray-500 font-mono">{user.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>
            Manage your account and security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Password Reset</h4>
                  <p className="text-sm text-gray-500">
                    Change your account password
                  </p>
                </div>
                <Link href="/auth/forgot-password">
                  <Button variant="outline" size="sm">
                    Reset Password
                  </Button>
                </Link>
              </div>

              <hr className="my-2" />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Sign Out</h4>
                  <p className="text-sm text-gray-500">
                    Sign out of this device only
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <span className="flex items-center">
                      <Loader size={14} />
                      <span className="ml-2">Signing out...</span>
                    </span>
                  ) : (
                    "Sign Out"
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Sign Out All Devices</h4>
                  <p className="text-sm text-gray-500">
                    Sign out of all devices and sessions
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogoutAll}
                  disabled={isLoggingOutAll}
                >
                  {isLoggingOutAll ? (
                    <span className="flex items-center">
                      <Loader size={14} />
                      <span className="ml-2">Signing out...</span>
                    </span>
                  ) : (
                    "Sign Out All"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link
          href="/dashboard"
          className="text-primary hover:underline text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
});

ProfileView.displayName = "ProfileView";
