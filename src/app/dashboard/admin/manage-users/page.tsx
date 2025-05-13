
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserCog } from "lucide-react";
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageUsersPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.ADMIN);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-8 w-1/4 mt-4" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <UserCog className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold">Manage Users</CardTitle>
          </div>
          <CardDescription>
            Admin tools for managing user accounts, roles, and permissions within LabLink.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page will contain functionalities for administrators to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>View a list of all registered users (students, faculty, CRs).</li>
            <li>Create, edit, or delete user accounts.</li>
            <li>Assign or change user roles (e.g., promote a student to CR).</li>
            <li>Reset user passwords or manage account status (active/inactive).</li>
            <li>Filter and search for users based on various criteria.</li>
          </ul>
          <p className="mt-4 text-sm">
            Future enhancements could include bulk user import/export and audit logs for user management actions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
