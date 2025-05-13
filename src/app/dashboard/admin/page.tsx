
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.ADMIN);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-1/4 mt-4" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-3/4" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Or a specific "Access Denied" component if preferred
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Welcome, Admin! This is your control panel for LabLink.</p>
          <p className="mt-4">Future admin-specific widgets and controls will appear here.</p>
          <ul className="list-disc pl-5 mt-2">
            <li>User Management</li>
            <li>Lab Configuration</li>
            <li>System Analytics</li>
            <li>Booking Moderation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
