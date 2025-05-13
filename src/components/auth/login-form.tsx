import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ROLES_ARRAY, USER_ROLES, UserRole } from "@/types";
import { AtomIcon } from "lucide-react"; 
// Removed ShadCN UI imports: Button, Card, Input, Label, Select, useToast

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(ROLES_ARRAY, { required_error: "Please select a role." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  // const { toast } removed - using window.alert instead
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue, 
    watch,    
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const selectedRole = watch("role");

  const onSubmit = (data: LoginFormValues) => {
    // Using window.alert instead of toast
    window.alert(`Login Successful. Welcome, ${data.role}! Redirecting to your dashboard...`);

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
        navigate("/dashboard/overview"); // Fallback
    }
  };
  
  const cardStyle: React.CSSProperties = {
      width: '100%',
      maxWidth: '450px', // Equivalent to max-w-md
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', // shadow-xl
      borderRadius: '0.75rem', // rounded-xl
      backgroundColor: 'white', // Assuming card background is white
      padding: '1.5rem' // p-6 roughly
  };

  const cardHeaderStyle: React.CSSProperties = {
      textAlign: 'center',
      marginBottom: '1.5rem'
  };
  
  const cardTitleStyle: React.CSSProperties = {
      fontSize: '1.875rem', // text-3xl
      fontWeight: 'bold',
      marginBottom: '0.5rem'
  };

  const cardDescriptionStyle: React.CSSProperties = {
      color: '#6B7280', // text-muted-foreground
      marginBottom: '1.5rem'
  };

  const formFieldStyle: React.CSSProperties = {
      marginBottom: '1.5rem' // space-y-6 implies spacing between elements
  };
  
  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500'
  };

  return (
    <div style={cardStyle} className="custom-card">
      <div style={cardHeaderStyle} className="custom-card-header">
        <div style={{ margin: '0 auto 1rem auto' }}>
          <AtomIcon style={{ height: '4rem', width: '4rem', color: '#007BFF' }} /> {/* Primary color */}
        </div>
        <h1 style={cardTitleStyle} className="custom-card-title">Optimized Lab Management System</h1>
        <p style={cardDescriptionStyle} className="custom-card-description">Sign in to access lab schedules and bookings</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '1.5rem' }} className="custom-card-content"> {/* space-y-6 */}
          <div style={formFieldStyle}>
            <label htmlFor="email" style={labelStyle} className="custom-label">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              aria-invalid={errors.email ? "true" : "false"}
              className="custom-input"
            />
            {errors.email && <p className="error-message">{errors.email.message}</p>}
          </div>
          <div style={formFieldStyle}>
            <label htmlFor="password" style={labelStyle} className="custom-label">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              aria-invalid={errors.password ? "true" : "false"}
              className="custom-input"
            />
            {errors.password && <p className="error-message">{errors.password.message}</p>}
          </div>
          <div style={formFieldStyle}>
            <label htmlFor="role" style={labelStyle} className="custom-label">Role</label>
            <select
              id="role"
              {...register("role")}
              value={selectedRole}
              onChange={(e) => setValue("role", e.target.value as UserRole, { shouldValidate: true })}
              aria-invalid={errors.role ? "true" : "false"}
              className="custom-select"
            >
              <option value="">Select your role</option>
              {ROLES_ARRAY.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {errors.role && <p className="error-message">{errors.role.message}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }} className="custom-card-footer">
          <button type="submit" className="custom-button custom-button-primary" style={{width: '100%'}}>
            Login
          </button>
        </div>
      </form>
    </div>
  );
}
