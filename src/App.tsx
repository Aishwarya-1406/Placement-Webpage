import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Companies from './pages/Companies';
import Applications from './pages/Applications';
import Students from './pages/Students';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading, firebaseUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!firebaseUser) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;

  return <ProtectedRoute>{children}</ProtectedRoute>;
};

const StudentRoute = ({ children }: { children: React.ReactNode }) => {
  const { isStudent, loading, firebaseUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!firebaseUser) return <Navigate to="/login" />;
  if (!isStudent) return <Navigate to="/" />;

  return <ProtectedRoute>{children}</ProtectedRoute>;
};

export default function App() {
  // Force rebuild to clear stale errors
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/companies"
            element={
              <ProtectedRoute>
                <Companies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <Applications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <AdminRoute>
                <Students />
              </AdminRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <StudentRoute>
                <Profile />
              </StudentRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
