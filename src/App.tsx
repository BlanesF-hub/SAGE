/* ============================================================
   SAGE — App Router
   ============================================================ */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import PacienteDashboard from './pages/PacienteDashboard';
import SecretarioDashboard from './pages/SecretarioDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ConsultorioAdminDashboard from './pages/ConsultorioAdminDashboard';

function ProtectedRoute({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.forcePasswordChange) return <Navigate to="/cambiar-contrasena" replace />;
  if (roles && user && !roles.includes(user.rol)) return <Navigate to="/" replace />;

  return children;
}

function RolRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.rol) {
    case 'PACIENTE':           return <Navigate to="/paciente" replace />;
    case 'SECRETARIO':         return <Navigate to="/secretario" replace />;
    case 'DOCTOR':             return <Navigate to="/doctor" replace />;
    case 'ADMIN_GENERAL':      return <Navigate to="/admin" replace />;
    case 'ADMIN_CONSULTORIO':  return <Navigate to="/consultorio-admin" replace />;
    default:                   return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/cambiar-contrasena" element={<ChangePasswordPage />} />

      {/* Protected */}
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/paciente" element={
          <ProtectedRoute roles={['PACIENTE']}><PacienteDashboard /></ProtectedRoute>
        } />

        <Route path="/secretario" element={
          <ProtectedRoute roles={['SECRETARIO']}><SecretarioDashboard /></ProtectedRoute>
        } />

        <Route path="/doctor" element={
          <ProtectedRoute roles={['DOCTOR']}><DoctorDashboard /></ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute roles={['ADMIN_GENERAL']}><AdminDashboard /></ProtectedRoute>
        } />

        <Route path="/consultorio-admin" element={
          <ProtectedRoute roles={['ADMIN_CONSULTORIO']}><ConsultorioAdminDashboard /></ProtectedRoute>
        } />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
