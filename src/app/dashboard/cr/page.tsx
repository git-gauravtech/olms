
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";

export default function CRDashboardPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.CR);

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
          <CardTitle className="text-2xl font-semibold">Class Representative Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Welcome, CR! Manage lab bookings for your class.</p>
          <p className="mt-4">Tools for class-wide bookings and schedule management.</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Batch Booking for Class</li>
            <li>View Class Schedule</li>
            <li>Announcements to Class</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
