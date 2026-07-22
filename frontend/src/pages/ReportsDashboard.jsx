import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  CircularProgress,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  CardHeader,
  Divider,
  Chip,
  Avatar,
  Tooltip as MuiTooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  TablePagination,
  TableContainer,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  CartesianGrid,
} from "recharts";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../commonapi/api";
import { jsPDF } from "jspdf";
import { AuthContext } from "../commonapi/authContext";
import Alert from "@mui/material/Alert";
import StackMui from "@mui/material/Stack";
import Collapse from "@mui/material/Collapse";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GetAppIcon from "@mui/icons-material/GetApp";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import SavingsIcon from "@mui/icons-material/Savings";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

const COLORS = ["#0088FE", "#FF8042"];

// Fixed current date as per your instruction (December 17, 2025)
const CURRENT_DATE = new Date("2025-12-17");

// Interest calculation function – fully compliant with Directive 71/2004
const calculateInterest = (student) => {
  const { balance, yearsAtUniversity, graduationDate } = student;

  if (!balance || balance <= 0 || !graduationDate || !yearsAtUniversity) {
    return { rate: "0.00", interest: "0.00", totalDue: formatCurrency(balance || 0) };
  }

  // Determine rate based on years at university
  let rate = 0;
  if (yearsAtUniversity <= 3) rate = 3.0;
  else if (yearsAtUniversity === 4) rate = 3.25;
  else if (yearsAtUniversity === 5) rate = 3.5;
  else rate = 4.6; // 6+ years

  // Calculate overdue years after 1-year grace period
  const gradDate = new Date(graduationDate);
  const yearsSinceGrad = (CURRENT_DATE - gradDate) / (365.25 * 24 * 60 * 60 * 1000);
  const overdueYears = Math.max(0, Math.floor(yearsSinceGrad - 1));

  // Simple interest
  const interest = balance * (rate / 100) * overdueYears;
  const totalDue = balance + interest;

  return {
    rate: rate.toFixed(2),
    interest: interest.toFixed(2),
    totalDue: totalDue.toFixed(2),
  };
};

const formatNumber = (value) => Number(value || 0).toLocaleString();
const formatCurrency = (value) =>
  `Br ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "—");
const formatMonthLabel = (ym) => {
  try {
    const y = ym && typeof ym === "string" ? ym.slice(0, 7) : null;
    if (!y) return "—";
    const [yy, mm] = y.split("-");
    const d = new Date(Number(yy), Number(mm) - 1, 1);
    return d.toLocaleString(undefined, { month: "short", year: "numeric" });
  } catch (e) {
    return String(ym);
  }
};

// Fallback sample data
const FALLBACK = {
  summary: { totalPaid: 120000, totalUnpaid: 48000, interestAccumulated: 3200 },
  universityPerformance: [
    { university: "University A", paid: 60000, unpaid: 20000 },
    { university: "University B", paid: 40000, unpaid: 15000 },
    { university: "University C", paid: 20000, unpaid: 13000 },
  ],
  monthlyPayments: [
    { month: new Date().toISOString().slice(0, 7), amount: 15000 },
    { month: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7), amount: 12000 },
  ],
  studentSummary: {
    totalStudents: 1200,
    paidStudents: 700,
    unpaidStudents: 350,
    partialStudents: 150,
    totalBalance: 48000,
    totalCost: 168000,
    totalPaidAmount: 120000,
  },
  universityStudentPerformance: [],
  interestTrend: [],
  universitiesStatus: [],
  pendingUploads: [],
};

export default function ReportsDashboard() {
  const [fetchError, setFetchError] = useState(null);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagResults, setDiagResults] = useState(null);
  const [diagError, setDiagError] = useState(null);
  const theme = useTheme();
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, idx) => currentYear - idx);

  const [summary, setSummary] = useState({
    totalPaid: 0,
    totalUnpaid: 0,
    interestAccumulated: 0,
  });
  const [universityData, setUniversityData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [universitiesStatus, setUniversitiesStatus] = useState([]);
  const [studentSummary, setStudentSummary] = useState({
    totalStudents: 0,
    paidStudents: 0,
    unpaidStudents: 0,
    partialStudents: 0,
    totalBalance: 0,
    totalCost: 0,
    totalPaidAmount: 0,
  });
  const [universityStudentPerformance, setUniversityStudentPerformance] = useState([]);
  const { user } = useContext(AuthContext);
  const [expanded, setExpanded] = useState(null);
  const [studentsByUniversity, setStudentsByUniversity] = useState({});
  const [pagingByUniversity, setPagingByUniversity] = useState({});
  const [loadingByUniversity, setLoadingByUniversity] = useState({});
  const [filtersByUniversity, setFiltersByUniversity] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const [filters, setFilters] = useState({ year: currentYear, region: "all", university: "all" });
  const [allUniversities, setAllUniversities] = useState([]);
  const [regionOptions, setRegionOptions] = useState([]);
  const [interestTrend, setInterestTrend] = useState([]);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [approvingBatch, setApprovingBatch] = useState({});
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payStudent, setPayStudent] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("telebirr");
  const [paying, setPaying] = useState(false);
  const [payReceipt, setPayReceipt] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  useEffect(() => {
    console.debug("ReportsDashboard init - user:", user);
  }, [user]);
  useEffect(() => {
    console.debug("universitiesStatus length:", universitiesStatus?.length, "pendingUploads:", pendingUploads?.length);
  }, [universitiesStatus, pendingUploads]);

  const fetchUniversityStudents = async (univId, page = 1, limit = 10, search = "", status = "") => {
    try {
      setFetchError(null);
      setLoadingByUniversity((s) => ({ ...s, [univId]: true }));
      setPagingByUniversity((p) => ({ ...p, [univId]: { ...(p[univId] || {}), page, pageSize: limit } }));

      const params = { page, limit };
      if (search) params.search = search;
      if (status && status !== "all") params.status = status;

      const res = await api.get(`/reports/university/${univId}/students`, { params });
      const studentsRaw = res.data?.students || [];
      const total = res.data?.total || 0;

      const students = Array.isArray(studentsRaw)
        ? studentsRaw.map((s) => {
            const interestData = calculateInterest({
              balance: typeof s.balance === "number" ? s.balance : Number(s.balance || 0),
              yearsAtUniversity: s.yearsAtUniversity || 4, // fallback if missing
              graduationDate: s.graduationDate || "2023-07-01", // fallback
            });

            return {
              id: s.id,
              studentId: s.studentId || s.studentNumber || s.student_number || "-",
              fullName: s.fullName || s.full_name || "-",
              program: s.program || s.programName || "-",
              status: s.status || "unpaid",
              balance: typeof s.balance === "number" ? s.balance : Number(s.balance || 0),
              rate: interestData.rate,
              accruedInterest: interestData.interest,
              totalDue: interestData.totalDue,
              raw: s,
            };
          })
        : [];

      setStudentsByUniversity((m) => ({ ...m, [univId]: { students, total } }));
    } catch (err) {
      console.error("Failed to fetch university students:", err);
      setFetchError(err?.message || "Failed to load students");
      setStudentsByUniversity((m) => ({ ...m, [univId]: { students: [], total: 0 } }));
    } finally {
      setLoadingByUniversity((s) => ({ ...s, [univId]: false }));
    }
  };

  const buildFilterParams = useCallback(() => {
    const params = {};
    if (filters.year && filters.year !== "all") params.year = filters.year;
    if (filters.region && filters.region !== "all") params.region = filters.region;
    if (filters.university && filters.university !== "all") params.universityId = filters.university;
    return params;
  }, [filters]);

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  useEffect(() => {
    if (!isAdmin) {
      setAllUniversities([]);
      setRegionOptions([]);
      return;
    }

    const loadUniversities = async () => {
      try {
        const res = await api.get("/universities");
        const list = Array.isArray(res.data) ? res.data : [];
        setAllUniversities(list);
        const regions = Array.from(new Set(list.map((u) => u.location).filter(Boolean)));
        setRegionOptions(regions);
      } catch (err) {
        console.error("Failed to load universities list:", err);
      }
    };

    loadUniversities();
  }, [isAdmin]);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setFetchError(null);
    setUsedFallback(false);
    try {
      const params = buildFilterParams();
      const res = await api.get("/reports/dashboard", { params });
      setSummary(res.data?.summary || FALLBACK.summary);

      const rawUni = Array.isArray(res.data?.universityPerformance) ? res.data.universityPerformance : [];
      const uniSorted = rawUni.slice().sort((a, b) => (b.paid + (b.unpaid || 0)) - (a.paid + (a.unpaid || 0)));
      setUniversityData(uniSorted);

      const rawMonthly = Array.isArray(res.data?.monthlyPayments) ? res.data.monthlyPayments : [];
      const monthlyNormalized = rawMonthly
        .map((m) => ({
          ...m,
          month: m.month || "",
          monthLabel: formatMonthLabel(m.month || ""),
          amount: Number(m.amount || 0),
        }))
        .sort((a, b) => (a.month > b.month ? 1 : a.month < b.month ? -1 : 0));
      setMonthlyData(monthlyNormalized);

      try {
        const sres = await api.get("/reports/dashboard-students", { params });
        setStudentSummary(sres.data?.studentSummary || FALLBACK.studentSummary);
        setUniversityStudentPerformance(sres.data?.universityStudentPerformance || []);
      } catch (serr) {
        console.error("Failed to fetch student dashboard:", serr);
        setFetchError(serr?.message || "Failed to fetch student dashboard");
      }

      const trendParams = {
        year: filters.year === "all" ? currentYear : filters.year,
        ...(filters.region !== "all" && { region: filters.region }),
        ...(filters.university !== "all" && { university: filters.university }),
      };

      try {
        const interestRes = await api.get("/reports/interest", { params: trendParams });
        const rawInterest = Array.isArray(interestRes.data) ? interestRes.data : [];
        const interestNormalized = rawInterest
          .map((it) => ({
            month: it.month || "",
            monthLabel: formatMonthLabel(it.month || ""),
            interest: Number(it.interest || 0),
          }))
          .sort((a, b) => (a.month > b.month ? 1 : a.month < b.month ? -1 : 0));
        setInterestTrend(interestNormalized);
      } catch (ierr) {
        console.error("Failed to fetch interest trend:", ierr);
        setInterestTrend([]);
      }

      if (isAdmin) {
        try {
          const ures = await api.get("/reports/universities-status", { params });
          setUniversitiesStatus(ures.data || []);
        } catch (uerr) {
          console.error("Failed fetching universities status:", uerr);
          setUniversitiesStatus([]);
        }

        try {
          const pendingParams = {};
          if (filters.region !== "all") pendingParams.region = filters.region;
          if (filters.university !== "all") pendingParams.universityId = filters.university;
          const pendingRes = await api.get("/uploads/pending", { params: pendingParams });
          setPendingUploads(pendingRes.data || []);
        } catch (perr) {
          console.error("Failed to fetch pending uploads:", perr);
          setPendingUploads([]);
        }
      } else {
        setPendingUploads([]);
        setUniversitiesStatus([]);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setFetchError(err?.message || "Dashboard fetch error");
      setUsedFallback(true);
      setSummary(FALLBACK.summary);
      setUniversityData(FALLBACK.universityPerformance);
      setMonthlyData(FALLBACK.monthlyPayments);
      setStudentSummary(FALLBACK.studentSummary);
      setUniversityStudentPerformance(FALLBACK.universityStudentPerformance);
      setInterestTrend(FALLBACK.interestTrend);
      setUniversitiesStatus(FALLBACK.universitiesStatus);
      setPendingUploads(FALLBACK.pendingUploads);
    } finally {
      setRefreshing(false);
    }
  }, [buildFilterParams, filters, isAdmin, currentYear]);

  const handleBatchApproval = async (uploadId, approvalStatus) => {
    setApprovingBatch((prev) => ({ ...prev, [uploadId]: true }));
    try {
      await api.patch(`/uploads/${uploadId}/approve`, { status: approvalStatus });
      await fetchData();
      toast.success(`Batch ${approvalStatus === "approved" ? "approved" : "rejected"} successfully!`);
    } catch (err) {
      console.error("Batch approval failed:", err);
      toast.error("Failed to process batch approval. Please try again.");
    } finally {
      setApprovingBatch((prev) => ({ ...prev, [uploadId]: false }));
    }
  };

  const runDiagnostics = async () => {
    setDiagRunning(true);
    setDiagResults(null);
    setDiagError(null);
    const endpoints = [
      { key: "dashboard", url: "/reports/dashboard", params: buildFilterParams() },
      { key: "dashboard-students", url: "/reports/dashboard-students", params: buildFilterParams() },
      { key: "universities-status", url: "/reports/universities-status", params: buildFilterParams() },
      { key: "universities", url: "/universities", params: {} },
      { key: "pending-uploads", url: "/uploads/pending", params: {} },
    ];
    const results = {};
    try {
      for (const ep of endpoints) {
        try {
          const res = await api.get(ep.url, { params: ep.params });
          results[ep.key] = {
            url: (res.config && (res.config.baseURL ? res.config.baseURL + res.config.url : res.config.url)) || ep.url,
            status: res.status,
            dataSample: res.data && typeof res.data === "object" ? (Array.isArray(res.data) ? `array(${res.data.length})` : Object.keys(res.data).slice(0,10)) : res.data,
            rawData: res.data,
            config: res.config,
          };
        } catch (err) {
          results[ep.key] = { error: String(err?.message || err), details: err?.response?.data || err };
        }
      }
      setDiagResults(results);
    } catch (err) {
      setDiagError(String(err?.message || err));
    } finally {
      setDiagRunning(false);
    }
  };

  const handleStudentsUploaded = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    window.addEventListener("studentsUploaded", handleStudentsUploaded);
    return () => window.removeEventListener("studentsUploaded", handleStudentsUploaded);
  }, [fetchData, handleStudentsUploaded]);

  const openPayDialog = (student, universityId) => {
    setPayStudent({ ...student, universityId });
    setPayAmount(student.balance || 0);
    setPayMethod("telebirr");
    setPayDialogOpen(true);
  };

  const closePayDialog = () => {
    setPayDialogOpen(false);
    setPayStudent(null);
    setPayAmount("");
    setPayMethod("telebirr");
  };

  const submitPayment = async () => {
    if (!payStudent || !payAmount || Number(payAmount) <= 0 || Number(payAmount) > payStudent.balance) return;
    setPaying(true);
    try {
      const res = await api.post("/payments", { studentId: payStudent.id, amount: Number(payAmount), method: payMethod });
      await fetchUniversityStudents(payStudent.universityId, pagingByUniversity[payStudent.universityId]?.page || 1, 10);
      await fetchData();
      const payment = res?.data?.payment || null;
      const remainingBalance = payStudent.balance - Number(payAmount);
      setPayReceipt({ payment, student: payStudent, amount: Number(payAmount), method: payMethod, remainingBalance });
      closePayDialog();
      setReceiptOpen(true);
      toast.success(`Payment of Br ${formatNumber(payAmount)} successful!`);
    } catch (err) {
      console.error("Payment failed:", err);
      toast.error(err?.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const closeReceipt = () => {
    setReceiptOpen(false);
    setPayReceipt(null);
  };

  const printReceipt = () => {
    if (!payReceipt) return;
    const r = payReceipt;
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Receipt</title>
          <style>
            @page { size: A4; margin: 20mm }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111; }
            .receipt { max-width: 800px; margin: 0 auto; padding: 16px; }
            .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px }
            .brand { font-size:18px; font-weight:700 }
            .meta { font-size:12px; color:#444 }
            .box { border:1px solid #e2e8f0; padding:12px; border-radius:6px; margin-bottom:10px }
            .row { display:flex; justify-content:space-between; margin:8px 0; }
            .label { color:#555 }
            .value { font-weight:600 }
            .total { font-size:18px; font-weight:800; margin-top:8px }
            .small { font-size:12px; color:#666 }
            @media print { button{ display:none } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="brand">Cost Sharing System</div>
              <div class="meta">Receipt: ${r.payment?.id || '-'}<br/>Date: ${new Date(r.payment?.createdAt || Date.now()).toLocaleString()}</div>
            </div>
            <div class="box">
              <div class="row"><div class="label">Student</div><div class="value">${r.student?.fullName || '-'} (${r.student?.studentId || '-'})</div></div>
              <div class="row"><div class="label">University</div><div class="value">${r.student?.universityId || '-'}</div></div>
              <div class="row"><div class="label">Method</div><div class="value">${(r.method || r.payment?.method || '-').toString().toUpperCase()}</div></div>
            </div>
            <div class="box">
              <div class="row"><div class="label">Amount Paid</div><div class="value">${formatCurrency(r.amount)}</div></div>
              <div class="row"><div class="label">Remaining Balance</div><div class="value">${formatCurrency(r.remainingBalance)}</div></div>
              <div class="small">This receipt confirms payment recorded in the Cost Sharing System.</div>
            </div>
            <div style="text-align:center; margin-top:18px" class="small">Powered by Cost Sharing</div>
          </div>
        </body>
      </html>`;

    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.onload = () => {
      try {
        w.focus();
        w.print();
        setTimeout(() => w.close(), 500);
      } catch (e) {
        console.error('Print failed', e);
      }
    };
  };

  const downloadPdfReceipt = () => {
    if (!payReceipt) return;
    const r = payReceipt;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    let y = 40;

    doc.setFontSize(18);
    doc.text("Cost Sharing System - Payment Receipt", margin, y);
    y += 28;

    doc.setFontSize(11);
    doc.text(`Receipt ID: ${r.payment?.id || "-"}`, margin, y);
    doc.text(`Date: ${new Date(r.payment?.createdAt || Date.now()).toLocaleString()}`, 300, y);
    y += 20;

    doc.setFontSize(12);
    doc.text("Student:", margin, y);
    doc.setFont(undefined, "bold");
    doc.text(`${r.student?.fullName || "-"} (${r.student?.studentId || "-"})`, margin + 70, y);
    doc.setFont(undefined, "normal");
    y += 18;

    doc.text("University ID:", margin, y);
    doc.text(`${r.student?.universityId || "-"}`, margin + 90, y);
    y += 18;

    doc.text("Method:", margin, y);
    doc.text(`${(r.method || r.payment?.method || "-").toString().toUpperCase()}`, margin + 70, y);
    y += 24;

    doc.setDrawColor(200);
    doc.line(margin, y, 595 - margin, y);
    y += 12;

    doc.setFontSize(12);
    doc.text("Amount Paid:", margin, y);
    doc.text(`${formatCurrency(r.amount)}`, 400, y, { align: "right" });
    y += 18;
    doc.text("Remaining Balance:", margin, y);
    doc.text(`${formatCurrency(r.remainingBalance)}`, 400, y, { align: "right" });
    y += 28;

    doc.setFontSize(10);
    doc.text("This receipt confirms a payment recorded in the Cost Sharing System.", margin, y);

    const fileName = `receipt_${r.payment?.id || Date.now()}.pdf`;
    doc.save(fileName);
  };

  const primaryStats = [
    {
      label: "Total Paid",
      value: formatCurrency(summary.totalPaid),
      icon: <TrendingUpIcon />,
      color: "success",
    },
    {
      label: "Total Unpaid",
      value: formatCurrency(summary.totalUnpaid),
      icon: <TrendingDownIcon />,
      color: "warning",
    },
    {
      label: "Interest Accumulated",
      value: formatCurrency(summary.interestAccumulated),
      icon: <SavingsIcon />,
      color: "info",
    },
  ];

  const studentStats = [
    {
      label: "Total Students",
      value: formatNumber(studentSummary.totalStudents),
      icon: <PeopleAltIcon color="primary" />,
    },
    ...(isAdmin
      ? [
          {
            label: "Portfolio Cost",
            value: formatCurrency(studentSummary.totalCost),
            icon: <SavingsIcon color="secondary" />,
          },
        ]
      : []),
    {
      label: "Paid Students",
      value: formatNumber(studentSummary.paidStudents),
      icon: <CheckCircleIcon color="success" />,
    },
    {
      label: "Partial Paid Students",
      value: formatNumber(studentSummary.partialStudents),
      icon: <PendingActionsIcon color="warning" />,
    },
    {
      label: "Unpaid Students",
      value: formatNumber(studentSummary.unpaidStudents),
      icon: <HourglassEmptyIcon color="error" />,
    },
    ...(isAdmin
      ? [
          {
            label: "Volume Paid",
            value: formatCurrency(studentSummary.totalPaidAmount),
            icon: <TrendingUpIcon color="success" />,
          },
        ]
      : []),
    {
      label: "Portfolio Balance",
      value: formatCurrency(studentSummary.totalBalance),
      icon: <AccountBalanceWalletIcon color="info" />,
    },
  ];

  useEffect(() => {
    if (!isAdmin || universitiesStatus.length === 0 || expanded !== null) return;
    const firstId = universitiesStatus[0]?.id;
    if (!firstId) return;
    setExpanded(firstId);
    if (!studentsByUniversity[firstId]) {
      const f = filtersByUniversity[firstId] || {};
      fetchUniversityStudents(firstId, 1, 10, f.search || "", f.status || "");
    }
  }, [isAdmin, universitiesStatus, expanded, studentsByUniversity, filtersByUniversity, fetchUniversityStudents]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: alpha(theme.palette.background.default, 0.95) }}>
      {fetchError && (
        <StackMui sx={{ mb: 2 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => fetchData()}>
                Retry
              </Button>
            }
          >
            {fetchError}
          </Alert>
        </StackMui>
      )}

      {/* Top Section: Welcome + Primary Stats Cards */}
      <Grid container spacing={3} alignItems="flex-start" mb={4}>
        {/* Welcome Message (Left) */}
        <Grid item xs={12} md={6}>
          <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
            Cost Sharing Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Live collection performance, student pipelines, and institutional health.
          </Typography>
        </Grid>

        {/* Primary Stats Cards (Right) */}
        <Grid item xs={12} md={6}>
          {usedFallback && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Offline - showing sample data
            </Alert>
          )}
          <Grid container spacing={2}>
            {primaryStats.map((stat) => (
              <Grid item xs={12} sm={6} md={12} key={stat.label}>
                <Card sx={{ bgcolor: `${stat.color}.light`, color: `${stat.color}.contrastText`, borderRadius: 3 }}>
                  <CardContent sx={{ py: 2.5, px: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                        {stat.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {stat.label}
                        </Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {stat.value}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Refresh Button */}
      <Stack direction="row" justifyContent="flex-end" mb={3}>
        <MuiTooltip title="Refresh data">
          <span>
            <Button
              variant="outlined"
              startIcon={<RefreshRoundedIcon />}
              onClick={fetchData}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </span>
        </MuiTooltip>
      </Stack>

      {/* Ministry Filters */}
      {isAdmin && (
        <Card sx={{ borderRadius: 3, mb: 4, p: 2 }}>
          <CardHeader
            title="Ministry Filters"
            subheader="Scope analytics by year, region, or university"
            action={<Chip label="Auto applies" size="small" color="success" />}
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ px: 2, pb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="year-filter-label">Year</InputLabel>
              <Select
                labelId="year-filter-label"
                label="Year"
                value={filters.year}
                onChange={handleFilterChange("year")}
              >
                <MenuItem value="all">All Years</MenuItem>
                {yearOptions.map((yr) => (
                  <MenuItem key={yr} value={yr}>
                    {yr}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="region-filter-label">Region</InputLabel>
              <Select
                labelId="region-filter-label"
                label="Region"
                value={filters.region}
                onChange={handleFilterChange("region")}
              >
                <MenuItem value="all">All Regions</MenuItem>
                {regionOptions.map((region) => (
                  <MenuItem key={region} value={region}>
                    {region}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="university-filter-label">University</InputLabel>
              <Select
                labelId="university-filter-label"
                label="University"
                value={filters.university}
                onChange={handleFilterChange("university")}
              >
                <MenuItem value="all">All Universities</MenuItem>
                {allUniversities.map((uni) => (
                  <MenuItem key={uni.id} value={uni.id}>
                    {uni.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="text"
              onClick={() => setFilters({ year: currentYear, region: "all", university: "all" })}
            >
              Reset
            </Button>
          </Stack>
        </Card>
      )}

      {/* Pending Upload Batches */}
      {isAdmin && (
        <Card sx={{ mt: 4, borderRadius: 3, p: 2 }}>
          <CardHeader
            title="Pending Upload Batches"
            subheader="Approve or reject entire student file uploads from universities"
            action={<Chip label={`${pendingUploads.length || 0} pending batches`} size="small" />}
          />
          {pendingUploads.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary">
                No pending batch uploads right now.
              </Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>University</TableCell>
                  <TableCell>File Name</TableCell>
                  <TableCell>Students</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingUploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell>{upload.universityName || "—"}</TableCell>
                    <TableCell>{upload.fileName || "—"}</TableCell>
                    <TableCell>{formatNumber(upload.studentCount)}</TableCell>
                    <TableCell>{formatDate(upload.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          disabled={approvingBatch[upload.id]}
                          onClick={() => handleBatchApproval(upload.id, "approved")}
                        >
                          Approve Batch
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          disabled={approvingBatch[upload.id]}
                          onClick={() => handleBatchApproval(upload.id, "rejected")}
                        >
                          Reject Batch
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Student Portfolio */}
      <Card sx={{ borderRadius: 3, mb: 4, p: 2 }}>
        <CardHeader
          title="Student Portfolio"
          subheader="Snapshot across paid, unpaid, and total balance"
          action={<Chip label="Live" color="success" size="small" />}
        />
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {studentStats.map((item) => (
            <Grid item xs={12} md={3} key={item.label}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.light, 0.05),
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  p: 2,
                }}
              >
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                  {item.icon}
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {item.value ?? 0}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, p: 2, height: "100%" }}>
            <CardHeader
              title="University Performance"
              subheader="Paid vs unpaid volume"
              action={<Chip label="Stacked" size="small" />}
            />
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={universityData}>
                <XAxis dataKey="university" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="paid" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unpaid" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, p: 2, height: "100%" }}>
            <CardHeader
              title="Monthly Collections"
              subheader="Rolling 12 months"
              action={<Chip label="Live feed" size="small" color="primary" />}
            />
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <CardHeader title="Portfolio Split" subheader="Paid vs unpaid ratio" />
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Paid", value: summary.totalPaid },
                    { name: "Unpaid", value: summary.totalUnpaid },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {COLORS.map((color, index) => (
                    <Cell key={color} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <CardHeader
              title="Interest Trend"
              subheader={`Year ${filters.year === "all" ? currentYear : filters.year}`}
            />
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={interestTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="interest"
                  stroke={theme.palette.secondary.main}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Universities & Students */}
      {isAdmin && (
        <Card sx={{ mt: 5, borderRadius: 3, p: 2 }}>
          <CardHeader title="Universities & Students" subheader="Deep dive into individual pipelines" />
          <Divider sx={{ mb: 2 }} />
          {universitiesStatus.map((u) => (
            <Accordion
              key={u.id}
              disableGutters
              elevation={0}
              sx={{
                mb: 2,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                "&:before": { display: "none" },
                backdropFilter: "blur(12px)",
              }}
              expanded={expanded === u.id}
              onChange={async (e, isExpanded) => {
                setExpanded(isExpanded ? u.id : null);
                if (isExpanded && !studentsByUniversity[u.id]) {
                  const f = filtersByUniversity[u.id] || {};
                  await fetchUniversityStudents(u.id, 1, 10, f.search || "", f.status || "");
                }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: "flex", alignItems: { xs: "flex-start", md: "center" }, width: "100%", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                  <Box sx={{ minWidth: 160 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {u.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {u.location || ""}
                    </Typography>
                  </Box>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                    <Chip label={`Students: ${formatNumber(u.totalStudents)}`} size="small" />
                    <Chip label={`Paid: ${formatNumber(u.paid)}`} size="small" color="success" />
                    <Chip label={`Partial: ${formatNumber(u.partial)}`} size="small" color="info" />
                    <Chip label={`Unpaid: ${formatNumber(u.unpaid)}`} size="small" color="warning" />
                  </Stack>
                  <Box sx={{ textAlign: { xs: "left", md: "right" }, minWidth: 200 }}>
                    <Typography variant="body2">Cost: {formatCurrency(u.totals?.totalCost ?? 0)}</Typography>
                    <Typography variant="body2">Paid: {formatCurrency(u.totals?.totalPaidAmount ?? 0)}</Typography>
                    <Typography variant="body2" color="error.main">
                      Outstanding: {formatCurrency(u.totals?.totalOutstanding ?? u.totalBalance ?? 0)}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {loadingByUniversity[u.id] ? (
                  <Box textAlign="center" py={2}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" mb={2}>
                      <TextField
                        size="small"
                        label="Search"
                        value={filtersByUniversity[u.id]?.search || ""}
                        onChange={(e) => setFiltersByUniversity((f) => ({ ...f, [u.id]: { ...(f[u.id] || {}), search: e.target.value } }))}
                      />
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel id={`status-label-${u.id}`}>Status</InputLabel>
                        <Select
                          labelId={`status-label-${u.id}`}
                          label="Status"
                          value={filtersByUniversity[u.id]?.status || "all"}
                          onChange={(e) => setFiltersByUniversity((f) => ({ ...f, [u.id]: { ...(f[u.id] || {}), status: e.target.value } }))}
                        >
                          <MenuItem value="all">All</MenuItem>
                          <MenuItem value="paid">Paid</MenuItem>
                          <MenuItem value="unpaid">Unpaid</MenuItem>
                          <MenuItem value="partial">Partial</MenuItem>
                        </Select>
                      </FormControl>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={async () => {
                          const f = filtersByUniversity[u.id] || {};
                          await fetchUniversityStudents(u.id, 1, 10, f.search || "", f.status || "");
                        }}
                      >
                        Apply Filters
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<GetAppIcon />}
                        onClick={async () => {
                          try {
                            const f = filtersByUniversity[u.id] || {};
                            const params = {};
                            if (f.search) params.search = f.search;
                            if (f.status && f.status !== "all") params.status = f.status;
                            const res = await api.get(`/reports/university/${u.id}/export`, { params, responseType: "blob" });
                            const blob = new Blob([res.data], { type: "text/csv" });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${u.name || "university"}-students.csv`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(url);
                          } catch (err) {
                            console.error("Export failed", err);
                          }
                        }}
                      >
                        Export CSV
                      </Button>
                    </Stack>

                    <TableContainer component={Paper} sx={{ maxHeight: 420 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Student ID</TableCell>
                            <TableCell>Full name</TableCell>
                            <TableCell>Program</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Balance</TableCell>
                            <TableCell align="right">Rate (%)</TableCell>
                            <TableCell align="right">Accrued Interest</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Total Due</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(studentsByUniversity[u.id]?.students || []).map((s) => (
                            <TableRow key={s.id}>
                              <TableCell>{s.studentId}</TableCell>
                              <TableCell>{s.fullName}</TableCell>
                              <TableCell>{s.program}</TableCell>
                              <TableCell>{s.status}</TableCell>
                              <TableCell align="right">{formatCurrency(s.balance)}</TableCell>
                              <TableCell align="right">{s.rate}%</TableCell>
                              <TableCell align="right">{formatCurrency(s.accruedInterest)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: "error.main" }}>
                                {formatCurrency(s.totalDue)}
                              </TableCell>
                              <TableCell align="right">
                                {((user?.role === "university" && String(user.universityId) === String(u.id)) || isAdmin) && Number(s.balance) > 0 ? (
                                  <Button size="small" variant="contained" onClick={() => openPayDialog(s, u.id)}>
                                    Pay
                                  </Button>
                                ) : (
                                  <span />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TablePagination
                              rowsPerPageOptions={[5, 10, 25]}
                              count={studentsByUniversity[u.id]?.total || 0}
                              rowsPerPage={pagingByUniversity[u.id]?.pageSize || 10}
                              page={(pagingByUniversity[u.id]?.page || 1) - 1}
                              onPageChange={(e, newPage) => {
                                const f = filtersByUniversity[u.id] || {};
                                fetchUniversityStudents(u.id, newPage + 1, pagingByUniversity[u.id]?.pageSize || 10, f.search || "", f.status || "");
                              }}
                              onRowsPerPageChange={(e) => {
                                const f = filtersByUniversity[u.id] || {};
                                fetchUniversityStudents(u.id, 1, parseInt(e.target.value, 10), f.search || "", f.status || "");
                              }}
                            />
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
          {universitiesStatus.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary">
                No universities found for the selected filters.
              </Typography>
            </Box>
          )}
        </Card>
      )}

      {/* Diagnostics */}
      <Collapse in>
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Diagnostics</Typography>
                <Typography variant="caption" color="text.secondary">Run quick endpoint checks from the browser to inspect responses/config.</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={runDiagnostics} disabled={diagRunning}>
                  {diagRunning ? "Running..." : "Run Diagnostics"}
                </Button>
                <Button size="small" variant="text" onClick={() => { setDiagResults(null); setDiagError(null); }}>
                  Clear
                </Button>
              </Stack>
            </Stack>
            {diagError && <Alert severity="error" sx={{ mt: 2 }}>{diagError}</Alert>}
            {diagResults && (
              <Box sx={{ mt: 2, maxHeight: 280, overflow: "auto", bgcolor: "background.paper", p: 1, borderRadius: 1 }}>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(diagResults, null, 2)}</pre>
              </Box>
            )}
          </CardContent>
        </Card>
      </Collapse>

      {/* Payment Dialog */}
      <Dialog open={payDialogOpen} onClose={closePayDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Pay Cost Sharing</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>Student: {payStudent?.fullName}</Typography>
          <TextField
            label="Amount"
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            fullWidth
            inputProps={{ min: 0, max: payStudent?.balance || 0 }}
            helperText={`Max: ${payStudent ? formatCurrency(payStudent.balance) : ""}`}
            sx={{ mb: 2 }}
          />
          <Typography variant="caption" display="block" sx={{ mb: 1 }}>Select payment method</Typography>
          <RadioGroup value={payMethod} onChange={(e) => setPayMethod(e.target.value)} row>
            <FormControlLabel value="telebirr" control={<Radio />} label="Tele Birr" />
            <FormControlLabel value="cbe" control={<Radio />} label="CBE" />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePayDialog} disabled={paying}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={submitPayment} 
            disabled={paying || !payAmount || Number(payAmount) <= 0 || Number(payAmount) > (payStudent?.balance || 0)}
          >
            {paying ? "Processing..." : `Pay ${formatCurrency(payAmount || 0)}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onClose={closeReceipt} maxWidth="xs" fullWidth>
        <DialogTitle>Payment Receipt</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2">Full Name:</Typography>
            <Typography variant="body2">{payReceipt?.student?.fullName} ({payReceipt?.student?.studentId})</Typography>
          </Box>
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2">Paid Amount:</Typography>
            <Typography variant="body2">{formatCurrency(payReceipt?.amount)}</Typography>
          </Box>
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2">Payment Method:</Typography>
            <Typography variant="body2">{(payReceipt?.method || payReceipt?.payment?.method || "-").toUpperCase()}</Typography>
          </Box>
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2">Date</Typography>
            <Typography variant="body2">{payReceipt?.payment?.createdAt ? new Date(payReceipt.payment.createdAt).toLocaleString() : new Date().toLocaleString()}</Typography>
          </Box>
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2">Remaining Balance</Typography>
            <Typography variant="body2">{formatCurrency(payReceipt?.remainingBalance)}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={printReceipt}>Print</Button>
          <Button onClick={downloadPdfReceipt}>Download PDF</Button>
          <Button variant="contained" onClick={closeReceipt}>Done</Button>
        </DialogActions>
      </Dialog>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </Box>
  );
}