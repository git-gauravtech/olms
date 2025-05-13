// src/app/dashboard/admin/run-algorithms/page.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BrainCircuit, Palette, Backpack, Zap, Route, Loader2 } from "lucide-react";

interface AlgorithmSectionProps {
  title: string;
  description: string;
  buttonLabel: string;
  icon: React.ReactNode;
  onRun: () => Promise<void>;
  isLoading: boolean;
}

function AlgorithmSection({ title, description, buttonLabel, icon, onRun, isLoading }: AlgorithmSectionProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center space-x-2">
          {icon}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onRun} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function RunAlgorithmsPage() {
  const { toast } = useToast();
  const [isLoadingScheduling, setIsLoadingScheduling] = React.useState(false);
  const [isLoadingResourceAllocation, setIsLoadingResourceAllocation] = React.useState(false);
  const [isLoadingOptimizeUsage, setIsLoadingOptimizeUsage] = React.useState(false);
  const [isLoadingAssignNearest, setIsLoadingAssignNearest] = React.useState(false);

  const simulateAlgorithm = async (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    algorithmName: string,
    details: string
  ) => {
    setter(true);
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000)); // Simulate variable processing time
    setter(false);
    toast({
      title: `${algorithmName} Complete`,
      description: `${details} executed successfully. Results (mock) are now available.`,
    });
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold">Run Diagnostic & Optimization Algorithms</CardTitle>
          </div>
          <CardDescription>
            Execute specialized algorithms to analyze schedules, allocate resources, and optimize lab usage. These are simulated operations.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <AlgorithmSection
          title="Lab Scheduling (Graph Coloring)"
          description="Optimizes lab schedules to prevent conflicts using graph coloring techniques. Identifies optimal time slot assignments."
          buttonLabel="Run Scheduling Algorithm"
          icon={<Palette className="text-primary" />}
          onRun={() => simulateAlgorithm(setIsLoadingScheduling, "Scheduling Algorithm", "Graph Coloring based scheduling")}
          isLoading={isLoadingScheduling}
        />

        <AlgorithmSection
          title="Resource Allocation (0/1 Knapsack)"
          description="Allocates limited resources (e.g., specialized equipment) efficiently across competing requests or projects."
          buttonLabel="Run Resource Allocation"
          icon={<Backpack className="text-primary" />}
          onRun={() => simulateAlgorithm(setIsLoadingResourceAllocation, "Resource Allocation Algorithm", "0/1 Knapsack based allocation")}
          isLoading={isLoadingResourceAllocation}
        />

        <AlgorithmSection
          title="Optimize Lab Usage (Greedy)"
          description="Maximizes lab occupancy and utilization by re-arranging or suggesting booking adjustments using a greedy approach."
          buttonLabel="Run Usage Optimization"
          icon={<Zap className="text-primary" />}
          onRun={() => simulateAlgorithm(setIsLoadingOptimizeUsage, "Lab Usage Optimization", "Greedy algorithm for usage")}
          isLoading={isLoadingOptimizeUsage}
        />

        <AlgorithmSection
          title="Assign Nearest Labs (Dijkstra)"
          description="For multi-campus scenarios, suggests the geographically nearest available lab to a user or department based on preferences."
          buttonLabel="Run Nearest Lab Assignment"
          icon={<Route className="text-primary" />}
          onRun={() => simulateAlgorithm(setIsLoadingAssignNearest, "Nearest Lab Assignment", "Dijkstra's algorithm for proximity")}
          isLoading={isLoadingAssignNearest}
        />
      </div>
    </div>
  );
}
