
"use client"; // This directive is Next.js specific and generally not needed for standard React/Vite projects.
              // However, if any client-side hooks (useState, useEffect) are used at the top level, it's fine.
              // For this conversion, we'll remove it as it's a Next.js convention.

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ROLES_ARRAY, USER_ROLES, UserRole } from "@/types";
import { DEPARTMENTS, Department } from "@/constants";
import { AtomIcon, Eye, EyeOff, Loader2 } from "lucide-react";

// Removed ShadCN UI imports (Button, Card, Input, Label, Select, useToast)

const signupSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string().min(8, { message: "Please confirm your password." }),
  role: z.enum(ROLES_ARRAY, { required_error: "Please select a role." }),
  department: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const navigate = useNavigate();
  // const { toast } = useToast(); // Replaced with window.alert
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
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    setIsSubmitting(false);

    window.alert(`Account Created! Welcome, ${data.fullName}! Your account as ${data.role} has been successfully created.`);
    
    if (typeof window !== 'undefined') {
        localStorage.setItem('userRole', data.role);
    }

    switch (data.role) {
      case USER_ROLES.ADMIN:
        navigate("/dashboard/admin");
        break;
      case USER_ROLES.FACULTY:
        navigate("/dashboard/faculty");
        break;
      case USER_ROLES.STUDENT:
        navigate("/dashboard/student");
        break;
      case USER_ROLES.CR:
        navigate("/dashboard/cr");
        break;
      default:
        navigate("/dashboard/overview");
    }
  };

  // Basic inline styles for demonstration, move to CSS file for a real app
  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '500px', // max-w-lg
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', // shadow-xl
    borderRadius: '0.75rem', // rounded-xl
    backgroundColor: 'white',
    padding: '1.5rem'
  };

  const headerStyle: React.CSSProperties = { textAlign: 'center', marginBottom: '1rem' };
  const titleStyle: React.CSSProperties = { fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' };
  const descriptionStyle: React.CSSProperties = { color: '#6B7280', marginBottom: '1.5rem' };
  const fieldStyle: React.CSSProperties = { marginBottom: '1rem', position: 'relative' };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.25rem', fontWeight: '500' };
  const passwordToggleStyle: React.CSSProperties = {
    position: 'absolute',
    right: '10px',
    top: '35px', // Adjust based on input height and label
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: '0.25rem'
  };

  return (
    <div style={cardStyle} className="custom-card">
      <div style={headerStyle} className="custom-card-header">
        <div style={{ margin: '0 auto 0.5rem auto' }}>
          <AtomIcon style={{ height: '4rem', width: '4rem', color: '#007BFF' }} />
        </div>
        <h1 style={titleStyle} className="custom-card-title">Create an Account</h1>
        <p style={descriptionStyle} className="custom-card-description">Join Optimized Lab Management System to manage and book lab sessions efficiently.</p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="custom-card-content">
          <div style={fieldStyle}>
            <label htmlFor="fullName" style={labelStyle} className="custom-label">Full Name</label>
            <input
              id="fullName"
              placeholder="John Doe"
              {...form.register("fullName")}
              className="custom-input"
            />
            {form.formState.errors.fullName && <p className="error-message">{form.formState.errors.fullName.message}</p>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="email" style={labelStyle} className="custom-label">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...form.register("email")}
              className="custom-input"
            />
            {form.formState.errors.email && <p className="error-message">{form.formState.errors.email.message}</p>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="password" style={labelStyle} className="custom-label">Password</label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...form.register("password")}
              className="custom-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={passwordToggleStyle}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            {form.formState.errors.password && <p className="error-message">{form.formState.errors.password.message}</p>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="confirmPassword" style={labelStyle} className="custom-label">Confirm Password</label>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              {...form.register("confirmPassword")}
              className="custom-input"
            />
             <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={passwordToggleStyle}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            {form.formState.errors.confirmPassword && <p className="error-message">{form.formState.errors.confirmPassword.message}</p>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="role" style={labelStyle} className="custom-label">Role</label>
            <select
              id="role"
              {...form.register("role")}
              defaultValue={form.getValues("role")}
              className="custom-select"
            >
              {ROLES_ARRAY.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {form.formState.errors.role && <p className="error-message">{form.formState.errors.role.message}</p>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="department" style={labelStyle} className="custom-label">Department (Optional)</label>
            <select
              id="department"
              {...form.register("department")}
              className="custom-select"
            >
              <option value="">Select your department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {form.formState.errors.department && <p className="error-message">{form.formState.errors.department.message}</p>}
          </div>
        </div>
        <div style={{ paddingTop: '1rem' }} className="custom-card-footer">
          <button type="submit" className="custom-button custom-button-primary" style={{width: '100%'}} disabled={isSubmitting}>
            {isSubmitting && <Loader2 style={{ marginRight: '0.5rem' }} className="animate-spin" size={16} />}
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
}
