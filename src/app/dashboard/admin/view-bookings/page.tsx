
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export default function ViewBookingsPage() {
  return (
    <div className="container mx-auto py-10">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold">View All Bookings & Conflicts</CardTitle>
          </div>
          <CardDescription>
            Administrative overview of all lab bookings, with tools to identify and manage scheduling conflicts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This interface allows administrators to monitor and manage lab schedules across the institution:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>View a comprehensive list of all current, past, and future bookings.</li>
            <li>Filter bookings by lab, user, date range, or status.</li>
            <li>Identify potential scheduling conflicts (e.g., double bookings, over-capacity).</li>
            <li>Tools to resolve conflicts, such as suggesting alternatives or notifying affected users.</li>
            <li>Generate reports on lab utilization and booking patterns.</li>
            <li>Override or manually adjust bookings if necessary (with audit trail).</li>
          </ul>
           <p className="mt-4 text-sm">
            Future enhancements may include automated conflict detection alerts and advanced analytics on booking data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
