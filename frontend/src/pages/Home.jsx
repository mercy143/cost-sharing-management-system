import React, { useContext, useState, useEffect } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Divider,
  Avatar,
  useTheme,
  useMediaQuery,
  Stack,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";

import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  School as SchoolIcon,
  HourglassEmpty as HourglassBottomIcon,
  Shield as ShieldIcon,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import { AuthContext } from "../commonapi/authContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,  // ← Added for grid lines
} from "recharts";
import api from "../commonapi/api";

const drawerWidth = 240;

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [quickStats, setQuickStats] = useState({
    totalStudents: 0,
    pendingApprovals: 0,
    universityUsers: 0,
    admins: 0,
  });
  const [uploadTrend, setUploadTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    async function fetchQuickStats() {
      try {
        setStatsError(false);

        const sres = await api.get("/reports/dashboard-students");
        const studentSummary = sres.data?.studentSummary || {};

        let universityUsers = 0;
        let admins = 0;
        try {
          const ures = await api.get("/users");
          const users = Array.isArray(ures.data) ? ures.data : [];
          universityUsers = users.filter((u) => u.role === "university").length;
          admins = users.filter((u) => u.role === "admin").length;
        } catch (err) {
          console.warn("Failed to fetch users for stats:", err);
        }

        let pendingCount = 0;
        if (user?.role === "admin") {
          try {
            const dres = await api.get("/documents/pending");
            pendingCount = Array.isArray(dres.data) ? dres.data.length : 0;
          } catch (err) {
            console.warn("Failed to fetch pending documents:", err);
          }
        } else if (user?.role === "university") {
          try {
            const dres = await api.get("/documents");
            if (Array.isArray(dres.data)) {
              pendingCount = dres.data.filter((d) => d.approvalStatus === "pending").length;
            }
          } catch (err) {
            try {
              const sres = await api.get("/students");
              pendingCount = Array.isArray(sres.data)
                ? sres.data.filter((s) => s.approvalStatus === "pending").length
                : 0;
            } catch (studentErr) {
              pendingCount = 0;
            }
          }
        }

        setQuickStats({
          totalStudents: studentSummary.totalStudents || 0,
          pendingApprovals: pendingCount,
          universityUsers,
          admins,
        });
      } catch (err) {
        console.error("Failed to fetch quick stats:", err);
        setStatsError(true);
      }
    }

    async function fetchTrend() {
      setTrendLoading(true);
      try {
        const tres = await api.get("/reports/student-trend");
        const data = Array.isArray(tres.data) ? tres.data : [];
        setUploadTrend(data.length > 0 ? data : []);
      } catch (err) {
        console.error("Failed to fetch upload trend:", err);
        setUploadTrend([]);
      } finally {
        setTrendLoading(false);
      }
    }

    if (user) {
      fetchQuickStats();
      fetchTrend();
    }
  }, [user]);

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon color="primary" />,
      onClick: () => navigate("/reports/dashboard"),
    },
    ...(user?.role === "admin"
      ? [
          {
            text: "Create User",
            icon: <PersonAddIcon color="success" />,
            onClick: () => navigate("/admin/create-user"),
          },
          {
            text: "Manage Users",
            icon: <PeopleIcon color="info" />,
            onClick: () => navigate("/admin/manage-users"),
          },
        ]
      : []),
    ...(user?.role === "university"
      ? [
          {
            text: "Upload Students",
            icon: <SchoolIcon color="primary" />,
            onClick: () => navigate("/university/students"),
          },
        ]
      : []),
  ];

  const drawer = (
    <Box sx={{ height: "100%", bgcolor: "#f9fafb" }}>
      <Box sx={{ display: "flex", alignItems: "center", p: 2 }}>
        <Avatar sx={{ bgcolor: "primary.main", mr: 1 }}>
          {user?.fullName?.[0]?.toUpperCase() || "?"}
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight={600} noWrap>
            {user?.fullName?.split(" ")[0] || "User"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.role === "admin" ? "Administrator" : "University User"}
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ my: 0.5, mx: 1, borderRadius: 2 }}>
            <ListItemButton
              onClick={item.onClick}
              sx={{
                borderRadius: 2,
                px: 2,
                "&:hover": { bgcolor: "primary.light", color: "white" },
              }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ mt: "auto" }} />
      <ListItem disablePadding sx={{ mt: "auto", mx: 1, mb: 1, borderRadius: 2 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            color: "error.main",
            "&:hover": { bgcolor: "error.light", color: "white" },
          }}
        >
          <ListItemIcon>
            <LogoutIcon color="error" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
     -con
      </ListItem>
    </Box>
  );

  const hasTrendData = uploadTrend.length > 0;

  return (
    <Box sx={{ display: "flex", bgcolor: "#f4f5f7", minHeight: "100vh" }}>
      <CssBaseline />

      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: theme.palette.primary.main,
          boxShadow: 2,
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
            Welcome To Cost Sharing Dashboard Overview!
          </Typography>
          <Avatar sx={{ bgcolor: "white", color: "primary.main" }}>
            {user?.fullName?.[0]?.toUpperCase() || "?"}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
                borderRight: "none",
                boxShadow: 3,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {/* Top Section: Welcome + Quick Stats Side by Side */}
        <Grid container spacing={3} alignItems="flex-start" mb={4}>
          {/* Welcome Message (Left) */}
          <Grid item xs={12} md={6}>
            <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
              Welcome back, {user?.fullName?.split(" ")[0] || "User"}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's a quick overview of your cost-sharing system activity.
            </Typography>
          </Grid>

          {/* Quick Stats Cards (Right) */}
          <Grid item xs={12} md={6}>
            {statsError ? (
              <Alert severity="warning">
                Failed to load some stats. Please try again later.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {/* Total Students */}
                <Grid item xs={6} sm={6} md={6}>
                  <Card sx={{ bgcolor: "primary.light", color: "primary.contrastText", borderRadius: 3 }}>
                    <CardContent sx={{ py: 2.5, px: 3 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                          <PeopleIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Total Students
                          </Typography>
                          <Typography variant="h5" fontWeight={700}>
                            {quickStats.totalStudents.toLocaleString()}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Pending Approvals */}
                <Grid item xs={6} sm={6} md={6}>
                  <Card sx={{ bgcolor: "warning.light", color: "warning.contrastText", borderRadius: 3 }}>
                    <CardContent sx={{ py: 2.5, px: 3 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                          <HourglassBottomIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Pending Approvals
                          </Typography>
                          <Typography variant="h5" fontWeight={700}>
                            {quickStats.pendingApprovals}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Admin-only stats */}
                {user?.role === "admin" && (
                  <>
                    <Grid item xs={6} sm={6} md={6}>
                      <Card sx={{ bgcolor: "info.light", color: "info.contrastText", borderRadius: 3 }}>
                        <CardContent sx={{ py: 2.5, px: 3 }}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                              <SchoolIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                University Users
                              </Typography>
                              <Typography variant="h5" fontWeight={700}>
                                {quickStats.universityUsers}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={6} sm={6} md={6}>
                      <Card sx={{ bgcolor: "success.light", color: "success.contrastText", borderRadius: 3 }}>
                        <CardContent sx={{ py: 2.5, px: 3 }}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                              <ShieldIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Administrators
                              </Typography>
                              <Typography variant="h5" fontWeight={700}>
                                {quickStats.admins}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  </>
                )}
              </Grid>
            )}
          </Grid>
        </Grid>

        {/* Upload Trend Chart - Enhanced with Gradient */}
        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Students Upload Trend
            </Typography>
            {trendLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : hasTrendData ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={uploadTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#066a1aff" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#badb27ff" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} opacity={0.4} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: theme.palette.text.secondary }}
                    tickLine={{ stroke: theme.palette.text.secondary }}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fill: theme.palette.text.secondary }}
                    tickLine={{ stroke: theme.palette.text.secondary }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                      boxShadow: theme.shadows[4]
                    }}
                    labelStyle={{ color: theme.palette.text.primary }}
                  />
                  <Bar 
                    dataKey="uploads" 
                    fill="url(#colorGradient)" 
                    radius={[12, 12, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography color="text.secondary">
                  No student upload data available yet.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}