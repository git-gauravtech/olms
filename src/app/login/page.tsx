import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <LoginForm />
    </main>
  );
}
