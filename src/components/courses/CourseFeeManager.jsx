import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  FormControlLabel,
  Switch
} from '@mui/material';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import PercentIcon from '@mui/icons-material/Percent';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SchoolIcon from '@mui/icons-material/School';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import { loadDB, saveDB } from '../../services/storage';
import { exportToExcel } from '../../services/exportUtils';

// Helper: Calculate exact fee breakdown
export function calculateFeeBreakdown(fs = {}) {
  const basePrice = Number(fs.basePrice) || 0;
  const discountPercent = Number(fs.discountPercent) || 0;
  const discountAmount = Math.round(basePrice * (discountPercent / 100));
  const netTuition = Math.max(0, basePrice - discountAmount);
  const admissionFee = Number(fs.admissionFee) || 0;
  const subtotal = netTuition + admissionFee;
  const vatPercent = Number(fs.vatPercent) || 13;
  const vatAmount = Math.round(subtotal * (vatPercent / 100));
  const totalEffectiveFee = subtotal + vatAmount;

  const paymentMode = fs.paymentMode || (basePrice === 0 ? 'FULL_ONLY' : 'TWO_INSTALLMENTS');
  const installment1 = paymentMode === 'TWO_INSTALLMENTS' ? Math.ceil(totalEffectiveFee / 2) : totalEffectiveFee;
  const installment2 = paymentMode === 'TWO_INSTALLMENTS' ? (totalEffectiveFee - installment1) : 0;

  return {
    basePrice,
    discountPercent,
    discountAmount,
    netTuition,
    admissionFee,
    subtotal,
    vatPercent,
    vatAmount,
    totalEffectiveFee,
    paymentMode,
    installment1,
    installment2,
    fullPayDiscount: Number(fs.fullPayDiscount) || 0
  };
}

export default function CourseFeeManager() {
  const [db, setDb] = useState(loadDB());
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
  const [modeFilter, setModeFilter] = useState('ALL'); // 'ALL' | 'TWO_INSTALLMENTS' | 'FULL_ONLY'

  // Modal State
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [saveSuccessAlert, setSaveSuccessAlert] = useState(false);

  // Form State for Setting Course Fee (Course selected from dropdown)
  const [newCourseFeeData, setNewCourseFeeData] = useState({
    courseId: '',
    basePrice: 30000,
    discountPercent: 70,
    admissionFee: 1500,
    vatPercent: 13,
    paymentMode: 'TWO_INSTALLMENTS',
    fullPayDiscount: 1000,
    revisionReason: 'Initial official fee schedule',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  // Form State for Fee Editing
  const [formData, setFormData] = useState({
    courseId: '',
    basePrice: 30000,
    discountPercent: 70,
    admissionFee: 1500,
    vatPercent: 13,
    paymentMode: 'TWO_INSTALLMENTS',
    fullPayDiscount: 1000,
    revisionReason: 'Campaign and fee revision',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  // Ensure all courses have a default feeStructure
  const coursesWithFees = useMemo(() => {
    return (db.courses || []).map((crs) => {
      let fs = crs.feeStructure;
      if (!fs) {
        const isBasic = (crs.title || '').toLowerCase().includes('basic') && (crs.price || 0) <= 2000;
        fs = {
          basePrice: isBasic ? 0 : (crs.price || 30000),
          discountPercent: isBasic ? 0 : 70,
          admissionFee: isBasic ? 1700 : 1500,
          vatPercent: 13,
          paymentMode: isBasic ? 'FULL_ONLY' : 'TWO_INSTALLMENTS',
          fullPayDiscount: isBasic ? 0 : 1000,
          effectiveDate: '2026-07-16',
          revisionReason: isBasic ? 'Basic course admission rate' : 'Special 70% campaign offer',
          revisionHistory: [
            {
              id: 'init-1',
              date: '2026-07-16',
              changedBy: 'Super Admin',
              basePrice: isBasic ? 0 : (crs.price || 30000),
              discountPercent: isBasic ? 0 : 70,
              admissionFee: isBasic ? 1700 : 1500,
              vatPercent: 13,
              totalEffectiveFee: isBasic ? 1921 : 11865,
              paymentMode: isBasic ? 'FULL_ONLY' : 'TWO_INSTALLMENTS',
              reason: 'Initial official fee schedule'
            }
          ]
        };
      }
      const calc = calculateFeeBreakdown(fs);
      return {
        ...crs,
        feeStructure: fs,
        feeCalc: calc
      };
    });
  }, [db.courses]);

  // Filtered List
  const filteredCourses = useMemo(() => {
    return coursesWithFees.filter((crs) => {
      const matchSearch = (crs.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (crs.level || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;

      if (modeFilter !== 'ALL' && crs.feeStructure?.paymentMode !== modeFilter) {
        return false;
      }
      return true;
    });
  }, [coursesWithFees, searchTerm, modeFilter]);

  // Overall Statistics Metrics
  const stats = useMemo(() => {
    const total = coursesWithFees.length;
    let fullOnlyCount = 0;
    let installmentCount = 0;
    let totalRev = 0;

    coursesWithFees.forEach((crs) => {
      if (crs.feeStructure?.paymentMode === 'FULL_ONLY') fullOnlyCount++;
      else installmentCount++;
      totalRev += crs.feeCalc.totalEffectiveFee;
    });

    const avgFee = total > 0 ? Math.round(totalRev / total) : 0;
    return { total, fullOnlyCount, installmentCount, avgFee };
  }, [coursesWithFees]);

  // Open Edit Modal for a course
  const handleOpenEdit = (crs) => {
    setSelectedCourse(crs);
    const fs = crs.feeStructure || {};
    setFormData({
      courseId: crs.id,
      basePrice: fs.basePrice !== undefined ? fs.basePrice : 30000,
      discountPercent: fs.discountPercent !== undefined ? fs.discountPercent : 70,
      admissionFee: fs.admissionFee !== undefined ? fs.admissionFee : 1500,
      vatPercent: fs.vatPercent !== undefined ? fs.vatPercent : 13,
      paymentMode: fs.paymentMode || 'TWO_INSTALLMENTS',
      fullPayDiscount: fs.fullPayDiscount || 1000,
      revisionReason: '',
      effectiveDate: new Date().toISOString().split('T')[0]
    });
    setOpenEditModal(true);
  };

  // Helper to get Occupation name
  const getOccupationName = (occId) => {
    const occ = (db.occupations || []).find((o) => o.id === occId);
    return occ ? occ.name : 'General Technical Skill';
  };

  // When a course is selected in the dropdown
  const handleCourseSelect = (courseId) => {
    const crs = (db.courses || []).find((c) => c.id === courseId);
    if (!crs) return;
    const fs = crs.feeStructure || {};
    const isBasic = (crs.title || '').toLowerCase().includes('basic') && (crs.price || 0) <= 2000;

    setNewCourseFeeData({
      courseId: crs.id,
      basePrice: fs.basePrice !== undefined ? fs.basePrice : (isBasic ? 0 : (crs.price || 30000)),
      discountPercent: fs.discountPercent !== undefined ? fs.discountPercent : (isBasic ? 0 : 70),
      admissionFee: fs.admissionFee !== undefined ? fs.admissionFee : (isBasic ? 1700 : 1500),
      vatPercent: fs.vatPercent !== undefined ? fs.vatPercent : 13,
      paymentMode: fs.paymentMode || (isBasic ? 'FULL_ONLY' : 'TWO_INSTALLMENTS'),
      fullPayDiscount: fs.fullPayDiscount || 1000,
      revisionReason: fs.revisionReason || 'Course fee structure setup',
      effectiveDate: new Date().toISOString().split('T')[0]
    });
  };

  // Open Add Course Fee Modal (Defaults to first course from Course Section)
  const handleOpenAddCourse = () => {
    const firstCourse = db.courses?.[0];
    if (firstCourse) {
      handleCourseSelect(firstCourse.id);
    } else {
      setNewCourseFeeData({
        courseId: '',
        basePrice: 30000,
        discountPercent: 70,
        admissionFee: 1500,
        vatPercent: 13,
        paymentMode: 'TWO_INSTALLMENTS',
        fullPayDiscount: 1000,
        revisionReason: 'Initial official fee schedule',
        effectiveDate: new Date().toISOString().split('T')[0]
      });
    }
    setOpenAddModal(true);
  };

  // Save Course Fee Configuration
  const handleSaveCourseFee = (e) => {
    e.preventDefault();
    if (!newCourseFeeData.courseId) {
      alert('Please select a course first.');
      return;
    }

    const targetCourse = (db.courses || []).find((c) => c.id === newCourseFeeData.courseId);
    if (!targetCourse) {
      alert('Selected course not found.');
      return;
    }

    const calc = calculateFeeBreakdown(newCourseFeeData);
    const existingHistory = targetCourse.feeStructure?.revisionHistory || [];

    const newRevisionEntry = {
      id: `rev-${Date.now()}`,
      date: newCourseFeeData.effectiveDate,
      changedBy: 'Super Admin',
      basePrice: Number(newCourseFeeData.basePrice) || 0,
      discountPercent: Number(newCourseFeeData.discountPercent) || 0,
      admissionFee: Number(newCourseFeeData.admissionFee) || 0,
      vatPercent: Number(newCourseFeeData.vatPercent) || 13,
      totalEffectiveFee: calc.totalEffectiveFee,
      paymentMode: newCourseFeeData.paymentMode,
      reason: newCourseFeeData.revisionReason || 'Course fee setup/revision'
    };

    const newFeeStructure = {
      basePrice: Number(newCourseFeeData.basePrice) || 0,
      discountPercent: Number(newCourseFeeData.discountPercent) || 0,
      admissionFee: Number(newCourseFeeData.admissionFee) || 0,
      vatPercent: Number(newCourseFeeData.vatPercent) || 13,
      paymentMode: newCourseFeeData.paymentMode,
      fullPayDiscount: Number(newCourseFeeData.fullPayDiscount) || 0,
      effectiveDate: newCourseFeeData.effectiveDate,
      revisionReason: newCourseFeeData.revisionReason || 'Course fee setup/revision',
      revisionHistory: [newRevisionEntry, ...existingHistory]
    };

    const nextCourses = (db.courses || []).map((crs) => {
      if (crs.id === newCourseFeeData.courseId) {
        return {
          ...crs,
          price: calc.totalEffectiveFee,
          feeStructure: newFeeStructure
        };
      }
      return crs;
    });

    const nextDb = {
      ...db,
      courses: nextCourses
    };

    saveDB(nextDb);
    setDb(nextDb);
    setOpenAddModal(false);
    setSaveSuccessAlert(true);
    setTimeout(() => setSaveSuccessAlert(false), 3500);
  };

  // Open History Modal
  const handleOpenHistory = (crs) => {
    setSelectedCourse(crs);
    setOpenHistoryModal(true);
  };

  // Save Updated Fee Structure
  const handleSaveFeeStructure = (e) => {
    e.preventDefault();
    if (!selectedCourse) return;

    const calc = calculateFeeBreakdown(formData);

    const newRevisionEntry = {
      id: `rev-${Date.now()}`,
      date: formData.effectiveDate || new Date().toISOString().split('T')[0],
      changedBy: 'Super Admin',
      basePrice: Number(formData.basePrice) || 0,
      discountPercent: Number(formData.discountPercent) || 0,
      admissionFee: Number(formData.admissionFee) || 0,
      vatPercent: Number(formData.vatPercent) || 13,
      totalEffectiveFee: calc.totalEffectiveFee,
      paymentMode: formData.paymentMode,
      reason: formData.revisionReason || 'Fee revision'
    };

    const existingHistory = selectedCourse.feeStructure?.revisionHistory || [];

    const updatedFeeStructure = {
      basePrice: Number(formData.basePrice) || 0,
      discountPercent: Number(formData.discountPercent) || 0,
      admissionFee: Number(formData.admissionFee) || 0,
      vatPercent: Number(formData.vatPercent) || 13,
      paymentMode: formData.paymentMode,
      fullPayDiscount: Number(formData.fullPayDiscount) || 0,
      effectiveDate: formData.effectiveDate,
      revisionReason: formData.revisionReason,
      revisionHistory: [newRevisionEntry, ...existingHistory]
    };

    const nextCourses = (db.courses || []).map((crs) => {
      if (crs.id === selectedCourse.id) {
        return {
          ...crs,
          price: calc.totalEffectiveFee, // keep legacy field in sync with net effective fee
          feeStructure: updatedFeeStructure
        };
      }
      return crs;
    });

    const nextDb = {
      ...db,
      courses: nextCourses
    };

    saveDB(nextDb);
    setDb(nextDb);
    setOpenEditModal(false);
    setSaveSuccessAlert(true);
    setTimeout(() => setSaveSuccessAlert(false), 3500);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = coursesWithFees.map((crs, idx) => ({
      'S.N.': idx + 1,
      'Course Title': crs.title,
      'Level': crs.level,
      'Duration': `${crs.durationValue} ${crs.durationUnit} (${crs.totalHours} Hours)`,
      'Brochure Fee': crs.feeCalc.basePrice,
      'Discount %': `${crs.feeCalc.discountPercent}%`,
      'Discount Amount': crs.feeCalc.discountAmount,
      'Net Tuition': crs.feeCalc.netTuition,
      'Admission Fee': crs.feeCalc.admissionFee,
      'Subtotal (Taxable)': crs.feeCalc.subtotal,
      '13% VAT Amount': crs.feeCalc.vatAmount,
      'Total Effective Fee': crs.feeCalc.totalEffectiveFee,
      'Payment Model': crs.feeStructure?.paymentMode === 'FULL_ONLY' ? 'Full Upfront' : '2 Installments (50% + 50%)',
      '1st Installment': crs.feeCalc.installment1,
      '2nd Installment (After 1 Month)': crs.feeCalc.installment2
    }));

    exportToExcel(exportData, 'GlobalEra_Course_Fee_Structures_13VAT');
  };

  // Preview breakdown inside Edit Modal as user changes inputs
  const livePreview = useMemo(() => {
    return calculateFeeBreakdown(formData);
  }, [formData]);

  // Preview breakdown inside Add New Course Modal
  const newCourseLivePreview = useMemo(() => {
    return calculateFeeBreakdown(newCourseFeeData);
  }, [newCourseFeeData]);

  // Selected Course Info for Course Profile Card inside Add Modal
  const selectedCourseInfo = useMemo(() => {
    return (db.courses || []).find((c) => c.id === newCourseFeeData.courseId);
  }, [db.courses, newCourseFeeData.courseId]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      {/* 1. Header & Title Banner */}
      <Paper
        elevation={1}
        sx={{
          p: 2.2,
          mb: 2.5,
          borderRadius: 2.5,
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, bgcolor: '#0F2E5A', borderRadius: 2, color: '#F59E0B' }}>
            <PriceCheckIcon sx={{ fontSize: 36 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
              Course Fee Structure & Master Rates
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Manage brochure fees, campaign discounts, admission fees, mandatory 13% VAT, and installment plans
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
          {/* Option requested by user: Short button "+ Course Fee" */}
          <Button
            variant="contained"
            size="small"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleOpenAddCourse}
            sx={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              fontWeight: 900,
              px: 2,
              fontSize: '0.8rem',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #047857 0%, #065F46 100%)'
              }
            }}
          >
            + Course Fee
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            onClick={() => setOpenPrintModal(true)}
            sx={{ fontWeight: 800, borderColor: '#0F2E5A', color: '#0F2E5A' }}
          >
            Print Fee Sheet
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            sx={{ fontWeight: 800, borderColor: '#059669', color: '#059669' }}
          >
            Excel Export
          </Button>
        </Stack>
      </Paper>

      {saveSuccessAlert && (
        <Alert severity="success" sx={{ mb: 2, fontWeight: 700, borderRadius: 2 }}>
          ✓ Course fee structure, VAT, and installment policy saved successfully! Applied to new admissions automatically.
        </Alert>
      )}

      {/* 2. Metrics Cards */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1} sx={{ borderRadius: 2.5, borderLeft: '4px solid #0F2E5A' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>Total Active Courses</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F2E5A', my: 0.5 }}>{stats.total}</Typography>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>CTEVT Recognized Curriculum</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1} sx={{ borderRadius: 2.5, borderLeft: '4px solid #059669' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>Avg Effective Fee (Inc. 13% VAT)</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#059669', my: 0.5 }}>NPR {stats.avgFee.toLocaleString()}</Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>Net Payable by Student</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1} sx={{ borderRadius: 2.5, borderLeft: '4px solid #0284C7' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>2-Installment Courses</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0284C7', my: 0.5 }}>{stats.installmentCount}</Typography>
              <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 700 }}>50% on admission + 50% in 1 month</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1} sx={{ borderRadius: 2.5, borderLeft: '4px solid #F59E0B' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>Basic / Full Upfront Courses</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#D97706', my: 0.5 }}>{stats.fullOnlyCount}</Typography>
              <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 700 }}>100% upfront on admission (No installments)</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Search & View Mode Filters Bar */}
      <Paper elevation={1} sx={{ p: 1.5, mb: 2.5, borderRadius: 2.5, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          {/* Search Box */}
          <TextField
            size="small"
            placeholder="Search by course title or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: '100%', sm: 300 }, bgcolor: '#F8FAFC' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8' }} />
                </InputAdornment>
              )
            }}
          />

          {/* Payment Mode Filter */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: { xs: 'none', md: 'block' } }}>
              Payment Filter:
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={modeFilter}
              exclusive
              onChange={(e, val) => val && setModeFilter(val)}
              sx={{ bgcolor: '#F8FAFC' }}
            >
              <ToggleButton value="ALL" sx={{ fontSize: '0.72rem', fontWeight: 800, px: 1.5 }}>All</ToggleButton>
              <ToggleButton value="TWO_INSTALLMENTS" sx={{ fontSize: '0.72rem', fontWeight: 800, px: 1.5 }}>2 Installments</ToggleButton>
              <ToggleButton value="FULL_ONLY" sx={{ fontSize: '0.72rem', fontWeight: 800, px: 1.5 }}>Full Upfront</ToggleButton>
            </ToggleButtonGroup>

            {/* View Mode Switcher: Card View vs Table View */}
            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(e, val) => val && setViewMode(val)}
              sx={{ bgcolor: '#F8FAFC', ml: 1 }}
            >
              <ToggleButton value="card" sx={{ px: 1.2 }}>
                <ViewModuleIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="table" sx={{ px: 1.2 }}>
                <ViewListIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>
      </Paper>

      {/* 4. MAIN CONTENT: CARD VIEW OR TABLE VIEW */}
      {viewMode === 'card' ? (
        <Grid container spacing={2.5}>
          {filteredCourses.map((crs) => {
            const { feeCalc, feeStructure: fs } = crs;
            const isFullOnly = fs?.paymentMode === 'FULL_ONLY';

            return (
              <Grid item xs={12} sm={6} md={4} key={crs.id}>
                <Paper
                  elevation={1}
                  sx={{
                    borderRadius: 2.5,
                    border: '1.5px solid #E2E8F0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(15, 46, 90, 0.12)',
                      borderColor: '#0F2E5A'
                    }
                  }}
                >
                  {/* Card Header */}
                  <Box
                    sx={{
                      p: 1.8,
                      background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)',
                      color: '#FFFFFF',
                      borderBottom: '3px solid #F59E0B'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                          {crs.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          {crs.level} • {crs.durationValue} {crs.durationUnit} ({crs.totalHours} Hours)
                        </Typography>
                      </Box>
                      <Chip
                        label={isFullOnly ? '⚡ Full Upfront' : '📅 2 Installments'}
                        size="small"
                        sx={{
                          bgcolor: isFullOnly ? '#F59E0B' : '#059669',
                          color: '#FFFFFF',
                          fontWeight: 900,
                          fontSize: '0.68rem'
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Card Pricing Body */}
                  <Box sx={{ p: 2, flex: 1, bgcolor: '#FFFFFF' }}>
                    {/* Grand Total Effective Fee Highlight */}
                    <Box
                      sx={{
                        p: 1.5,
                        mb: 2,
                        borderRadius: 2,
                        bgcolor: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#047857', display: 'block' }}>
                        Total Effective Fee (Inc. 13% VAT):
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#065F46', my: 0.3 }}>
                        NPR {feeCalc.totalEffectiveFee.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#047857', fontSize: '0.72rem' }}>
                        {isFullOnly
                          ? '100% Full Upfront on Admission'
                          : `50% at Admission (NPR ${feeCalc.installment1.toLocaleString()}) + 50% in 1 Month (NPR ${feeCalc.installment2.toLocaleString()})`}
                      </Typography>
                    </Box>

                    {/* Breakdown Details Table */}
                    <Stack spacing={0.8} sx={{ fontSize: '0.8rem' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>1. Brochure Price (Base Price):</span>
                        <b style={{ color: '#1E293B' }}>NPR {feeCalc.basePrice.toLocaleString()}</b>
                      </Box>

                      {feeCalc.discountPercent > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                          <span>2. Campaign Discount ({feeCalc.discountPercent}%):</span>
                          <b>(-) NPR {feeCalc.discountAmount.toLocaleString()}</b>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>3. Net Tuition Fee:</span>
                        <b style={{ color: '#0F2E5A' }}>NPR {feeCalc.netTuition.toLocaleString()}</b>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>4. Admission & Registration Fee:</span>
                        <b style={{ color: '#1E293B' }}>NPR {feeCalc.admissionFee.toLocaleString()}</b>
                      </Box>

                      <Divider sx={{ my: 0.3 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#0369A1', fontWeight: 700 }}>
                        <span>Subtotal (Taxable Amount):</span>
                        <span>NPR {feeCalc.subtotal.toLocaleString()}</span>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', fontWeight: 700 }}>
                        <span>VAT 13%:</span>
                        <span>(+) NPR {feeCalc.vatAmount.toLocaleString()}</span>
                      </Box>
                    </Stack>

                    {/* Revision Reason Tag */}
                    {fs?.revisionReason && (
                      <Box sx={{ mt: 1.5, p: 0.8, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px dashed #CBD5E1' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem' }}>
                          📌 <b>Current Offer / Reason:</b> {fs.revisionReason} (Effective: {fs.effectiveDate || 'Current'})
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Card Action Buttons */}
                  <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenEdit(crs)}
                      sx={{
                        bgcolor: '#0F2E5A',
                        fontWeight: 800,
                        fontSize: '0.74rem',
                        '&:hover': { bgcolor: '#0B2545' }
                      }}
                    >
                      Edit Fee
                    </Button>

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<HistoryIcon />}
                      onClick={() => handleOpenHistory(crs)}
                      sx={{ fontWeight: 800, fontSize: '0.74rem', minWidth: 90 }}
                    >
                      History
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        /* TABLE VIEW (EXCEL STYLE) */
        <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2.5, border: '1px solid #CBD5E1', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ '& th': { bgcolor: '#0F2E5A !important', color: '#FFFFFF !important', borderBottom: '3px solid #F59E0B !important', py: 1.3 } }}>
              <TableRow>
                <TableCell align="center" sx={{ width: 65, fontWeight: 900, color: '#FFFFFF !important' }}># S.N.</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Course Details</TableCell>
                <TableCell align="right" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Base Fee</TableCell>
                <TableCell align="center" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Discount (%)</TableCell>
                <TableCell align="right" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Net Tuition</TableCell>
                <TableCell align="right" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Admission Fee</TableCell>
                <TableCell align="right" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Subtotal</TableCell>
                <TableCell align="right" sx={{ color: '#FCD34D !important', fontWeight: 900 }}>13% VAT</TableCell>
                <TableCell align="right" sx={{ color: '#34D399 !important', fontWeight: 900 }}>Final Net Fee</TableCell>
                <TableCell align="center" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Payment Model</TableCell>
                <TableCell align="center" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCourses.map((crs, index) => {
                const { feeCalc, feeStructure: fs } = crs;
                const isFullOnly = fs?.paymentMode === 'FULL_ONLY';

                return (
                  <TableRow key={crs.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#64748B', fontSize: '0.82rem' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                        {crs.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        {crs.level} • {crs.durationValue} {crs.durationUnit} ({crs.totalHours} hrs)
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      NPR {feeCalc.basePrice.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      {feeCalc.discountPercent > 0 ? (
                        <Chip label={`${feeCalc.discountPercent}%`} size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 900, fontSize: '0.7rem' }} />
                      ) : (
                        <span style={{ color: '#94A3B8' }}>-</span>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0F2E5A' }}>
                      NPR {feeCalc.netTuition.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      NPR {feeCalc.admissionFee.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#0369A1' }}>
                      NPR {feeCalc.subtotal.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#D97706' }}>
                      NPR {feeCalc.vatAmount.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: '#059669', fontSize: '0.92rem' }}>
                      NPR {feeCalc.totalEffectiveFee.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={isFullOnly ? 'Full Upfront' : '2 Installments'}
                        size="small"
                        sx={{
                          bgcolor: isFullOnly ? '#FEF3C7' : '#D1FAE5',
                          color: isFullOnly ? '#92400E' : '#065F46',
                          fontWeight: 800,
                          fontSize: '0.68rem'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Edit Fee">
                          <IconButton size="small" onClick={() => handleOpenEdit(crs)} sx={{ color: '#0F2E5A' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Revision History">
                          <IconButton size="small" onClick={() => handleOpenHistory(crs)} sx={{ color: '#64748B' }}>
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL: EDIT / REVISE COURSE FEE STRUCTURE                    */}
      {/* ============================================================== */}
      <Dialog
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          component: 'form',
          onSubmit: handleSaveFeeStructure,
          sx: { maxHeight: '90vh', display: 'flex', flexDirection: 'column' }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)',
            color: '#FFFFFF',
            fontWeight: 900,
            py: 2,
            px: 3,
            borderBottom: '3px solid #F59E0B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <span>Edit Fee Structure — {selectedCourse?.title}</span>
          <IconButton onClick={() => setOpenEditModal(false)} sx={{ color: '#FFFFFF' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, overflowY: 'auto' }}>
            <Grid container spacing={3} sx={{ mt: 0.2 }}>
              {/* Left Column: Form Inputs */}
              <Grid item xs={12} md={6}>
                <Stack spacing={2.2}>
                  {/* Course Type / Payment Mode Selector */}
                  <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.8 }}>
                      Payment & Installment Policy:
                    </Typography>
                    <ToggleButtonGroup
                      value={formData.paymentMode}
                      exclusive
                      onChange={(e, next) => next && setFormData({ ...formData, paymentMode: next })}
                      size="small"
                      fullWidth
                    >
                      <ToggleButton value="TWO_INSTALLMENTS" sx={{ fontSize: '0.72rem', fontWeight: 800 }}>
                        📅 2 Installments (50% + 50%)
                      </ToggleButton>
                      <ToggleButton value="FULL_ONLY" sx={{ fontSize: '0.72rem', fontWeight: 800 }}>
                        ⚡ Full Upfront (Basic Course)
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* Base Price */}
                  <TextField
                    label="1. Base / Brochure Price"
                    type="number"
                    fullWidth
                    size="small"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) || 0 })}
                    helperText={formData.paymentMode === 'FULL_ONLY' ? 'Enter 0 if tuition is waived for basic course.' : 'Original brochure tuition fee (e.g. 30,000)'}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">NPR</InputAdornment>
                    }}
                  />

                  {/* Campaign Discount % */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                        2. Campaign Discount %:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: '#DC2626' }}>
                        {formData.discountPercent}% Discount (NPR {livePreview.discountAmount.toLocaleString()})
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Slider
                        value={formData.discountPercent}
                        min={0}
                        max={100}
                        step={5}
                        onChange={(e, val) => setFormData({ ...formData, discountPercent: val })}
                        sx={{ color: '#DC2626' }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        value={formData.discountPercent}
                        onChange={(e) => setFormData({ ...formData, discountPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                        sx={{ width: 80, '& input': { textAlign: 'center', py: 0.5 } }}
                        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                      />
                    </Stack>
                  </Box>

                  {/* Admission Charge */}
                  <TextField
                    label="3. Admission & Registration Fee"
                    type="number"
                    fullWidth
                    size="small"
                    value={formData.admissionFee}
                    onChange={(e) => setFormData({ ...formData, admissionFee: Number(e.target.value) || 0 })}
                    helperText="Fixed one-time admission charge (e.g. 1500 or 1700)"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">NPR</InputAdornment>
                    }}
                  />

                  {/* VAT % (Default 13%) */}
                  <TextField
                    label="4. Value Added Tax (VAT %)"
                    type="number"
                    fullWidth
                    size="small"
                    value={formData.vatPercent}
                    onChange={(e) => setFormData({ ...formData, vatPercent: Number(e.target.value) || 0 })}
                    helperText="Mandatory 13% VAT as per government tax regulation"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                  />

                  {/* Revision Reason & Effective Date */}
                  <TextField
                    label="5. Revision Reason *"
                    fullWidth
                    size="small"
                    required
                    placeholder="e.g. New 50% discount campaign or fee adjustment"
                    value={formData.revisionReason}
                    onChange={(e) => setFormData({ ...formData, revisionReason: e.target.value })}
                  />

                  <TextField
                    label="Effective Date"
                    type="date"
                    fullWidth
                    size="small"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </Grid>

              {/* Right Column: Live Real-time Calculation Card */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2.5,
                    bgcolor: '#F0FDF4',
                    borderRadius: 2.5,
                    border: '2px solid #059669',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <ReceiptLongIcon sx={{ color: '#059669' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#065F46' }}>
                        Live Fee Simulation
                      </Typography>
                    </Box>

                    <Stack spacing={1.2} sx={{ fontSize: '0.85rem' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>1. Brochure Price:</span>
                        <b>NPR {livePreview.basePrice.toLocaleString()}</b>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                        <span>2. Discount ({livePreview.discountPercent}%):</span>
                        <b>(-) NPR {livePreview.discountAmount.toLocaleString()}</b>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#0F2E5A', fontWeight: 700 }}>
                        <span>3. Net Tuition:</span>
                        <span>NPR {livePreview.netTuition.toLocaleString()}</span>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>4. Admission Fee:</span>
                        <b>(+) NPR {livePreview.admissionFee.toLocaleString()}</b>
                      </Box>

                      <Divider sx={{ my: 0.5 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#0369A1', fontWeight: 800 }}>
                        <span>Subtotal (Taxable):</span>
                        <span>NPR {livePreview.subtotal.toLocaleString()}</span>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', fontWeight: 800 }}>
                        <span>13% VAT (VAT {livePreview.vatPercent}%):</span>
                        <span>(+) NPR {livePreview.vatAmount.toLocaleString()}</span>
                      </Box>

                      <Divider sx={{ my: 0.5, borderColor: '#059669' }} />

                      {/* Final Payable */}
                      <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 2, border: '1.5px solid #059669', textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#047857', display: 'block' }}>
                          Grand Total Payable by Student:
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#065F46', my: 0.5 }}>
                          NPR {livePreview.totalEffectiveFee.toLocaleString()}
                        </Typography>
                      </Box>

                      {/* Installment Breakdown */}
                      <Box sx={{ p: 1.2, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2E5A', display: 'block', mb: 0.5 }}>
                          Installment Schedule:
                        </Typography>
                        {livePreview.paymentMode === 'FULL_ONLY' ? (
                          <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 800 }}>
                            ⚡ Full Upfront: Entire NPR {livePreview.totalEffectiveFee.toLocaleString()} payable at admission.
                          </Typography>
                        ) : (
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Box sx={{ p: 0.8, bgcolor: '#F8FAFC', borderRadius: 1.5, textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>1. At Admission (50%)</Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                                  NPR {livePreview.installment1.toLocaleString()}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 0.8, bgcolor: '#F8FAFC', borderRadius: 1.5, textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>2. In 1 Month (50%)</Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                                  NPR {livePreview.installment2.toLocaleString()}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        )}
                      </Box>
                    </Stack>
                  </Box>

                  <Alert severity="info" sx={{ mt: 2, fontSize: '0.72rem', py: 0.5 }}>
                    💡 Once saved, this rate applies automatically to new admissions.
                  </Alert>
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
            <Button onClick={() => setOpenEditModal(false)} color="inherit" sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                fontWeight: 900,
                px: 3
              }}
            >
              Save New Fee Rate
            </Button>
          </DialogActions>
      </Dialog>

      {/* ============================================================== */}
      {/* 5.1 MODAL: CONFIGURE COURSE FEE STRUCTURE (DROPDOWN SELECTION)  */}
      {/* ============================================================== */}
      <Dialog
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          component: 'form',
          onSubmit: handleSaveCourseFee,
          sx: { maxHeight: '90vh', display: 'flex', flexDirection: 'column' }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#FFFFFF',
            fontWeight: 900,
            py: 2,
            px: 3,
            borderBottom: '3px solid #F59E0B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddCircleOutlineIcon sx={{ color: '#FCD34D' }} />
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#FFFFFF', fontSize: '1.05rem' }}>
              Course Fee Setup
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenAddModal(false)} sx={{ color: '#FFFFFF' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, overflowY: 'auto' }}>
            <Grid container spacing={3} sx={{ mt: 0.2 }}>
              {/* Left Column: Course Dropdown & Fee Details */}
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  {/* 1. Course Selection Dropdown from Course Section */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A', mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <SchoolIcon fontSize="small" sx={{ color: '#059669' }} />
                      1. Course Selection (From Course Catalog):
                    </Typography>

                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Choose Course *"
                      value={newCourseFeeData.courseId}
                      onChange={(e) => handleCourseSelect(e.target.value)}
                      helperText="Select from active registered courses to configure fees"
                      SelectProps={{
                        MenuProps: { PaperProps: { sx: { maxHeight: 320 } } }
                      }}
                    >
                      {(db.courses || []).map((crs) => (
                        <MenuItem key={crs.id} value={crs.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700 }}>{crs.title}</span>
                            <Chip
                              label={`${crs.level || 'Level 1'} • ${crs.durationValue} ${crs.durationUnit}`}
                              size="small"
                              sx={{ ml: 1, fontSize: '0.65rem', height: 20, bgcolor: '#F1F5F9' }}
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  {/* Course Details Read-only Card (auto-loaded from Course Section) */}
                  {selectedCourseInfo && (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        bgcolor: '#F0F9FF',
                        borderColor: '#BAE6FD',
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.8 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0369A1' }}>
                          📌 {selectedCourseInfo.title}
                        </Typography>
                        <Chip
                          label={selectedCourseInfo.level || 'Level 1'}
                          size="small"
                          sx={{ bgcolor: '#0284C7', color: '#FFFFFF', fontWeight: 800, fontSize: '0.68rem', height: 20 }}
                        />
                      </Box>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Trade / Sector:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                            {getOccupationName(selectedCourseInfo.occupationId)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Duration / Total Hours:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                            {selectedCourseInfo.durationValue} {selectedCourseInfo.durationUnit} ({selectedCourseInfo.totalHours || 390} Hours)
                          </Typography>
                        </Grid>
                      </Grid>
                      {selectedCourseInfo.description && (
                        <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.8, fontStyle: 'italic', borderTop: '1px dashed #CBD5E1', pt: 0.5 }}>
                          {selectedCourseInfo.description}
                        </Typography>
                      )}
                    </Paper>
                  )}

                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A', borderBottom: '2px solid #E2E8F0', pb: 0.5, mt: 1 }}>
                    2. Fee Structure & Policy Setup
                  </Typography>

                  {/* Payment Mode Selector */}
                  <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.8 }}>
                      Payment Policy:
                    </Typography>
                    <ToggleButtonGroup
                      value={newCourseFeeData.paymentMode}
                      exclusive
                      onChange={(e, next) => next && setNewCourseFeeData({ ...newCourseFeeData, paymentMode: next })}
                      size="small"
                      fullWidth
                    >
                      <ToggleButton value="TWO_INSTALLMENTS" sx={{ fontSize: '0.72rem', fontWeight: 800 }}>
                        📅 2 Installments (50% + 50%)
                      </ToggleButton>
                      <ToggleButton value="FULL_ONLY" sx={{ fontSize: '0.72rem', fontWeight: 800 }}>
                        ⚡ Full Upfront (Basic)
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* Base Price */}
                  <TextField
                    label="Base / Brochure Price"
                    type="number"
                    fullWidth
                    size="small"
                    value={newCourseFeeData.basePrice}
                    onChange={(e) => setNewCourseFeeData({ ...newCourseFeeData, basePrice: Number(e.target.value) || 0 })}
                    helperText={newCourseFeeData.paymentMode === 'FULL_ONLY' ? 'Enter 0 if tuition is waived for basic course.' : 'Brochure price (e.g. 30,000)'}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">NPR</InputAdornment>
                    }}
                  />

                  {/* Campaign Discount % */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                        Campaign Discount (%):
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: '#DC2626' }}>
                        {newCourseFeeData.discountPercent}% Discount (NPR {newCourseLivePreview.discountAmount.toLocaleString()})
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Slider
                        value={newCourseFeeData.discountPercent}
                        min={0}
                        max={100}
                        step={5}
                        onChange={(e, val) => setNewCourseFeeData({ ...newCourseFeeData, discountPercent: val })}
                        sx={{ color: '#DC2626' }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        value={newCourseFeeData.discountPercent}
                        onChange={(e) => setNewCourseFeeData({ ...newCourseFeeData, discountPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                        sx={{ width: 80, '& input': { textAlign: 'center', py: 0.5 } }}
                        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                      />
                    </Stack>
                  </Box>

                  {/* Admission Charge */}
                  <TextField
                    label="Admission & Registration Fee"
                    type="number"
                    fullWidth
                    size="small"
                    value={newCourseFeeData.admissionFee}
                    onChange={(e) => setNewCourseFeeData({ ...newCourseFeeData, admissionFee: Number(e.target.value) || 0 })}
                    helperText="One-time admission charge (e.g. 1500 or 1700)"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">NPR</InputAdornment>
                    }}
                  />

                  {/* VAT % */}
                  <TextField
                    label="Value Added Tax (VAT %)"
                    type="number"
                    fullWidth
                    size="small"
                    value={newCourseFeeData.vatPercent}
                    onChange={(e) => setNewCourseFeeData({ ...newCourseFeeData, vatPercent: Number(e.target.value) || 0 })}
                    helperText="Mandatory 13% VAT as per government tax regulation"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                  />

                  {/* Reason / Offer Note */}
                  <TextField
                    label="Offer Remarks / Revision Note"
                    fullWidth
                    size="small"
                    placeholder="e.g. Special 70% campaign discount or revision"
                    value={newCourseFeeData.revisionReason}
                    onChange={(e) => setNewCourseFeeData({ ...newCourseFeeData, revisionReason: e.target.value })}
                  />

                  {/* Effective Date */}
                  <TextField
                    label="Effective Date"
                    type="date"
                    fullWidth
                    size="small"
                    value={newCourseFeeData.effectiveDate}
                    onChange={(e) => setNewCourseFeeData({ ...newCourseFeeData, effectiveDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </Grid>

              {/* Right Column: Live Real-time Calculation Summary Card */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2.5,
                    bgcolor: '#F0FDF4',
                    borderRadius: 2.5,
                    border: '2px solid #059669',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <ReceiptLongIcon sx={{ color: '#059669' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                        Fee Calculation Summary
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Stack spacing={1.2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Base Brochure Price:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          NPR {newCourseLivePreview.basePrice.toLocaleString()}
                        </Typography>
                      </Box>

                      {newCourseLivePreview.discountPercent > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                          <Typography variant="body2">
                            Campaign Discount ({newCourseLivePreview.discountPercent}%):
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            (-) NPR {newCourseLivePreview.discountAmount.toLocaleString()}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#0F2E5A' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Net Tuition Fee:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          NPR {newCourseLivePreview.netTuition.toLocaleString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Admission & Reg. Fee:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          (+) NPR {newCourseLivePreview.admissionFee.toLocaleString()}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 0.5 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#0369A1' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Subtotal (Taxable):</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                          NPR {newCourseLivePreview.subtotal.toLocaleString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#D97706' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>13% VAT:</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                          (+) NPR {newCourseLivePreview.vatAmount.toLocaleString()}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: 1.5,
                          mt: 1,
                          bgcolor: '#FFFFFF',
                          borderRadius: 2,
                          border: '2px solid #059669',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669', display: 'block' }}>
                            Total Net Payable by Student
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            (Includes 13% VAT and Admission Fee)
                          </Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#059669' }}>
                          NPR {newCourseLivePreview.totalEffectiveFee.toLocaleString()}
                        </Typography>
                      </Box>

                      {/* Payment Schedule Breakdown */}
                      <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2E5A', display: 'block', mb: 0.8 }}>
                          📌 Installment Schedule:
                        </Typography>
                        {newCourseFeeData.paymentMode === 'FULL_ONLY' ? (
                          <Box sx={{ p: 1, bgcolor: '#FEF3C7', borderRadius: 1.5, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400E' }}>
                              ⚡ Full Upfront: NPR {newCourseLivePreview.totalEffectiveFee.toLocaleString()} payable at admission (100%)
                            </Typography>
                          </Box>
                        ) : (
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Box sx={{ p: 0.8, bgcolor: '#F8FAFC', borderRadius: 1.5, textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>1. At Admission (50%)</Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                                  NPR {newCourseLivePreview.installment1.toLocaleString()}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 0.8, bgcolor: '#F8FAFC', borderRadius: 1.5, textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>2. In 1 Month (50%)</Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                                  NPR {newCourseLivePreview.installment2.toLocaleString()}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        )}
                      </Box>
                    </Stack>
                  </Box>

                  <Alert severity="success" sx={{ mt: 2, fontSize: '0.72rem', py: 0.5 }}>
                    ✓ Once saved, this fee policy applies automatically to upcoming enrollments.
                  </Alert>
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
            <Button onClick={() => setOpenAddModal(false)} color="inherit" sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                fontWeight: 900,
                px: 3
              }}
            >
              Save Fee Setup
            </Button>
          </DialogActions>
      </Dialog>

      {/* ============================================================== */}
      {/* 6. MODAL: REVISION & AUDIT HISTORY LOG                          */}
      {/* ============================================================== */}
      <Dialog open={openHistoryModal} onClose={() => setOpenHistoryModal(false)} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)',
            color: '#FFFFFF',
            fontWeight: 900,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>Revision Audit Log — {selectedCourse?.title}</span>
          <IconButton onClick={() => setOpenHistoryModal(false)} sx={{ color: '#FFFFFF' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Effective Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Revision Reason</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Base Fee</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Discount (%)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Admission Fee</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Total Effective (Inc. VAT)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Changed By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(selectedCourse?.feeStructure?.revisionHistory || []).map((rev) => (
                  <TableRow key={rev.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{rev.date}</TableCell>
                    <TableCell>{rev.reason}</TableCell>
                    <TableCell align="right">NPR {(rev.basePrice || 0).toLocaleString()}</TableCell>
                    <TableCell align="center">
                      <Chip label={`${rev.discountPercent}%`} size="small" sx={{ fontSize: '0.68rem', fontWeight: 800 }} />
                    </TableCell>
                    <TableCell align="right">NPR {(rev.admissionFee || 0).toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: '#059669' }}>
                      NPR {(rev.totalEffectiveFee || 0).toLocaleString()}
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.74rem', color: '#64748B' }}>
                      {rev.changedBy || 'Admin'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC' }}>
          <Button onClick={() => setOpenHistoryModal(false)} variant="contained" sx={{ bgcolor: '#0F2E5A' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================== */}
      {/* 7. MODAL: OFFICIAL FEE STRUCTURE SHEET PRINT (A4)               */}
      {/* ============================================================== */}
      <Dialog open={openPrintModal} onClose={() => setOpenPrintModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Official Fee Sheet & Installment Schedule</span>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" size="small" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ bgcolor: '#0F2E5A' }}>
              Print Sheet
            </Button>
            <IconButton onClick={() => setOpenPrintModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box
            id="printableFeeStructureSheet"
            sx={{
              p: 4,
              bgcolor: '#FFFFFF',
              border: '2px solid #0F2E5A',
              fontFamily: "'Times New Roman', serif",
              color: '#0F172A'
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '2px double #0F2E5A', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F2E5A', letterSpacing: '0.04em' }}>
                GLOBAL ERA TECHNICAL SCHOOL
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#475569' }}>
                CTEVT Accredited Training Center • MitraPark, Chabahil, Kathmandu
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#F59E0B', mt: 1 }}>
                Official Training Course Fee Schedule & Installment Breakdown (Inc. 13% VAT)
              </Typography>
            </Box>

            {/* Table */}
            <Table size="small" sx={{ mb: 3 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                  <TableCell sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>Course Title</TableCell>
                  <TableCell sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>Duration</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>Base Fee</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>Discount</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>Admission Fee</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>13% VAT</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>Total Fee</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>Installment Plan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coursesWithFees.map((crs) => (
                  <TableRow key={crs.id}>
                    <TableCell sx={{ border: '1px solid #CBD5E1', fontWeight: 800 }}>{crs.title}</TableCell>
                    <TableCell sx={{ border: '1px solid #CBD5E1' }}>{crs.totalHours} Hours</TableCell>
                    <TableCell align="right" sx={{ border: '1px solid #CBD5E1' }}>NPR {crs.feeCalc.basePrice.toLocaleString()}</TableCell>
                    <TableCell align="center" sx={{ border: '1px solid #CBD5E1' }}>{crs.feeCalc.discountPercent}%</TableCell>
                    <TableCell align="right" sx={{ border: '1px solid #CBD5E1' }}>NPR {crs.feeCalc.admissionFee.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ border: '1px solid #CBD5E1' }}>NPR {crs.feeCalc.vatAmount.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ border: '1px solid #CBD5E1', fontWeight: 900 }}>NPR {crs.feeCalc.totalEffectiveFee.toLocaleString()}</TableCell>
                    <TableCell align="center" sx={{ border: '1px solid #CBD5E1', fontSize: '0.72rem' }}>
                      {crs.feeStructure?.paymentMode === 'FULL_ONLY'
                        ? 'Full Upfront'
                        : `NPR ${crs.feeCalc.installment1.toLocaleString()} + NPR ${crs.feeCalc.installment2.toLocaleString()}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Note & Signature */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 3 }}>
              <Box sx={{ maxWidth: '60%' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#64748B' }}>
                  * Note: All fees include 13% Value Added Tax (VAT) as per Nepal Government tax regulations.
                  Admission fee is non-refundable. The 2nd installment is payable within 30 days of training start.
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', minWidth: 150 }}>
                <Box sx={{ height: 35, borderBottom: '1.5px solid #0F2E5A', mb: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                  Authorized Signatory
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Managing Director / Head of Accounts
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
