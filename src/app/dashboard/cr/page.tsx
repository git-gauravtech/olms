
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, FlaskConical, CalendarPlus, CalendarCheck, UserPlus, Users2 } from "lucide-react";

export default function CRDashboardPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.CR);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
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
            <CardTitle className="text-3xl font-bold">Class Representative Dashboard</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Welcome, CR! Manage lab bookings for your class and your individual needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This dashboard provides tools for both class-wide lab scheduling and your personal lab bookings.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          title="Request Class Lab Slot"
          description="Submit requests for lab sessions for your entire batch, specifying time, lab type, and equipment needs."
          icon={<UserPlus className="h-10 w-10 text-primary mb-3" />}
          linkHref="/dashboard/cr/request-class-booking"
          linkLabel="Request for Class"
        />
        <FeatureCard
          title="View Class Bookings"
          description="Track all lab sessions scheduled for your class, including their status (pending, booked, completed)."
          icon={<Users2 className="h-10 w-10 text-primary mb-3" />}
          linkHref="/dashboard/cr/class-bookings"
          linkLabel="View Class Schedule"
        />
        <FeatureCard
          title="Book Individual Slot"
          description="Schedule lab time for your personal academic projects or study, separate from class bookings."
          icon={<CalendarPlus className="h-10 w-10 text-primary mb-3" />}
          linkHref="/dashboard/book-slot"
          linkLabel="Book My Slot"
        />
        <FeatureCard
          title="My Individual Bookings"
          description="View your personal lab booking history and upcoming individual sessions."
          icon={<CalendarCheck className="h-10 w-10 text-primary mb-3" />}
          linkHref="/dashboard/student/my-bookings" 
          linkLabel="View My Individual Bookings"
        />
        <FeatureCard
          title="Lab Availability"
          description="Check the weekly schedule for all labs to plan class sessions or individual study time."
          icon={<FlaskConical className="h-10 w-10 text-primary mb-3" />}
          linkHref="/dashboard/labs"
          linkLabel="Check Lab Availability"
        />
      </div>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Announcements to Class (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A space for CRs to post or view announcements relevant to class lab activities. (Feature for future development)
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
    <Card className="shadow-md hover:shadow-xl transition-shadow flex flex-col">
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
