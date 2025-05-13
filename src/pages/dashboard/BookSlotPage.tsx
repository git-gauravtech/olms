import React from 'react';
import { BookingForm } from "@/components/lab/booking-form"; // This component will need significant rewrite

export default function BookSlotPage() {
  const containerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '2rem auto', // Center the form
    padding: '0 1rem'
  };

  return (
    <div style={containerStyle}>
      <BookingForm />
    </div>
  );
}
