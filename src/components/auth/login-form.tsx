"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ROLES_ARRAY, USER_ROLES, UserRole } from "@/types";
import { AtomIcon } from "lucide-react"; // Or a more generic LabLink icon

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(ROLES_ARRAY, { required_error: "Please select a role." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue, // For Select component
    watch,    // For Select component
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // Watch role for Select component, or use Controller
  const selectedRole = watch("role");

  const onSubmit = (data: LoginFormValues) => {
    // Simulate login
    toast({
      title: "Login Successful",
      description: `Welcome, ${data.role}! Redirecting to your dashboard...`,
    });

    // Store role in localStorage for dashboard to pick up (simple mock)
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', data.role);
    }
    
    // Redirect to a generic overview or role-specific page
    // For this example, let's redirect to /dashboard/overview
    // The sidebar in dashboard can then adapt based on localStorage role
    router.push("/dashboard/overview");
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <AtomIcon className="h-16 w-16 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">LabLink</CardTitle>
        <CardDescription>Sign in to access lab schedules and bookings</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              aria-invalid={errors.email ? "true" : "false"}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              aria-invalid={errors.password ? "true" : "false"}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              onValueChange={(value: UserRole) => setValue("role", value, { shouldValidate: true })}
              value={selectedRole}
            >
              <SelectTrigger id="role" aria-invalid={errors.role ? "true" : "false"}>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES_ARRAY.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
