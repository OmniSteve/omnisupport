import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";

// Auth is imported from "@/lib/AuthContext", which Vite aliases to the
// standalone context (src/context/AuthContext.jsx). See vite.config.js.
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";

import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { AppLayout } from "@/components/layout/AppLayout";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Tickets from "@/pages/Tickets";
import MyTickets from "@/pages/MyTickets";
import TicketDetail from "@/pages/TicketDetail";
import NewTicket from "@/pages/NewTicket";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import KnowledgeBase from "@/pages/KnowledgeBase";
import Reports from "@/pages/Reports";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Spinner />;
  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/tickets/new" element={<NewTicket />} />
        <Route path="/tickets/:reference" element={<TicketDetail />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/knowledge" element={<KnowledgeBase />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
        <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AuthenticatedApp() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <Spinner />;
  // An authenticated session with no recognised role is treated as not
  // registered for this application.
  if (isAuthenticated && !user?.role) return <UserNotRegisteredError />;
  return <AppRoutes />;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ThemeProvider>
          <ToastProvider>
            <Router>
              <ScrollToTop />
              <AuthenticatedApp />
            </Router>
          </ToastProvider>
        </ThemeProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;