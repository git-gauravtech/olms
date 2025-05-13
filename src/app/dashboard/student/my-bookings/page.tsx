
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";

export default function StudentMyBookingsPage() {
  return (
    <div className="container mx-auto py-10">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <CalendarClock className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold">My Lab Bookings</CardTitle>
          </div>
          <CardDescription>
            Track your scheduled lab slots and review your booking history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Here you can find all your lab booking information:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>List of upcoming lab sessions with lab name, date, and time.</li>
            <li>Details of the purpose for each booking.</li>
            <li>Status of each booking (e.g., confirmed).</li>
            <li>Options to cancel an upcoming booking if permitted.</li>
            <li>A historical view of all your past lab usage.</li>
          </ul>
          <p className="mt-4 text-sm">
            Enhancements could include adding bookings to a personal calendar or receiving reminders.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
