
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function ManageLabsPage() {
  return (
    <div className="container mx-auto py-10">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold">Manage Labs</CardTitle>
          </div>
          <CardDescription>
            Administrative interface for configuring lab details, equipment, and availability settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This section allows administrators to oversee and manage all laboratory resources:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Add new labs to the system, specifying name, capacity, and location.</li>
            <li>Edit existing lab details, such as updating capacity or available equipment.</li>
            <li>Define default operating hours or special availability schedules for each lab.</li>
            <li>Manage lab-specific booking rules or restrictions.</li>
            <li>Temporarily mark labs as unavailable for maintenance or other reasons.</li>
          </ul>
           <p className="mt-4 text-sm">
            Further development could include inventory management for lab equipment and usage analytics per lab.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
