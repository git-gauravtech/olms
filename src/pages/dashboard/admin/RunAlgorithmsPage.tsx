import React from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { BrainCircuit } from 'lucide-react';

export default function RunAlgorithmsPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.ADMIN);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthorized) return null;
  
  const algorithmButtonStyle = {
    margin: '0.5rem',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    cursor: 'pointer',
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    borderRadius: '4px'
  };

  return (
    <div className="custom-card">
      <div className="custom-card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <BrainCircuit style={{ height: '2rem', width: '2rem', color: '#007BFF' }} />
        <h1 className="custom-card-title" style={{ fontSize: '1.5rem' }}>Run Diagnostic & Optimization Algorithms</h1>
      </div>
      <div className="custom-card-content">
        <p>Execute specialized algorithms to analyze schedules, allocate resources, and optimize lab usage.</p>
        <div>
            <button style={algorithmButtonStyle} onClick={() => alert('Running Scheduling Algorithm...')}>Run Scheduling (Graph Coloring)</button>
            <button style={algorithmButtonStyle} onClick={() => alert('Running Resource Allocation...')}>Run Resource Allocation (0/1 Knapsack)</button>
            <button style={algorithmButtonStyle} onClick={() => alert('Optimizing Lab Usage...')}>Optimize Lab Usage (Greedy)</button>
            <button style={algorithmButtonStyle} onClick={() => alert('Assigning Nearest Labs...')}>Assign Nearest Labs (Dijkstra)</button>
        </div>
      </div>
    </div>
  );
}
