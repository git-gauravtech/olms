
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UsersRound } from "lucide-react";

export default function CRClassBookingsPage() {
  return (
    <div className="container mx-auto py-10">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <UsersRound className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold">Class Lab Bookings</CardTitle>
          </div>
          <CardDescription>
            As a Class Representative, manage and view lab bookings for your entire class.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This section provides tools for managing class-wide lab schedules:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>View all lab bookings made for your class.</li>
            <li>Ability to make batch bookings for specific class sessions or tutorials.</li>
            <li>Coordinate lab usage across different student groups within the class.</li>
            <li>See an overview of lab utilization by your class.</li>
            <li>Communicate important lab schedule changes to the class (future feature).</li>
          </ul>
          <p className="mt-4 text-sm">
            Future developments could involve tools for polling class members for preferred lab times or managing recurring class bookings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
