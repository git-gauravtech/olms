import React from 'react';
import { LabAvailabilityGrid } from "@/components/lab/lab-availability-grid"; // This component will need significant rewrite

export default function LabAvailabilityPage() {
  const containerStyle: React.CSSProperties = {
    // Example styles, replace with actual CSS
    // In a real app, LabAvailabilityGrid would be complex and require its own CSS.
  };

  return (
    <div style={containerStyle}>
      <LabAvailabilityGrid />
    </div>
  );
}
