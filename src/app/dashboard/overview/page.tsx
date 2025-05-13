import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, FlaskConical, Users } from "lucide-react";

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Labs</CardTitle>
            <FlaskConical className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Available for booking</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
            <Clock className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">In the next 7 days</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120</div>
            <p className="text-xs text-muted-foreground">Students and Faculty</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Operational</div>
            <p className="text-xs text-muted-foreground">All systems normal</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest bookings and system notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-center">
              <FlaskConical className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">Physics Lab Alpha booked by Student X for 2-3 PM.</span>
            </li>
            <li className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">New user 'Faculty Y' registered.</span>
            </li>
            <li className="flex items-center">
               <FlaskConical className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">Computer Lab Gamma booked by CR Z for group study 9-11 AM.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
