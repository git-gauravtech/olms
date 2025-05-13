
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDashboardPage() {
  // Students and CRs can access this general student dashboard view.
  // CRs have additional specific pages.
  const { isAuthorized, isLoading } = useRoleGuard([USER_ROLES.STUDENT, USER_ROLES.CR]);


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
          <CardTitle className="text-2xl font-semibold">Student Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Welcome, Student! View lab availability and manage your bookings.</p>
          <p className="mt-4">Your upcoming bookings and lab announcements will appear here.</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Your Upcoming Bookings</li>
            <li>Lab Availability Quick View</li>
            <li>Notifications</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
