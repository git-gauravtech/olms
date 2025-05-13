
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export default function ManageEquipmentPage() {
  return (
    <div className="container mx-auto py-10">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Wrench className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold">Manage Equipment</CardTitle>
          </div>
          <CardDescription>
            Oversee and manage all laboratory equipment, including inventory, maintenance schedules, and assignments to labs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This section is designated for administrators to manage equipment lifecycle:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Add new equipment, specifying type, model, serial number, and acquisition date.</li>
            <li>Edit existing equipment details, such as status (available, in-use, under maintenance).</li>
            <li>Assign equipment to specific labs or mark as general pool.</li>
            <li>Track maintenance history and schedule upcoming service.</li>
            <li>View equipment utilization reports (future enhancement).</li>
            <li>Manage disposal or retirement of outdated equipment.</li>
          </ul>
           <p className="mt-4 text-sm">
            Future development could include integration with booking system to reserve specific equipment along with lab slots.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
