import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./commonapi/authContext";
import Login from "./pages/loginPage";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import CreateUser from "./pages/CreateUser";
import ManageUsers from "./pages/ManageUsers";
import StudentUpload from "./pages/StudentUpload";
import ReportsDashboard from "./pages/ReportsDashboard";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

// ✅ MUI Theme
const theme = createTheme({
  palette: {
    mode: "light", // or "dark"
    primary: {
      main: "#DB2777", // pinkish gradient main color
    },
    secondary: {
      main: "#64748B", // grayish
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
  },
});

// 🔒 General protected route
function ProtectedRoute({ children }) {
  const { user } = React.useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
}

// 🔑 Admin-only route
function AdminRoute({ children }) {
  const { user } = React.useContext(AuthContext);
  return user?.role === "admin" ? children : <Navigate to="/" />;
}

// 🎓 University-only route
function UniversityRoute({ children }) {
  const { user } = React.useContext(AuthContext);
  return user?.role === "university" ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalize CSS & apply theme */}
      <AuthProvider>
        <Router>
          <Routes>

            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Password Reset */}
              <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Home */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/create-user"
              element={
                <AdminRoute>
                  <CreateUser />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/manage-users"
              element={
                <AdminRoute>
                  <ManageUsers />
                </AdminRoute>
              }
            />

            {/* University Routes */}
            <Route
              path="/university/students"
              element={
                <UniversityRoute>
                  <StudentUpload />
                </UniversityRoute>
              }
            />
            <Route
  path="/reports/dashboard"
  element={
    <ProtectedRoute>
      <ReportsDashboard />
    </ProtectedRoute>
  }
/>

            {/* Fallback: redirect unknown paths */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
