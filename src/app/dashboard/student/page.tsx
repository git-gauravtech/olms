import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentDashboardPage() {
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
