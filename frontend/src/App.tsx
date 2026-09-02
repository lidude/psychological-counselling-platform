import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import Clients from "./pages/admin/Clients";
import Counselors from "./pages/admin/Counselors";
import CounselorDashboard from "./pages/CounselorDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import Unauthorized from "./pages/Unauthorized";
import { ReactNode } from "react";

function RoleRedirect() {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "ADMIN":
      return <Navigate to="/admin" replace />;
    case "COUNSELOR":
      return <Navigate to="/counselor" replace />;
    case "CLIENT":
      return <Navigate to="/client" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function AppRoutes(): ReactNode {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* Admin routes with sidebar layout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<Clients />} />
        <Route path="counselors" element={<Counselors />} />
        <Route path="counselors/:id" element={<Counselors />} />
      </Route>

      <Route
        path="/counselor"
        element={
          <ProtectedRoute requiredRole="COUNSELOR">
            <CounselorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client"
        element={
          <ProtectedRoute requiredRole="CLIENT">
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </div>
  );
}

export default App;
