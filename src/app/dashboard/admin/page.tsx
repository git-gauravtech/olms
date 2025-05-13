import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Welcome, Admin! This is your control panel for LabLink.</p>
          <p className="mt-4">Future admin-specific widgets and controls will appear here.</p>
          <ul className="list-disc pl-5 mt-2">
            <li>User Management</li>
            <li>Lab Configuration</li>
            <li>System Analytics</li>
            <li>Booking Moderation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
