import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Paper,
  LinearProgress,
  Fade,
} from "@mui/material";
import { Visibility, VisibilityOff, LockReset } from "@mui/icons-material";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [strength, setStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState("");
  const [fadeIn, setFadeIn] = useState(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    setFadeIn(true);
  }, []);

  // Password strength calculation
  useEffect(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    setStrength(score);

    switch (score) {
      case 0:
      case 1:
        setStrengthLabel("Weak");
        break;
      case 2:
      case 3:
        setStrengthLabel("Medium");
        break;
      case 4:
        setStrengthLabel("Strong");
        break;
      default:
        setStrengthLabel("");
    }
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirm) return setError("Please enter and confirm your new password.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/auth/reset-password`, {
        token,
        email,
        password,
      });
      setSuccess(res.data.message || "Password reset successful.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Reset Password Error:", err);
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = () => {
    switch (strengthLabel) {
      case "Weak":
        return "error";
      case "Medium":
        return "warning";
      case "Strong":
        return "success";
      default:
        return "inherit";
    }
  };

  return (
    <Box
  sx={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #dcdce4ff 0%, #f2afe9ff 100%)",
    padding: 2,
    overflow: "hidden",
  }}
>

      <Fade in={fadeIn} timeout={800}>
        <Paper
          elevation={12}
          sx={{
            maxWidth: 480,
            width: "100%",
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
          }}
        >
          <Box textAlign="center" mb={3}>
            <LockReset sx={{ fontSize: 60, color: "#6b73ff" }} />
            <Typography variant="h5" fontWeight={600} mt={1}>
              Reset Your Password
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Enter a new password to secure your account
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="New Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              required
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {password && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={(strength / 4) * 100}
                  color={strengthColor()}
                  sx={{ height: 8, borderRadius: 5 }}
                />
                <Typography variant="caption" color={`${strengthColor()}.main`}>
                  {strengthLabel}
                </Typography>
              </Box>
            )}

            <TextField
              label="Confirm Password"
              type={showConfirm ? "text" : "password"}
              fullWidth
              required
              margin="normal"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end">
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                background: "linear-gradient(135deg, #6b73ff 0%, #000dff 100%)",
                fontWeight: 600,
                borderRadius: 2,
                "&:hover": {
                  background: "linear-gradient(135deg, #000dff 0%, #6b73ff 100%)",
                },
              }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </Paper>
      </Fade>
    </Box>
  );
};

export default ResetPassword;
