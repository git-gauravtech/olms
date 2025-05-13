
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";

export default function FacultyDashboardPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.FACULTY);

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
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Faculty Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Welcome, Faculty Member! Manage your lab sessions and bookings.</p>
          <p className="mt-4">Faculty-specific information will be displayed here.</p>
           <ul className="list-disc pl-5 mt-2">
            <li>Your Scheduled Labs</li>
            <li>Pending Booking Requests</li>
            <li>Quick Book Access</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
