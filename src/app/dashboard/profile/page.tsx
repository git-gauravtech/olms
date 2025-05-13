import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

// This is a placeholder page. In a real app, user data would be fetched.
export default function ProfilePage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">User Profile</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src="/placeholder-avatar.jpg" alt="User avatar" data-ai-hint="person avatar" />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                U
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">LabLink User</CardTitle>
              <CardDescription>user@example.com</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue="LabLink User" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" defaultValue="user@example.com" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" defaultValue="Student" disabled /> {/* Role might come from context/localStorage */}
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department (Optional)</Label>
            <Input id="department" placeholder="e.g., Computer Science" />
          </div>
          <Button className="w-full sm:w-auto">
            Update Profile
          </Button>
        </CardContent>
      </Card>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div>
            <Button variant="outline">Change Password</Button>
           </div>
           <div>
             {/* Placeholder for 2FA settings if needed */}
             <p className="text-sm text-muted-foreground">Two-Factor Authentication: Not Configured</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
