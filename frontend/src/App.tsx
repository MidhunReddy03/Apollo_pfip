import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { authService } from './services/auth';
import { useAuthStore } from './store';

// Pages
import LoginPage from './pages/LoginPage';
import PatientLogin from './pages/PatientLogin';
import PatientDashboard from './pages/PatientDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import RegisterPatient from './pages/RegisterPatient';
import PatientFormPage from './pages/PatientFormPage';
import FloorManagerDashboard from './pages/FloorManagerDashboard';
import CheckInPage from './pages/CheckInPage';
import PatientsPage from './pages/PatientsPage';
import EncountersPage from './pages/EncountersPage';
import StationsPage from './pages/StationsPage';
import QueueBoardPage from './pages/QueueBoardPage';
import DoctorDashboard from './pages/DoctorDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PatientPortal from './pages/PatientPortal';
import AppointmentsPage from './pages/AppointmentsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  const isAuthenticated = authService.isAuthenticated();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (isAuthenticated && !user) {
      authService.getCurrentUser()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        });
    }
  }, [isAuthenticated, user, setUser]);

   return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* ── Patient Portal ─────────────── */}
      <Route path="/patient-login" element={<PatientLogin />} />
      <Route path="/patient/dashboard" element={<PatientDashboard />} />

      {/* ── Receptionist ───────────────── */}
      <Route path="/receptionist">
        <Route path="dashboard" element={<ProtectedRoute><ReceptionistDashboard /></ProtectedRoute>} />
        <Route path="register-patient" element={<ProtectedRoute><RegisterPatient /></ProtectedRoute>} />
        <Route path="check-in" element={<ProtectedRoute><CheckInPage /></ProtectedRoute>} />
        <Route path="patients" element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
        <Route path="patients/new" element={<ProtectedRoute><PatientFormPage /></ProtectedRoute>} />
        <Route path="patients/:id" element={<ProtectedRoute><PatientFormPage /></ProtectedRoute>} />
        <Route path="patients/:id/edit" element={<ProtectedRoute><PatientFormPage /></ProtectedRoute>} />
        <Route path="appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
      </Route>

      {/* ── Floor Manager ──────────────── */}
      <Route path="/manager">
        <Route path="dashboard" element={<ProtectedRoute><FloorManagerDashboard /></ProtectedRoute>} />
        <Route path="stations" element={<ProtectedRoute><StationsPage /></ProtectedRoute>} />
        <Route path="queue" element={<ProtectedRoute><QueueBoardPage /></ProtectedRoute>} />
        <Route path="encounters" element={<ProtectedRoute><EncountersPage /></ProtectedRoute>} />
      </Route>

      {/* ── Doctor ─────────────────────── */}
      <Route path="/doctor">
        <Route path="dashboard" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
      </Route>

      {/* ── Technician ─────────────────── */}
      <Route path="/technician">
        <Route path="dashboard" element={<ProtectedRoute><TechnicianDashboard /></ProtectedRoute>} />
      </Route>

      {/* ── Admin ──────────────────────── */}
      <Route path="/admin">
        <Route path="dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      </Route>

      {/* ── Patient ────────────────────── */}
      <Route path="/patient">
        <Route path="dashboard" element={<ProtectedRoute><PatientPortal /></ProtectedRoute>} />
      </Route>

      {/* Default */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#FFFFFF',
              color: '#0F172A',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#00A86B', secondary: '#FFFFFF' },
            },
            error: {
              iconTheme: { primary: '#DC3545', secondary: '#FFFFFF' },
            },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
