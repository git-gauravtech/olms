import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CRDashboardPage() {
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
