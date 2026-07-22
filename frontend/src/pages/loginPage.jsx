import React, { useState, useContext } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Link,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { AuthContext } from "../commonapi/authContext";
import { useNavigate } from "react-router-dom";
import api from "../commonapi/api";
import mor from "../assets/mor.png";
import loginIllustration from "../assets/login-illustration.png"; // Add an illustration image

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("md")); // Show illustration on md+ screens

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic client-side guard
    if (!username || !password) {
      setError("Please enter your username/email and password.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = username.includes("@")
        ? { email: username, password }
        : { username, password };

      const res = await api.post("/auth/login", payload);

      // Ensure backend returned a token before treating as authenticated
      if (!res?.data?.token) {
        setError("Authentication failed: no token received.");
        setSubmitting(false);
        return;
      }

      // Clear password from memory as soon as possible
      setPassword("");

      login(res.data.user, res.data.token);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error response:", err?.response);
      console.error("Error status:", err?.response?.status);
      console.error("Error URL:", err?.config?.url);
      
      // Handle different error types
      if (err?.code === 'ECONNREFUSED' || err?.message?.includes('Network Error')) {
        setError("Cannot connect to server. Please make sure the backend server is running on port 5000.");
      } else if (err?.response?.status === 404) {
        setError("Login endpoint not found. Please check if the server is running on port 5000.");
      } else {
        const msg =
          err?.response?.data?.message || err?.message || "Login failed — check credentials.";
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        bgcolor: theme.palette.grey[100],
        background: "linear-gradient(135deg, #FDE2FF 0%, #FEE2E2 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <Box
        sx={{
          position: "absolute",
          width: 300,
          height: 300,
          bgcolor: "primary.light",
          borderRadius: "50%",
          top: -100,
          left: -100,
          opacity: 0.2,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: 200,
          height: 200,
          bgcolor: "secondary.light",
          borderRadius: "50%",
          bottom: -50,
          right: -50,
          opacity: 0.15,
        }}
      />

      {/* Main Card + Illustration */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 1000,
          gap: 6,
          zIndex: 1,
        }}
      >
        {/* Login Card */}
        <Paper
          elevation={14}
          sx={{
            width: "100%",
            maxWidth: 450,
            p: 6,
            borderRadius: 5,
            textAlign: "center",
            boxShadow: theme.shadows[16],
          }}
        >
          {/* Logo */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <img src={mor} alt="Logo" style={{ height: 90, width: 90 }} />
          </Box>

          <Typography variant="h4" fontWeight={700} mb={3}>
            Welcome Back!
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Username or Email"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitting}
                sx={{
                  py: 1.7,
                  fontWeight: "bold",
                  borderRadius: 3,
                  textTransform: "none",
                  fontSize: "1rem",
                  background: "linear-gradient(90deg, #EC4899, #DB2777)",
                  "&:hover": {
                    background: "linear-gradient(90deg, #DB2777, #BE185D)",
                  },
                }}
              >
                {submitting ? (
                  <>
                    <CircularProgress size={24} sx={{ color: "white", mr: 1 }} />
                    Signing in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </Stack>
          </Box>

          {/* Divider */}
          <Box sx={{ my: 4, display: "flex", alignItems: "center" }}>
            <Divider sx={{ flexGrow: 1 }} />
            <Typography variant="body2" sx={{ mx: 2, color: "text.secondary" }}>
              OR
            </Typography>
            <Divider sx={{ flexGrow: 1 }} />
          </Box>

          {/* Footer */}
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              © 2025 Ministry of Revenue
            </Typography>
            {/* Use navigate instead of raw href to avoid accidental form submission and to keep SPA behavior */}
            <Button
              onClick={(ev) => {
                ev.preventDefault();
                // navigate to forgot-password route; do NOT trigger any authentication actions
                navigate("/forgot-password");
              }}
              variant="text"
              sx={{ textTransform: "none", color: "secondary.main" }}
            >
              Forgot Password?
            </Button>
          </Stack>
        </Paper>

        {/* Illustration */}
        {isLargeScreen && (
          <Box
            component="img"
            src={loginIllustration}
            alt="Login Illustration"
            sx={{
              height: 400,
              width: "auto",
              display: "block",
            }}
          />
        )}
      </Box>
    </Box>
  );
}
