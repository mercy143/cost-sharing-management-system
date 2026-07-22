import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import api from "../commonapi/api";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  // ✅ Simple email validation
  const isValidEmail = (v) => /\S+@\S+\.\S+/.test(v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email || !isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (cooldown > 0) {
      setError(`Please wait ${cooldown}s before requesting again.`);
      return;
    }

    setLoading(true);

    try {
      // ✅ Correct endpoint (no /api/api)
      await api.post("/auth/forgot-password", { email });

      // Always show a generic success message (for security)
      setMessage(
        "If an account with that email exists, you will receive password reset instructions shortly."
      );
    } catch (err) {
      // Still show the same message (avoid leaking info)
      setMessage(
        "If an account with that email exists, you will receive password reset instructions shortly."
      );
      console.debug(
        "Forgot password request failed:",
        err?.response?.data || err?.message || err
      );
    } finally {
      setLoading(false);

      // ⏳ Start a cooldown timer (30s)
      setCooldown(30);
      const tick = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            clearInterval(tick);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f7fa",
        p: 3,
      }}
    >
      <Paper
        sx={{
          width: 420,
          p: 4,
          borderRadius: 3,
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        }}
        elevation={8}
      >
        <Typography variant="h5" fontWeight={700} mb={2}>
          Reset your password
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Enter the email address associated with your account. We’ll send a
          secure link to reset your password.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
            inputProps={{
              autoComplete: "email",
              "aria-label": "Email address",
            }}
            disabled={cooldown > 0}
          />

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || cooldown > 0}
              sx={{ textTransform: "none" }}
              aria-label="Send password reset link"
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                "Send reset link"
              )}
            </Button>

            <Button
              variant="text"
              onClick={() => navigate(-1)}
              sx={{ textTransform: "none" }}
              aria-label="Cancel"
            >
              Cancel
            </Button>

            {cooldown > 0 && (
              <Typography variant="caption" color="text.secondary">
                Retry in {cooldown}s
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
