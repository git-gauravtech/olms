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
import { DEPARTMENTS, Department } from "@/constants";
import { AtomIcon, Eye, EyeOff, Loader2 } from "lucide-react";

const signupSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string().min(8, { message: "Please confirm your password." }),
  role: z.enum(ROLES_ARRAY, { required_error: "Please select a role." }),
  department: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], // Path to field to display error message
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: USER_ROLES.STUDENT, // Default role
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);

    toast({
      title: "Account Created!",
      description: `Welcome, ${data.fullName}! Your account as ${data.role} has been successfully created.`,
    });
    
    if (typeof window !== 'undefined') {
        localStorage.setItem('userRole', data.role);
    }

    switch (data.role) {
      case USER_ROLES.ADMIN:
        router.push("/dashboard/admin");
        break;
      case USER_ROLES.FACULTY:
        router.push("/dashboard/faculty");
        break;
      case USER_ROLES.STUDENT:
        router.push("/dashboard/student");
        break;
      case USER_ROLES.CR:
        router.push("/dashboard/cr");
        break;
      default:
        router.push("/dashboard/overview"); // Fallback
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-xl rounded-xl">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto mb-2">
          <AtomIcon className="h-16 w-16 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">Create an Account</CardTitle>
        <CardDescription>Join LabLink to manage and book lab sessions efficiently.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              {...form.register("fullName")}
              aria-invalid={form.formState.errors.fullName ? "true" : "false"}
            />
            {form.formState.errors.fullName && <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...form.register("email")}
              aria-invalid={form.formState.errors.email ? "true" : "false"}
            />
            {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
          </div>

          <div className="space-y-1.5 relative">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...form.register("password")}
              aria-invalid={form.formState.errors.password ? "true" : "false"}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-7 h-7 w-7"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </Button>
            {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
          </div>

          <div className="space-y-1.5 relative">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              {...form.register("confirmPassword")}
              aria-invalid={form.formState.errors.confirmPassword ? "true" : "false"}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-7 h-7 w-7"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">{showConfirmPassword ? "Hide confirm password" : "Show confirm password"}</span>
            </Button>
            {form.formState.errors.confirmPassword && <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <Select
              onValueChange={(value: UserRole) => form.setValue("role", value, { shouldValidate: true })}
              defaultValue={form.getValues("role")}
            >
              <SelectTrigger id="role" aria-invalid={form.formState.errors.role ? "true" : "false"}>
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
            {form.formState.errors.role && <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="department">Department (Optional)</Label>
            <Select
              onValueChange={(value: Department) => form.setValue("department", value)}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.department && <p className="text-sm text-destructive">{form.formState.errors.department.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="pt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}