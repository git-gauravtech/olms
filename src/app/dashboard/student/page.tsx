
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, CalendarCheck } from "lucide-react";

export default function StudentDashboardPage() {
  const { isAuthorized, isLoading } = useRoleGuard([USER_ROLES.STUDENT, USER_ROLES.CR]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-6">
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">Student Dashboard</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Welcome, Student! Here you can view your lab booking schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Access your personal lab booking history and upcoming sessions.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <FeatureCard
          title="My Bookings"
          description="Access a view of your upcoming and past lab sessions. Details include lab name, room, and timing."
          icon={<CalendarCheck className="h-10 w-10 text-primary mb-3" />}
          linkHref="/dashboard/student/my-bookings"
          linkLabel="View My Bookings"
        />
      </div>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Notifications & Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Important updates regarding lab schedules, maintenance, or other announcements will appear here. (Placeholder for future notifications)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkHref: string;
  linkLabel: string;
}

function FeatureCard({ title, description, icon, linkHref, linkLabel }: FeatureCardProps) {
  return (
    <Card className="shadow-md hover:shadow-xl transition-shadow flex flex-col max-w-lg mx-auto w-full">
      <CardHeader className="items-center text-center">
        {icon}
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground text-center">{description}</p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-primary hover:bg-primary/90">
          <Link href={linkHref}>{linkLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

