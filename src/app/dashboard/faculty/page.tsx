import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FacultyDashboardPage() {
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Faculty Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Welcome, Faculty Member! Manage your lab sessions and bookings.</p>
          <p className="mt-4">Faculty-specific information will be displayed here.</p>
           <ul className="list-disc pl-5 mt-2">
            <li>Your Scheduled Labs</li>
            <li>Pending Booking Requests</li>
            <li>Quick Book Access</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
