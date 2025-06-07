
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">Welcome to LabLink (Next.js Version)</h1>
      </div>
      <p className="mb-6">This is a fresh start for the LabLink application using Next.js.</p>
      <Button>Get Started</Button>
      <div className="mt-10" data-ai-hint="placeholder image app screen">
        <img 
          src="https://placehold.co/600x400.png" 
          alt="Placeholder App Screenshot" 
          className="rounded-lg shadow-lg"
          data-ai-hint="app screen" 
        />
      </div>
    </main>
  );
}
