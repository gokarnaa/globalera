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
    revisionReason: 'प्रारम्भिक आधिकारिक शुल्क दर',
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
    revisionReason: 'अभियान तथा शुल्क परिमार्जन',
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
          revisionReason: isBasic ? 'बेसिक कोर्स भर्ना दर' : 'विशेष ७०% अभियान अफर',
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
              reason: 'प्रारम्भिक आधिकारिक शुल्क दर'
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
    return occ ? occ.name : 'सामान्य प्राविधिक सीप';
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
      revisionReason: fs.revisionReason || 'कोर्स शुल्क संरचना निर्धारण',
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
        revisionReason: 'प्रारम्भिक आधिकारिक शुल्क दर',
        effectiveDate: new Date().toISOString().split('T')[0]
      });
    }
    setOpenAddModal(true);
  };

  // Save Course Fee Configuration
  const handleSaveCourseFee = (e) => {
    e.preventDefault();
    if (!newCourseFeeData.courseId) {
      alert('कृपया पहिले कोर्स सेक्सनबाट कोर्स छनोट गर्नुहोस्।');
      return;
    }

    const targetCourse = (db.courses || []).find((c) => c.id === newCourseFeeData.courseId);
    if (!targetCourse) {
      alert('छनोट गरिएको कोर्स फेला परेन।');
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
      reason: newCourseFeeData.revisionReason || 'कोर्स शुल्क संरचना दर्ता/परिमार्जन'
    };

    const newFeeStructure = {
      basePrice: Number(newCourseFeeData.basePrice) || 0,
      discountPercent: Number(newCourseFeeData.discountPercent) || 0,
      admissionFee: Number(newCourseFeeData.admissionFee) || 0,
      vatPercent: Number(newCourseFeeData.vatPercent) || 13,
      paymentMode: newCourseFeeData.paymentMode,
      fullPayDiscount: Number(newCourseFeeData.fullPayDiscount) || 0,
      effectiveDate: newCourseFeeData.effectiveDate,
      revisionReason: newCourseFeeData.revisionReason || 'कोर्स शुल्क संरचना दर्ता/परिमार्जन',
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
      reason: formData.revisionReason || 'शुल्क परिमार्जन'
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
      'क्र.सं.': idx + 1,
      'कोर्स नाम': crs.title,
      'तह (Level)': crs.level,
      'अवधि (घण्टा)': `${crs.durationValue} ${crs.durationUnit} (${crs.totalHours} घण्टा)`,
      'मूल ब्रोसर शुल्क': crs.feeCalc.basePrice,
      'छुट प्रतिशत': `${crs.feeCalc.discountPercent}%`,
      'छुट रकम': crs.feeCalc.discountAmount,
      'खुद तालिम शुल्क': crs.feeCalc.netTuition,
      'भर्ना शुल्क': crs.feeCalc.admissionFee,
      'करयोग्य रकम': crs.feeCalc.subtotal,
      '१३% भ्याट रकम': crs.feeCalc.vatAmount,
      'कुल प्रभावकारी शुल्क': crs.feeCalc.totalEffectiveFee,
      'भुक्तानी मोडल': crs.feeStructure?.paymentMode === 'FULL_ONLY' ? 'एकमुष्ट मात्र (Full Upfront)' : '२ किस्ता (५०% + ५०%)',
      'पहिलो किस्ता': crs.feeCalc.installment1,
      'दोस्रो किस्ता (१ महिनापछि)': crs.feeCalc.installment2
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
              कोर्स शुल्क संरचना तथा दर व्यवस्थापन (Course Fee Master)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              ब्रोसर शुल्क, अभियान छुट, भर्ना शुल्क, अनिवार्य १३% भ्याट (VAT) तथा किस्ताबन्दी नीति व्यवस्थापन
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
          {/* Option requested by user: Short button "+ कोर्स शुल्क" */}
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
            + कोर्स शुल्क
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            onClick={() => setOpenPrintModal(true)}
            sx={{ fontWeight: 800, borderColor: '#0F2E5A', color: '#0F2E5A' }}
          >
            शुल्क पत्र प्रिन्ट
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
          ✓ कोर्सको नयाँ शुल्क दर, भ्याट र किस्ताबन्दी नीति सफलतापूर्वक सुरक्षित गरियो! नयाँ भर्नामा यो दर स्वतः लागू हुनेछ।
        </Alert>
      )}

      {/* 2. Metrics Cards */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1} sx={{ borderRadius: 2.5, borderLeft: '4px solid #0F2E5A' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>कुल सक्रिय कोर्सहरू</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F2E5A', my: 0.5 }}>{stats.total}</Typography>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>CTEVT मान्यता प्राप्त पाठ्यक्रम</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1} sx={{ borderRadius: 2.5, borderLeft: '4px solid #059669' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>औसत प्रभावकारी शुल्क (१३% भ्याट सहित)</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#059669', my: 0.5 }}>रु. {stats.avgFee.toLocaleString()}</Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>विद्यार्थीले तिर्ने खुद रकम</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1} sx={{ borderRadius: 2.5, borderLeft: '4px solid #0284C7' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>२ किस्ता सुविधा भएका कोर्स</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0284C7', my: 0.5 }}>{stats.installmentCount}</Typography>
              <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 700 }}>५०% भर्नामा + ५०% १ महिनामा</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1} sx={{ borderRadius: 2.5, borderLeft: '4px solid #F59E0B' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>बेसिक / एकमुष्ट मात्र कोर्स</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#D97706', my: 0.5 }}>{stats.fullOnlyCount}</Typography>
              <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 700 }}>भर्नामै १००% भुक्तानी (किस्ता नहुने)</Typography>
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
            placeholder="कोर्स नाम वा कोडबाट खोज्नुहोस्..."
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
              मोडल फिल्टर:
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={modeFilter}
              exclusive
              onChange={(e, val) => val && setModeFilter(val)}
              sx={{ bgcolor: '#F8FAFC' }}
            >
              <ToggleButton value="ALL" sx={{ fontSize: '0.72rem', fontWeight: 800, px: 1.5 }}>सबै</ToggleButton>
              <ToggleButton value="TWO_INSTALLMENTS" sx={{ fontSize: '0.72rem', fontWeight: 800, px: 1.5 }}>२ किस्ता</ToggleButton>
              <ToggleButton value="FULL_ONLY" sx={{ fontSize: '0.72rem', fontWeight: 800, px: 1.5 }}>एकमुष्ट मात्र</ToggleButton>
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
                          {crs.level} • {crs.durationValue} {crs.durationUnit} ({crs.totalHours} घण्टा)
                        </Typography>
                      </Box>
                      <Chip
                        label={isFullOnly ? '⚡ एकमुष्ट मात्र' : '📅 २ किस्ता'}
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
                        कुल अन्तिम शुल्क (१३% भ्याट सहित):
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#065F46', my: 0.3 }}>
                        रु. {feeCalc.totalEffectiveFee.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#047857', fontSize: '0.72rem' }}>
                        {isFullOnly
                          ? 'भर्ना गर्दा नै १००% एकमुष्ट भुक्तानी'
                          : `५०% भर्नामा (रु. ${feeCalc.installment1.toLocaleString()}) + ५०% १ महिनामा (रु. ${feeCalc.installment2.toLocaleString()})`}
                      </Typography>
                    </Box>

                    {/* Breakdown Details Table */}
                    <Stack spacing={0.8} sx={{ fontSize: '0.8rem' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>१. मूल ब्रोसर शुल्क (Base Price):</span>
                        <b style={{ color: '#1E293B' }}>रु. {feeCalc.basePrice.toLocaleString()}</b>
                      </Box>

                      {feeCalc.discountPercent > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                          <span>२. अभियान छुट ({feeCalc.discountPercent}%):</span>
                          <b>(-) रु. {feeCalc.discountAmount.toLocaleString()}</b>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>३. खुद तालिम शुल्क:</span>
                        <b style={{ color: '#0F2E5A' }}>रु. {feeCalc.netTuition.toLocaleString()}</b>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>४. भर्ना तथा दर्ता शुल्क:</span>
                        <b style={{ color: '#1E293B' }}>रु. {feeCalc.admissionFee.toLocaleString()}</b>
                      </Box>

                      <Divider sx={{ my: 0.3 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#0369A1', fontWeight: 700 }}>
                        <span>करयोग्य रकम (Subtotal):</span>
                        <span>रु. {feeCalc.subtotal.toLocaleString()}</span>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', fontWeight: 700 }}>
                        <span>१३% भ्याट (VAT 13%):</span>
                        <span>(+) रु. {feeCalc.vatAmount.toLocaleString()}</span>
                      </Box>
                    </Stack>

                    {/* Revision Reason Tag */}
                    {fs?.revisionReason && (
                      <Box sx={{ mt: 1.5, p: 0.8, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px dashed #CBD5E1' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem' }}>
                          📌 <b>हालको अफर/कारण:</b> {fs.revisionReason} (लागू: {fs.effectiveDate || 'हाल'})
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
                      शुल्क सम्पादन (Edit)
                    </Button>

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<HistoryIcon />}
                      onClick={() => handleOpenHistory(crs)}
                      sx={{ fontWeight: 800, fontSize: '0.74rem', minWidth: 90 }}
                    >
                      इतिहास
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
                <TableCell align="center" sx={{ width: 65, fontWeight: 900, color: '#FFFFFF !important' }}># क्र.सं.</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>कोर्स विवरण</TableCell>
                <TableCell align="right" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>मूल शुल्क</TableCell>
                <TableCell align="center" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>छुट (%)</TableCell>
                <TableCell align="right" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>खुद तालिम</TableCell>
                <TableCell align="right" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>भर्ना शुल्क</TableCell>
                <TableCell align="right" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>करयोग्य रकम</TableCell>
                <TableCell align="right" sx={{ color: '#FCD34D !important', fontWeight: 900 }}>१३% भ्याट</TableCell>
                <TableCell align="right" sx={{ color: '#34D399 !important', fontWeight: 900 }}>अन्तिम खुद शुल्क</TableCell>
                <TableCell align="center" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>भुक्तानी मोडल</TableCell>
                <TableCell align="center" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>कार्य</TableCell>
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
                      रु. {feeCalc.basePrice.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      {feeCalc.discountPercent > 0 ? (
                        <Chip label={`${feeCalc.discountPercent}%`} size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 900, fontSize: '0.7rem' }} />
                      ) : (
                        <span style={{ color: '#94A3B8' }}>-</span>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0F2E5A' }}>
                      रु. {feeCalc.netTuition.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      रु. {feeCalc.admissionFee.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#0369A1' }}>
                      रु. {feeCalc.subtotal.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#D97706' }}>
                      रु. {feeCalc.vatAmount.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: '#059669', fontSize: '0.92rem' }}>
                      रु. {feeCalc.totalEffectiveFee.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={isFullOnly ? 'एकमुष्ट मात्र' : '२ किस्ता (५०/५०)'}
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
                        <Tooltip title="शुल्क सम्पादन">
                          <IconButton size="small" onClick={() => handleOpenEdit(crs)} sx={{ color: '#0F2E5A' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="परिवर्तन इतिहास">
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
          <span>कोर्स शुल्क दर सम्पादन (Edit Fee Structure) — {selectedCourse?.title}</span>
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
                      भुक्तानी तथा किस्ताबन्दी मोडल (Payment Policy):
                    </Typography>
                    <ToggleButtonGroup
                      value={formData.paymentMode}
                      exclusive
                      onChange={(e, next) => next && setFormData({ ...formData, paymentMode: next })}
                      size="small"
                      fullWidth
                    >
                      <ToggleButton value="TWO_INSTALLMENTS" sx={{ fontSize: '0.72rem', fontWeight: 800 }}>
                        📅 २ किस्ता (५०% + ५०%)
                      </ToggleButton>
                      <ToggleButton value="FULL_ONLY" sx={{ fontSize: '0.72rem', fontWeight: 800 }}>
                        ⚡ एकमुष्ट मात्र (बेसिक कोर्स)
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* Base Price */}
                  <TextField
                    label="१. मूल कोर्स शुल्क (Base / Brochure Price)"
                    type="number"
                    fullWidth
                    size="small"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) || 0 })}
                    helperText={formData.paymentMode === 'FULL_ONLY' ? 'बेसिक कोर्समा तालिम शुल्क नलागे ० राख्न सक्नुहुन्छ।' : 'ब्रोसरमा छापिएको मूल शुल्क (उदा: ३०,०००)'}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">रु.</InputAdornment>
                    }}
                  />

                  {/* Campaign Discount % */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                        २. अभियान छुट प्रतिशत (Campaign Discount %):
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: '#DC2626' }}>
                        {formData.discountPercent}% छुट (रु. {livePreview.discountAmount.toLocaleString()})
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
                    label="३. भर्ना तथा दर्ता शुल्क (Admission Fee)"
                    type="number"
                    fullWidth
                    size="small"
                    value={formData.admissionFee}
                    onChange={(e) => setFormData({ ...formData, admissionFee: Number(e.target.value) || 0 })}
                    helperText="भर्ना हुँदा लाग्ने फिक्स शुल्क (जस्तै: १५०० वा बेसिकमा १७००)"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">रु.</InputAdornment>
                    }}
                  />

                  {/* VAT % (Default 13%) */}
                  <TextField
                    label="४. मूल्य अभिवृद्धि कर (VAT %)"
                    type="number"
                    fullWidth
                    size="small"
                    value={formData.vatPercent}
                    onChange={(e) => setFormData({ ...formData, vatPercent: Number(e.target.value) || 0 })}
                    helperText="नेपाल सरकारको नियम अनुसार अनिवार्य १३% भ्याट"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                  />

                  {/* Revision Reason & Effective Date */}
                  <TextField
                    label="५. परिमार्जनको कारण (Revision Reason) *"
                    fullWidth
                    size="small"
                    required
                    placeholder="जस्तै: ५०% नयाँ छुट अफर वा शुल्क हेरफेर"
                    value={formData.revisionReason}
                    onChange={(e) => setFormData({ ...formData, revisionReason: e.target.value })}
                  />

                  <TextField
                    label="लागू हुने मिति (Effective Date)"
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
                        प्रत्यक्ष हिसाब नतिजा (Live Fee Simulation)
                      </Typography>
                    </Box>

                    <Stack spacing={1.2} sx={{ fontSize: '0.85rem' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>१. मूल ब्रोसर शुल्क:</span>
                        <b>रु. {livePreview.basePrice.toLocaleString()}</b>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                        <span>२. छुट ({livePreview.discountPercent}%):</span>
                        <b>(-) रु. {livePreview.discountAmount.toLocaleString()}</b>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#0F2E5A', fontWeight: 700 }}>
                        <span>३. खुद तालिम शुल्क:</span>
                        <span>रु. {livePreview.netTuition.toLocaleString()}</span>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>४. भर्ना शुल्क:</span>
                        <b>(+) रु. {livePreview.admissionFee.toLocaleString()}</b>
                      </Box>

                      <Divider sx={{ my: 0.5 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#0369A1', fontWeight: 800 }}>
                        <span>करयोग्य रकम (Subtotal):</span>
                        <span>रु. {livePreview.subtotal.toLocaleString()}</span>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', fontWeight: 800 }}>
                        <span>१३% भ्याट (VAT {livePreview.vatPercent}%):</span>
                        <span>(+) रु. {livePreview.vatAmount.toLocaleString()}</span>
                      </Box>

                      <Divider sx={{ my: 0.5, borderColor: '#059669' }} />

                      {/* Final Payable */}
                      <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 2, border: '1.5px solid #059669', textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#047857', display: 'block' }}>
                          विद्यार्थीले तिर्ने कुल अन्तिम शुल्क (Grand Total):
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#065F46', my: 0.5 }}>
                          रु. {livePreview.totalEffectiveFee.toLocaleString()}
                        </Typography>
                      </Box>

                      {/* Installment Breakdown */}
                      <Box sx={{ p: 1.2, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2E5A', display: 'block', mb: 0.5 }}>
                          किस्ताबन्दी तालिका (Installment Plan):
                        </Typography>
                        {livePreview.paymentMode === 'FULL_ONLY' ? (
                          <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 800 }}>
                            ⚡ एकमुष्ट भुक्तानी मात्र: भर्ना गर्दा नै रु. {livePreview.totalEffectiveFee.toLocaleString()} एकैपटक बुझाउनुपर्नेछ।
                          </Typography>
                        ) : (
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Box sx={{ p: 0.8, bgcolor: '#F8FAFC', borderRadius: 1.5, textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>१. भर्नामा (५०%)</Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                                  रु. {livePreview.installment1.toLocaleString()}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 0.8, bgcolor: '#F8FAFC', borderRadius: 1.5, textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>२. १ महिनापछि (५०%)</Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                                  रु. {livePreview.installment2.toLocaleString()}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        )}
                      </Box>
                    </Stack>
                  </Box>

                  <Alert severity="info" sx={{ mt: 2, fontSize: '0.72rem', py: 0.5 }}>
                    💡 सुरक्षित गरेपछि नयाँ भर्ना हुने विद्यार्थीहरूलाई यो दर स्वतः लागू हुनेछ।
                  </Alert>
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
            <Button onClick={() => setOpenEditModal(false)} color="inherit" sx={{ fontWeight: 700 }}>
              रद्द गर्नुहोस्
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
              नयाँ शुल्क दर सुरक्षित गर्नुहोस् (Save Rate)
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
              कोर्स शुल्क संरचना निर्धारण (Course Fee Setup)
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
                      १. कोर्स छनोट (कोर्स सेक्सनबाट स्वतः आउने):
                    </Typography>

                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="कोर्स छनोट गर्नुहोस् (Choose Course) *"
                      value={newCourseFeeData.courseId}
                      onChange={(e) => handleCourseSelect(e.target.value)}
                      helperText="शुल्क तोक्नको लागि कोर्स सेक्सनमा दर्ता भएका कोर्सहरूबाट छनोट गर्नुहोस्"
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
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>क्षेत्र/ट्रेड:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                            {getOccupationName(selectedCourseInfo.occupationId)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>अवधि / कुल घण्टा:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                            {selectedCourseInfo.durationValue} {selectedCourseInfo.durationUnit} ({selectedCourseInfo.totalHours || 390} घण्टा)
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
                    २. शुल्क दर तथा किस्ताबन्दी नीति (Fee & Policy Setup)
                  </Typography>

                  {/* Payment Mode Selector */}
                  <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block', mb: 0.8 }}>
                      भुक्तानी मोडल (Payment Policy):
                    </Typography>
                    <ToggleButtonGroup
                      value={newCourseFeeData.paymentMode}
                      exclusive
                      onChange={(e, next) => next && setNewCourseFeeData({ ...newCourseFeeData, paymentMode: next })}
                      size="small"
                      fullWidth
                    >
                      <ToggleButton value="TWO_INSTALLMENTS" sx={{ fontSize: '0.72rem', fontWeight: 800 }}>
                        📅 २ किस्ता (५०% + ५०%)
                      </ToggleButton>
                      <ToggleButton value="FULL_ONLY" sx={{ fontSize: '0.72rem', fontWeight: 800 }}>
                        ⚡ एकमुष्ट मात्र (बेसिक)
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* Base Price */}
                  <TextField
                    label="मूल ब्रोसर शुल्क (Base / Brochure Price)"
                    type="number"
                    fullWidth
                    size="small"
                    value={newCourseFeeData.basePrice}
                    onChange={(e) => setNewCourseFeeData({ ...newCourseFeeData, basePrice: Number(e.target.value) || 0 })}
                    helperText={newCourseFeeData.paymentMode === 'FULL_ONLY' ? 'बेसिक कोर्समा तालिम शुल्क नभए ० राख्नुहोस्।' : 'ब्रोसरमा छापिएको मूल शुल्क (उदा: ३०,०००)'}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">रु.</InputAdornment>
                    }}
                  />

                  {/* Campaign Discount % */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                        अभियान छुट प्रतिशत (Discount %):
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: '#DC2626' }}>
                        {newCourseFeeData.discountPercent}% छुट (रु. {newCourseLivePreview.discountAmount.toLocaleString()})
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
                    label="भर्ना तथा दर्ता शुल्क (Admission Fee)"
                    type="number"
                    fullWidth
                    size="small"
                    value={newCourseFeeData.admissionFee}
                    onChange={(e) => setNewCourseFeeData({ ...newCourseFeeData, admissionFee: Number(e.target.value) || 0 })}
                    helperText="भर्ना हुँदा लाग्ने शुल्क (उदा: १५०० वा बेसिकमा १७००)"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">रु.</InputAdornment>
                    }}
                  />

                  {/* VAT % */}
                  <TextField
                    label="मूल्य अभिवृद्धि कर (VAT %)"
                    type="number"
                    fullWidth
                    size="small"
                    value={newCourseFeeData.vatPercent}
                    onChange={(e) => setNewCourseFeeData({ ...newCourseFeeData, vatPercent: Number(e.target.value) || 0 })}
                    helperText="नेपाल सरकारको नियम अनुसार अनिवार्य १३% भ्याट"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                  />

                  {/* Reason / Offer Note */}
                  <TextField
                    label="अफर कैफियत / परिमार्जनको कारण (Offer / Note)"
                    fullWidth
                    size="small"
                    placeholder="उदा: विशेष ७०% छुट अफर वा ५०% नयाँ अफर"
                    value={newCourseFeeData.revisionReason}
                    onChange={(e) => setNewCourseFeeData({ ...newCourseFeeData, revisionReason: e.target.value })}
                  />

                  {/* Effective Date */}
                  <TextField
                    label="लागू हुने मिति (Effective Date)"
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
                        शुल्क हिसाब सारांश (Live Summary)
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Stack spacing={1.2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">मूल ब्रोसर शुल्क:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          रु. {newCourseLivePreview.basePrice.toLocaleString()}
                        </Typography>
                      </Box>

                      {newCourseLivePreview.discountPercent > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                          <Typography variant="body2">
                            विशेष छुट ({newCourseLivePreview.discountPercent}%):
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            (-) रु. {newCourseLivePreview.discountAmount.toLocaleString()}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#0F2E5A' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>खुद तालिम शुल्क (Net Tuition):</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          रु. {newCourseLivePreview.netTuition.toLocaleString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">भर्ना तथा दर्ता शुल्क:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          (+) रु. {newCourseLivePreview.admissionFee.toLocaleString()}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 0.5 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#0369A1' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>करयोग्य रकम (Subtotal):</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                          रु. {newCourseLivePreview.subtotal.toLocaleString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#D97706' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>१३% भ्याट (VAT 13%):</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                          (+) रु. {newCourseLivePreview.vatAmount.toLocaleString()}
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
                            विद्यार्थीले तिर्ने कुल खुद शुल्क
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            (१३% भ्याट तथा भर्ना शुल्क समावेश)
                          </Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#059669' }}>
                          रु. {newCourseLivePreview.totalEffectiveFee.toLocaleString()}
                        </Typography>
                      </Box>

                      {/* Payment Schedule Breakdown */}
                      <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2E5A', display: 'block', mb: 0.8 }}>
                          📌 किस्ताबन्दी तालिका (Schedule Breakdown):
                        </Typography>
                        {newCourseFeeData.paymentMode === 'FULL_ONLY' ? (
                          <Box sx={{ p: 1, bgcolor: '#FEF3C7', borderRadius: 1.5, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400E' }}>
                              ⚡ एकमुष्ट भुक्तानी: भर्नाकै समयमा रु. {newCourseLivePreview.totalEffectiveFee.toLocaleString()} (१००%)
                            </Typography>
                          </Box>
                        ) : (
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Box sx={{ p: 0.8, bgcolor: '#F8FAFC', borderRadius: 1.5, textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>१. भर्नामा (५०%)</Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                                  रु. {newCourseLivePreview.installment1.toLocaleString()}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 0.8, bgcolor: '#F8FAFC', borderRadius: 1.5, textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>२. १ महिनापछि (५०%)</Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                                  रु. {newCourseLivePreview.installment2.toLocaleString()}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        )}
                      </Box>
                    </Stack>
                  </Box>

                  <Alert severity="success" sx={{ mt: 2, fontSize: '0.72rem', py: 0.5 }}>
                    ✓ शुल्क संरचना सुरक्षित भएपछि यो कोर्सको नयाँ भर्नाहरूमा सोही दर लागू हुनेछ।
                  </Alert>
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
            <Button onClick={() => setOpenAddModal(false)} color="inherit" sx={{ fontWeight: 700 }}>
              रद्द गर्नुहोस्
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
              शुल्क संरचना सुरक्षित गर्नुहोस् (Save Fee Setup)
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
          <span>शुल्क परिवर्तन इतिहास (Revision Audit Log) — {selectedCourse?.title}</span>
          <IconButton onClick={() => setOpenHistoryModal(false)} sx={{ color: '#FFFFFF' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>लागू मिति</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>परिमार्जनको कारण</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>मूल शुल्क</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>छुट (%)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>भर्ना शुल्क</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>कुल प्रभावकारी (भ्याट सहित)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>परिवर्तनकर्ता</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(selectedCourse?.feeStructure?.revisionHistory || []).map((rev) => (
                  <TableRow key={rev.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{rev.date}</TableCell>
                    <TableCell>{rev.reason}</TableCell>
                    <TableCell align="right">रु. {(rev.basePrice || 0).toLocaleString()}</TableCell>
                    <TableCell align="center">
                      <Chip label={`${rev.discountPercent}%`} size="small" sx={{ fontSize: '0.68rem', fontWeight: 800 }} />
                    </TableCell>
                    <TableCell align="right">रु. {(rev.admissionFee || 0).toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: '#059669' }}>
                      रु. {(rev.totalEffectiveFee || 0).toLocaleString()}
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
            बन्द गर्नुहोस्
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================== */}
      {/* 7. MODAL: OFFICIAL FEE STRUCTURE SHEET PRINT (A4)               */}
      {/* ============================================================== */}
      <Dialog open={openPrintModal} onClose={() => setOpenPrintModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>आधिकारिक शुल्क तालिका विवरण पत्र (Official Fee Sheet)</span>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" size="small" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ bgcolor: '#0F2E5A' }}>
              प्रिन्ट गर्नुहोस्
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
                ग्लोबल एरा प्राविधिक स्कुल (GLOBAL ERA TECHNICAL SCHOOL)
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#475569' }}>
                CTEVT Accredited Training Center • MitraPark, Chabahil, Kathmandu
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#F59E0B', mt: 1 }}>
                आधिकारिक तालिम कोर्स शुल्क विवरण तथा किस्ताबन्दी तालिका (१३% भ्याट सहित)
              </Typography>
            </Box>

            {/* Table */}
            <Table size="small" sx={{ mb: 3 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                  <TableCell sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>कोर्स शीर्षक</TableCell>
                  <TableCell sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>अवधि</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>मूल शुल्क</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>छुट</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>भर्ना शुल्क</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>१३% भ्याट</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>कुल शुल्क</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, border: '1px solid #CBD5E1' }}>किस्ता विवरण</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coursesWithFees.map((crs) => (
                  <TableRow key={crs.id}>
                    <TableCell sx={{ border: '1px solid #CBD5E1', fontWeight: 800 }}>{crs.title}</TableCell>
                    <TableCell sx={{ border: '1px solid #CBD5E1' }}>{crs.totalHours} घण्टा</TableCell>
                    <TableCell align="right" sx={{ border: '1px solid #CBD5E1' }}>रु. {crs.feeCalc.basePrice.toLocaleString()}</TableCell>
                    <TableCell align="center" sx={{ border: '1px solid #CBD5E1' }}>{crs.feeCalc.discountPercent}%</TableCell>
                    <TableCell align="right" sx={{ border: '1px solid #CBD5E1' }}>रु. {crs.feeCalc.admissionFee.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ border: '1px solid #CBD5E1' }}>रु. {crs.feeCalc.vatAmount.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ border: '1px solid #CBD5E1', fontWeight: 900 }}>रु. {crs.feeCalc.totalEffectiveFee.toLocaleString()}</TableCell>
                    <TableCell align="center" sx={{ border: '1px solid #CBD5E1', fontSize: '0.72rem' }}>
                      {crs.feeStructure?.paymentMode === 'FULL_ONLY'
                        ? 'एकमुष्ट मात्र'
                        : `रु. ${crs.feeCalc.installment1.toLocaleString()} + रु. ${crs.feeCalc.installment2.toLocaleString()}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Note & Signature */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 3 }}>
              <Box sx={{ maxWidth: '60%' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#64748B' }}>
                  * नोट: सम्पूर्ण शुल्कमा नेपाल सरकारको नियम अनुसार १३% मूल्य अभिवृद्धि कर (VAT) समावेश गरिएको छ।
                  भर्ना शुल्क फिर्ता हुने छैन। दोस्रो किस्ता तालिम सुरु भएको ३० दिनभित्र अनिवार्य बुझाउनुपर्नेछ।
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', minWidth: 150 }}>
                <Box sx={{ height: 35, borderBottom: '1.5px solid #0F2E5A', mb: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                  अधिकृत हस्ताक्षरकर्ता
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  प्रबन्ध निर्देशक / लेखा प्रमुख
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
