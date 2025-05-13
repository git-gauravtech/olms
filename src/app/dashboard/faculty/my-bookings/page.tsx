
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarCheck2 } from "lucide-react";

export default function FacultyMyBookingsPage() {
  return (
    <div className="container mx-auto py-10">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <CalendarCheck2 className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold">My Lab Bookings</CardTitle>
          </div>
          <CardDescription>
            View and manage your scheduled lab sessions and booking history as a faculty member.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page will display a list of your upcoming and past lab bookings:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Details for each booking: Lab name, date, time, purpose.</li>
            <li>Option to view booking status (e.g., confirmed, pending approval if applicable).</li>
            <li>Ability to modify or cancel upcoming bookings (subject to system rules).</li>
            <li>Filter bookings by date range, lab, or status.</li>
            <li>Access to a history of all past lab sessions.</li>
          </ul>
          <p className="mt-4 text-sm">
            Future features might include calendar integration and notifications for upcoming bookings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
