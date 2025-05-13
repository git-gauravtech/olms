import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardLayout from './layouts/DashboardLayout';
import AdminDashboardPage from './pages/dashboard/AdminDashboardPage';
import FacultyDashboardPage from './pages/dashboard/FacultyDashboardPage';
import StudentDashboardPage from './pages/dashboard/StudentDashboardPage';
import CRDashboardPage from './pages/dashboard/CRDashboardPage';
import ManageLabsPage from './pages/dashboard/admin/ManageLabsPage';
import ManageEquipmentPage from './pages/dashboard/admin/ManageEquipmentPage';
import ViewBookingsPage from './pages/dashboard/admin/ViewBookingsPage';
import FacultyRequestsPage from './pages/dashboard/admin/FacultyRequestsPage';
import RunAlgorithmsPage from './pages/dashboard/admin/RunAlgorithmsPage';
import LabAvailabilityPage from './pages/dashboard/LabAvailabilityPage';
import BookSlotPage from './pages/dashboard/BookSlotPage';
import FacultyMyBookingsPage from './pages/dashboard/faculty/FacultyMyBookingsPage';
import CrRequestsPage from './pages/dashboard/faculty/CrRequestsPage';
import StudentMyBookingsPage from './pages/dashboard/student/StudentMyBookingsPage';
import RequestClassBookingPage from './pages/dashboard/cr/RequestClassBookingPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import OverviewPage from './pages/dashboard/OverviewPage';
// Import other necessary dashboard pages

function App() {
  // Basic toast functionality, replace with a proper library if needed
  const [toasts, setToasts] = React.useState<{ id: number; title: string; description: string; variant?: 'destructive' }[]>([]);
  
  const showToast = (toast: { title: string; description: string; variant?: 'destructive' }) => {
    const newToast = { ...toast, id: Date.now() };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 3000);
  };

  // Provide toast function via context or pass as props if needed deeper
  // For simplicity, some components might call window.alert or a simplified global toast

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Common/Default Dashboard Route */}
          <Route path="overview" element={<OverviewPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="labs" element={<LabAvailabilityPage />} />
          <Route path="book-slot" element={<BookSlotPage />} />

          {/* Admin Routes */}
          <Route path="admin" element={<AdminDashboardPage />} />
          <Route path="admin/manage-labs" element={<ManageLabsPage />} />
          <Route path="admin/manage-equipment" element={<ManageEquipmentPage />} />
          <Route path="admin/view-bookings" element={<ViewBookingsPage />} />
          <Route path="admin/faculty-requests" element={<FacultyRequestsPage />} />
          <Route path="admin/run-algorithms" element={<RunAlgorithmsPage />} />
          {/* Add other admin specific routes: manage-users */}


          {/* Faculty Routes */}
          <Route path="faculty" element={<FacultyDashboardPage />} />
          <Route path="faculty/my-bookings" element={<FacultyMyBookingsPage />} />
          <Route path="faculty/cr-requests" element={<CrRequestsPage />} />


          {/* Student Routes */}
          <Route path="student" element={<StudentDashboardPage />} />
          <Route path="student/my-bookings" element={<StudentMyBookingsPage />} />

          {/* CR Routes */}
          <Route path="cr" element={<CRDashboardPage />} />
          <Route path="cr/request-class-booking" element={<RequestClassBookingPage />} />
          {/* CRs also use student/my-bookings for personal bookings */}
        </Route>
        {/* Add a 404 Not Found Route if desired */}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
      {/* Basic Toaster Implementation */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            background: toast.variant === 'destructive' ? '#f8d7da' : '#d4edda',
            color: toast.variant === 'destructive' ? '#721c24' : '#155724',
            padding: '10px',
            marginBottom: '10px',
            borderRadius: '5px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <strong>{toast.title}</strong>
            <p>{toast.description}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
