import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Stack,
  Grid,
  Paper,
  Tooltip,
  Avatar,
  Tabs,
  Tab,
  InputAdornment,
  Divider,
  Snackbar,
  Alert,
  LinearProgress
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';

import { loadDB, saveDB } from '../../services/storage';
import { exportToExcel } from '../../services/exportUtils';
import { useAuth } from '../../context/AuthContext';
import { postDoubleEntryJournal } from '../../services/storage';
import RecordPaymentModal from './RecordPaymentModal';
import TrainerPayoutModal from './TrainerPayoutModal';
import ReceiptModal from './ReceiptModal';
import DoubleEntryJournalView from './DoubleEntryJournalView';
import ChartOfAccountsView from './ChartOfAccountsView';
import FinancialReportsView from './FinancialReportsView';
import ExpenseManagerView from './ExpenseManagerView';
import ProjectAccountingView from './ProjectAccountingView';
import DailyCashClosingModal from './DailyCashClosingModal';
import PartyManagerView from './PartyManagerView';
import FeeClearanceReceiptModal from './FeeClearanceReceiptModal';
import StudentPaymentTimelineModal from './StudentPaymentTimelineModal';
import UniversalStatementModal from './UniversalStatementModal';
import ConnectIpsPayoutModal from './ConnectIpsPayoutModal';

import LockIcon from '@mui/icons-material/Lock';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import BalanceIcon from '@mui/icons-material/Balance';
import BusinessIcon from '@mui/icons-material/Business';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArticleIcon from '@mui/icons-material/Article';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

export default function AccountsManager({ initialTab = 0 }) {
  const [db, setDb] = useState(loadDB());
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [accountingSubTab, setAccountingSubTab] = useState(0);

  React.useEffect(() => {
    if (initialTab !== undefined) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Modals state
  const [openCollectModal, setOpenCollectModal] = useState(false);
  const [openPayoutModal, setOpenPayoutModal] = useState(false);
  const [openCashClosingModal, setOpenCashClosingModal] = useState(false);
  const [connectIpsModalOpen, setConnectIpsModalOpen] = useState(false);
  const [connectIpsParty, setConnectIpsParty] = useState(null);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);
  const [preselectedStudentId, setPreselectedStudentId] = useState(null);
  const [preselectedTrainerId, setPreselectedTrainerId] = useState(null);
  const [timelineStudent, setTimelineStudent] = useState(null);
  const [clearanceStudent, setClearanceStudent] = useState(null);
  const [clearanceLedger, setClearanceLedger] = useState(null);

  // Universal Statement Modal State
  const [universalStatementOpen, setUniversalStatementOpen] = useState(false);
  const [statementType, setStatementType] = useState('LANDLORD');
  const [statementTargetId, setStatementTargetId] = useState(null);

  // Search & Filters for Student Ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'PAID', 'PARTIAL', 'UNPAID', 'OVERDUE'
  const [groupFilter, setGroupFilter] = useState('ALL');

  // Transactions Log Filters
  const [txTypeFilter, setTxTypeFilter] = useState('ALL'); // 'ALL', 'FEE', 'PAYOUT'
  const [txSearch, setTxSearch] = useState('');

  // Toast
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const students = db.students || [];
  const courses = db.courses || [];
  const groups = db.trainingGroups || [];
  const trainers = db.trainers || [];
  const payments = db.payments || [];
  const trainerPayouts = db.trainerPayouts || [];

  // Helper: Calculate single student's financial ledger
  const getStudentLedger = (st) => {
    const grp = groups.find((g) => g.id === st.groupId);
    const crs = courses.find((c) => c.id === grp?.courseId);

    const originalFee = st.originalFee || crs?.price || 30000;
    const discountAmount = st.discountAmount || 0;
    const discountPercent = st.discountPercent || (discountAmount > 0 ? Math.round((discountAmount / originalFee) * 100) : 0);
    const admissionFee = st.admissionFee || 0;
    const lockedFee = st.lockedCourseFee || (originalFee - discountAmount + admissionFee) || 15000;

    const studentPayments = payments.filter((p) => p.studentId === st.id);
    const totalPaid = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const due = Math.max(0, lockedFee - totalPaid);

    // Overdue check: 2nd installment is due 30 days after admissionDate
    const admDate = new Date(st.admissionDate || '2026-09-01');
    const dueDate = new Date(admDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const isOverdue = due > 0 && new Date() > dueDate;

    let paymentStatus = 'Unpaid';
    if (due === 0) {
      paymentStatus = 'Paid';
    } else if (totalPaid > 0) {
      paymentStatus = isOverdue ? 'Overdue' : 'Partial';
    } else if (isOverdue) {
      paymentStatus = 'Overdue';
    }

    return {
      originalFee,
      discountAmount,
      discountPercent,
      admissionFee,
      lockedFee,
      netFee: lockedFee,
      totalPaid,
      due,
      paymentStatus,
      isOverdue,
      dueDateStr: dueDate.toISOString().slice(0, 10),
      courseTitle: crs?.title || 'Vocational Training',
      groupCode: grp?.groupCode || st.groupId || 'Group',
      paymentCount: studentPayments.length
    };
  };

  // Helper: Calculate trainer's commission & payout ledger
  const getTrainerLedger = (trn) => {
    const assigned = groups.filter((g) => g.trainerId === trn.id);

    // Actual student payments collected for groups assigned to this trainer
    let totalCollectedInGroups = 0;
    let totalCommissionEarned = 0;

    assigned.forEach((grp) => {
      const commPercent = Number(grp.trainerCommissionPercent) || 25;
      const grpPayments = payments.filter((p) => p.groupId === grp.id);
      const grpCollected = grpPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      totalCollectedInGroups += grpCollected;
      totalCommissionEarned += Math.round((grpCollected * commPercent) / 100);
    });

    // Payouts already disbursed
    const disbursements = trainerPayouts.filter((tp) => tp.trainerId === trn.id);
    const totalPaid = disbursements.reduce((sum, tp) => sum + (Number(tp.amount) || 0), 0);

    const isSalary = trn.remunerationType === 'SALARY';
    const totalExpected = isSalary ? (trn.monthlySalary || 25000) : totalCommissionEarned;
    const balanceDue = Math.max(0, totalExpected - totalPaid);

    return {
      assignedGroupsCount: assigned.length,
      totalCollectedInGroups,
      totalEarned: totalExpected,
      totalPaid,
      balanceDue,
      disbursementCount: disbursements.length
    };
  };

  // Aggregated Financial Metrics
  const metrics = useMemo(() => {
    let totalFeeCollected = 0;
    let totalPendingDues = 0;
    let totalOverdueAmount = 0;
    let overdueCount = 0;

    students.forEach((st) => {
      const l = getStudentLedger(st);
      totalFeeCollected += l.totalPaid;
      totalPendingDues += l.due;
      if (l.isOverdue) {
        totalOverdueAmount += l.due;
        overdueCount++;
      }
    });

    const totalTrainerDisbursed = trainerPayouts.reduce((sum, tp) => sum + (Number(tp.amount) || 0), 0);
    const netMargin = totalFeeCollected - totalTrainerDisbursed;

    return {
      totalFeeCollected,
      totalPendingDues,
      totalOverdueAmount,
      overdueCount,
      totalTrainerDisbursed,
      netMargin
    };
  }, [students, payments, trainerPayouts, groups, courses]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const l = getStudentLedger(st);

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = st.name.toLowerCase().includes(q);
        const matchTgid = st.tgid.toLowerCase().includes(q);
        const matchPhone = st.phone.includes(q);
        const matchCourse = l.courseTitle.toLowerCase().includes(q);
        if (!matchName && !matchTgid && !matchPhone && !matchCourse) return false;
      }

      // Status match
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PAID' && l.paymentStatus !== 'Paid') return false;
        if (statusFilter === 'PARTIAL' && l.paymentStatus !== 'Partial') return false;
        if (statusFilter === 'UNPAID' && l.paymentStatus !== 'Unpaid') return false;
        if (statusFilter === 'OVERDUE' && !l.isOverdue) return false;
      }

      // Group match
      if (groupFilter !== 'ALL' && st.groupId !== groupFilter) return false;

      return true;
    });
  }, [students, searchQuery, statusFilter, groupFilter, payments, groups, courses]);

  // Combined Transactions Audit Log
  const combinedTransactions = useMemo(() => {
    const list = [
      ...payments.map((p) => ({
        id: p.id,
        refNo: p.receiptNo,
        type: 'FEE_RECEIPT',
        name: p.studentName,
        sub: `${p.tgid || 'Student'} • ${p.courseName || ''}`,
        amount: p.amount,
        isInflow: true,
        date: p.paymentDate,
        month: p.paymentMonth,
        method: p.paymentMethod || 'Cash',
        remarks: p.remarks,
        user: p.receivedBy,
        rawObj: p
      })),
      ...trainerPayouts.map((tp) => ({
        id: tp.id,
        refNo: tp.voucherNo,
        type: 'TRAINER_PAYOUT',
        name: tp.trainerName,
        sub: tp.payoutType === 'COMMISSION' ? `ब्याच कमिसन (${tp.groupName})` : 'मासिक तलब निकासा',
        amount: tp.amount,
        isInflow: false,
        date: tp.payoutDate,
        month: tp.payoutMonth,
        method: tp.paymentMethod || 'Bank Transfer',
        remarks: tp.remarks,
        user: tp.disbursedBy,
        rawObj: tp
      }))
    ];

    return list
      .filter((tx) => {
        if (txTypeFilter === 'FEE' && tx.type !== 'FEE_RECEIPT') return false;
        if (txTypeFilter === 'PAYOUT' && tx.type !== 'TRAINER_PAYOUT') return false;
        if (txSearch.trim()) {
          const q = txSearch.toLowerCase();
          return (
            tx.refNo.toLowerCase().includes(q) ||
            tx.name.toLowerCase().includes(q) ||
            tx.remarks?.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [payments, trainerPayouts, txTypeFilter, txSearch]);

  // Save new Student Payment with Auto Double-Entry Posting
  const handleSavePayment = (newPayment) => {
    const isDigital = newPayment.paymentMethod !== 'Cash';
    const debitAcc = isDigital ? '1020' : '1010';
    const payAmt = Number(newPayment.amount) || 0;

    let dbToUpdate = db;
    try {
      const { nextDb } = postDoubleEntryJournal(dbToUpdate, {
        narration: `विद्यार्थी ${newPayment.studentName} शुल्क संकलन (${newPayment.receiptNo})`,
        lines: [
          { accountCode: debitAcc, debit: payAmt, credit: 0, lineNarration: `Receipt ${newPayment.receiptNo} via ${newPayment.paymentMethod}` },
          { accountCode: '4100', debit: 0, credit: payAmt, lineNarration: `${newPayment.courseName || 'Training'} Fee Collection` }
        ],
        sourceModule: 'STUDENT_FEE',
        sourceId: newPayment.receiptNo,
        entryDate: newPayment.paymentDate
      });
      dbToUpdate = nextDb;
    } catch (e) {
      console.warn('Auto journal post warning:', e);
    }

    const updatedPayments = [newPayment, ...(dbToUpdate.payments || [])];
    const nextDb = { ...dbToUpdate, payments: updatedPayments };
    saveDB(nextDb);
    setDb(nextDb);
    showToast(`रसिद ${newPayment.receiptNo} जारी भयो (Payment Rs. ${newPayment.amount.toLocaleString()} recorded).`);
    setSelectedReceiptPayment(newPayment);
  };

  // Save new Trainer Payout with Auto Double-Entry Posting
  const handleSavePayout = (newPayout) => {
    const isDigital = newPayout.paymentMethod !== 'Cash';
    const creditAcc = isDigital ? '1020' : '1010';
    const payoutAmt = Number(newPayout.amount) || 0;
    const isSalary = newPayout.payoutType === 'SALARY';
    const debitAcc = isSalary ? '5110' : '5100';

    let dbToUpdate = db;
    try {
      const { nextDb } = postDoubleEntryJournal(dbToUpdate, {
        narration: `प्रशिक्षक ${newPayout.trainerName} पारिश्रमिक निकासा (${newPayout.voucherNo})`,
        lines: [
          { accountCode: debitAcc, debit: payoutAmt, credit: 0, lineNarration: newPayout.remarks || 'Trainer remuneration' },
          { accountCode: creditAcc, debit: 0, credit: payoutAmt, lineNarration: `Paid via ${newPayout.paymentMethod}` }
        ],
        sourceModule: 'TRAINER_PAYOUT',
        sourceId: newPayout.voucherNo,
        entryDate: newPayout.payoutDate
      });
      dbToUpdate = nextDb;
    } catch (e) {
      console.warn('Auto journal payout warning:', e);
    }

    const updatedPayouts = [newPayout, ...(dbToUpdate.trainerPayouts || [])];
    const nextDb = { ...dbToUpdate, trainerPayouts: updatedPayouts };
    saveDB(nextDb);
    setDb(nextDb);
    showToast(`भौचर ${newPayout.voucherNo} जारी भयो (Payout Rs. ${newPayout.amount.toLocaleString()} disbursed).`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredStudents.map((st) => {
      const l = getStudentLedger(st);
      return {
        'TGID': st.tgid,
        'Student Name': st.name,
        'Phone': st.phone,
        'Batch': l.groupCode,
        'Course': l.courseTitle,
        'Original Fee': l.originalFee,
        'Discount Amount': l.discountAmount,
        'Admission Fee': l.admissionFee,
        'Locked Total Fee': l.lockedFee,
        'Total Paid': l.totalPaid,
        'Balance Due': l.due,
        'Payment Status': l.paymentStatus,
        '2nd Due Date': l.dueDateStr
      };
    });
    exportToExcel(data, 'GlobalEra_Student_Fee_Ledger');
    showToast('शुल्क लेजर एक्सेल रिपोर्ट डाउनलोड भयो।');
  };

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* Page Title & Action Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', lg: 'center' },
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 2.5,
          mb: 3.5,
          p: 2.5,
          bgcolor: '#FFFFFF',
          borderRadius: 3.5,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)'
        }}
      >
        {/* Left: Branding & Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 8px 18px rgba(15, 46, 90, 0.28)',
              border: '2px solid #F59E0B'
            }}
          >
            <AccountBalanceWalletIcon sx={{ fontSize: '1.65rem' }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap', mb: 0.3 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>
                Accounts & Fee Management
              </Typography>
              <Chip
                label="🟢 काउन्टर खुल्ला • FY 2081/82"
                size="small"
                sx={{
                  bgcolor: '#ECFDF5',
                  color: '#065F46',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  border: '1px solid #A7F3D0',
                  height: 24
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
              ग्लोबल एरा वित्तीय तथा शुल्क व्यवस्थापन • किस्ता संकलन, ConnectIPS भुक्तानी, घरबेटी/पार्टी लेजर तथा अडिट हब
            </Typography>
          </Box>
        </Box>

        {/* Right: Balanced 2-Tier Action Bar */}
        <Stack direction="column" spacing={1.2} sx={{ width: { xs: '100%', lg: 'auto' } }} alignItems={{ xs: 'stretch', lg: 'flex-end' }}>
          {/* Tier 1: Primary Action Triggers */}
          <Stack direction="row" spacing={1.2} flexWrap="wrap">
            <Button
              variant="contained"
              onClick={() => {
                setPreselectedStudentId(null);
                setOpenCollectModal(true);
              }}
              startIcon={<PointOfSaleIcon />}
              sx={{
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                borderRadius: 2.5,
                px: 2.2,
                py: 0.9,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                textTransform: 'none',
                fontSize: '0.85rem',
                '&:hover': {
                  background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
                  boxShadow: '0 6px 18px rgba(16, 185, 129, 0.45)'
                }
              }}
            >
              + शुल्क संकलन (Collect Fee)
            </Button>

            <Button
              variant="contained"
              onClick={() => {
                const defaultParty = (db.parties || []).find((p) => p.type === 'LANDLORD') || (db.parties || [])[0];
                setConnectIpsParty(defaultParty || null);
                setConnectIpsModalOpen(true);
              }}
              startIcon={<AccountBalanceIcon />}
              sx={{
                background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                borderRadius: 2.5,
                px: 2.2,
                py: 0.9,
                boxShadow: '0 4px 14px rgba(15, 46, 90, 0.35)',
                textTransform: 'none',
                fontSize: '0.85rem',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0A1E3B 0%, #0F2E5A 100%)',
                  boxShadow: '0 6px 18px rgba(15, 46, 90, 0.45)'
                }
              }}
            >
              + ConnectIPS भुक्तानी
            </Button>

            <Button
              variant="contained"
              onClick={() => {
                setPreselectedTrainerId(null);
                setOpenPayoutModal(true);
              }}
              startIcon={<PaymentsIcon />}
              sx={{
                background: 'linear-gradient(135deg, #78350F 0%, #B45309 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                borderRadius: 2.5,
                px: 2.2,
                py: 0.9,
                boxShadow: '0 4px 14px rgba(180, 83, 9, 0.35)',
                textTransform: 'none',
                fontSize: '0.85rem',
                '&:hover': {
                  background: 'linear-gradient(135deg, #592507 0%, #78350F 100%)'
                }
              }}
            >
              + पारिश्रमिक निकासा
            </Button>
          </Stack>

          {/* Tier 2: Secondary Utility & Report Bar */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setStatementType('LANDLORD');
                setUniversalStatementOpen(true);
              }}
              startIcon={<ArticleIcon sx={{ fontSize: '1rem !important' }} />}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                borderColor: '#CBD5E1',
                color: '#0F2E5A',
                bgcolor: '#F8FAFC',
                textTransform: 'none',
                fontSize: '0.78rem',
                py: 0.6,
                px: 1.5,
                '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' }
              }}
            >
              📜 एकीकृत स्टेटमेन्ट हब
            </Button>

            <Button
              size="small"
              variant="outlined"
              onClick={() => setOpenCashClosingModal(true)}
              startIcon={<LockIcon sx={{ fontSize: '1rem !important' }} />}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                borderColor: '#CBD5E1',
                color: '#334155',
                bgcolor: '#F8FAFC',
                textTransform: 'none',
                fontSize: '0.78rem',
                py: 0.6,
                px: 1.5,
                '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' }
              }}
            >
              🔒 क्यास क्लोजिङ
            </Button>

            <Button
              size="small"
              variant="outlined"
              onClick={handleExportExcel}
              startIcon={<FileDownloadIcon sx={{ fontSize: '1rem !important' }} />}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                borderColor: '#CBD5E1',
                color: '#334155',
                bgcolor: '#F8FAFC',
                textTransform: 'none',
                fontSize: '0.78rem',
                py: 0.6,
                px: 1.5,
                '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' }
              }}
            >
              📊 एक्सेल रिपोर्ट
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Top Financial KPI Summary Cards */}
      <Grid container spacing={2.2} sx={{ mb: 3.5 }}>
        {/* Card 1: Total Fee Collected */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: 3.5,
              border: '1px solid #E2E8F0',
              borderLeft: '5px solid #059669',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0, 0, 0, 0.05)' }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '0.72rem' }}>
                कुल संकलित शुल्क
              </Typography>
              <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: '1rem' }} />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#059669', my: 0.5, fontSize: '1.45rem' }}>
              Rs. {metrics.totalFeeCollected.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              नगद तथा अनलाइन रसिद प्राप्ति
            </Typography>
          </Paper>
        </Grid>

        {/* Card 2: Pending Dues */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: 3.5,
              border: '1px solid #E2E8F0',
              borderLeft: '5px solid #F59E0B',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0, 0, 0, 0.05)' }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '0.72rem' }}>
                उठ्न बाँकी बक्यौता
              </Typography>
              <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AccessTimeIcon sx={{ fontSize: '1rem' }} />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#D97706', my: 0.5, fontSize: '1.45rem' }}>
              Rs. {metrics.totalPendingDues.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              दोस्रो किस्ता बाँकी रकम
            </Typography>
          </Paper>
        </Grid>

        {/* Card 3: Overdue >30D */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: 3.5,
              border: '1px solid #E2E8F0',
              borderLeft: '5px solid #EF4444',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0, 0, 0, 0.05)' }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '0.72rem' }}>
                म्याद नाघेको बक्यौता
              </Typography>
              <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ErrorOutlineIcon sx={{ fontSize: '1rem' }} />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#DC2626', my: 0.5, fontSize: '1.45rem' }}>
              Rs. {metrics.totalOverdueAmount.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {metrics.overdueCount} जना विद्यार्थीको म्याद कट्यो
            </Typography>
          </Paper>
        </Grid>

        {/* Card 4: Trainer Disbursements */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: 3.5,
              border: '1px solid #E2E8F0',
              borderLeft: '5px solid #B45309',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0, 0, 0, 0.05)' }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '0.72rem' }}>
                प्रशिक्षक निकासा
              </Typography>
              <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PaymentsIcon sx={{ fontSize: '1rem' }} />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#B45309', my: 0.5, fontSize: '1.45rem' }}>
              Rs. {metrics.totalTrainerDisbursed.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              कमिसन तथा मासिक पारिश्रमिक
            </Typography>
          </Paper>
        </Grid>

        {/* Card 5: Net Institutional Margin */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: 3.5,
              border: '1px solid #E2E8F0',
              borderLeft: '5px solid #0F2E5A',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0, 0, 0, 0.05)' }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '0.72rem' }}>
                खुद संस्था बचत
              </Typography>
              <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: '#EFF6FF', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AccountBalanceWalletIcon sx={{ fontSize: '1rem' }} />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F2E5A', my: 0.5, fontSize: '1.45rem' }}>
              Rs. {metrics.netMargin.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 700 }}>
              निकासा पछिको कुल बचत रकम
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Navigation Master Tabs (5 Structured Tabs - No Horizontal Scrolling Overflow!) */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3.5,
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, next) => setActiveTab(next)}
          variant="standard"
          sx={{
            px: 1.5,
            minHeight: 52,
            '& .MuiTabs-flexContainer': {
              display: 'flex',
              justifyContent: 'space-between'
            },
            '& .MuiTabs-indicator': {
              height: 3.5,
              borderRadius: '3px 3px 0 0',
              bgcolor: '#0F2E5A'
            },
            '& .MuiTab-root': {
              flex: 1,
              fontWeight: 800,
              fontSize: '0.86rem',
              textTransform: 'none',
              py: 1.6,
              minHeight: 52,
              color: '#64748B',
              '&.Mui-selected': {
                color: '#0F2E5A',
                fontWeight: 900
              }
            }
          }}
        >
          <Tab icon={<TrendingUpIcon />} iconPosition="start" label="वित्तीय ड्यासबोर्ड (Overview)" />
          <Tab icon={<SchoolIcon />} iconPosition="start" label={`विद्यार्थी किस्ता शुल्क (${students.length})`} />
          <Tab icon={<StorefrontIcon />} iconPosition="start" label={`पार्टी तथा घरबेटी (${(db.parties || []).length})`} />
          <Tab icon={<PersonIcon />} iconPosition="start" label={`प्रशिक्षक पेरोल (${trainers.length})`} />
          <Tab icon={<AccountTreeIcon />} iconPosition="start" label="लेजर, डे-बुक तथा अडिट (Accounting Hub)" />
        </Tabs>
      </Paper>

      {/* ======================================================== */}
      {/* TAB 0: FINANCIAL OVERVIEW                                */}
      {/* ======================================================== */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Left: Recent Student Payments */}
          <Grid item xs={12} md={7}>
            <Card
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                height: '100%'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    पछिल्ला शुल्क संकलन रसिदहरू (Recent Receipts)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    विद्यार्थीहरूले भर्खरै बुझाएका शुल्कहरू
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => setActiveTab(1)}
                  sx={{ fontWeight: 700, textTransform: 'none', color: '#0F2E5A' }}
                >
                  सबै रसिदहरू हेर्नुहोस् &rarr;
                </Button>
              </Box>

              <TableContainer sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <Table size="small">
                  <TableHead
                    sx={{
                      bgcolor: '#0F2E5A',
                      '& .MuiTableCell-head': {
                        bgcolor: '#0F2E5A !important',
                        color: '#FFFFFF !important',
                        fontWeight: 900,
                        fontSize: '0.84rem',
                        py: 1.2,
                        borderBottom: '2px solid #F59E0B'
                      }
                    }}
                  >
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 60, textAlign: 'center' }}>क्र.सं.</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>रसिद नं.</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>विद्यार्थी</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>रकम (Rs.)</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>मिति</TableCell>
                      <TableCell align="right" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>रसिद</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                          अहिलेसम्म कुनै शुल्क संकलन भएको छैन।
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.slice(0, 5).map((p, idx) => (
                        <TableRow key={p.id} hover>
                          <TableCell sx={{ fontWeight: 800, color: '#64748B', textAlign: 'center', width: 60 }}>
                            {idx + 1}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#1E40AF' }}>
                            {p.receiptNo}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.studentName}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>{p.courseName}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#059669', fontSize: '0.92rem' }}>
                            Rs. {Number(p.amount).toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{p.paymentDate}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="रसिद प्रिन्ट गर्नुहोस्">
                              <IconButton
                                size="small"
                                onClick={() => setSelectedReceiptPayment(p)}
                                sx={{ color: '#0284C7', bgcolor: '#F0F9FF' }}
                              >
                                <PrintIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          {/* Right: Recent Trainer Disbursements (Converted to Matching Model 1 Table!) */}
          <Grid item xs={12} md={5}>
            <Card
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3.5,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                height: '100%'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    प्रशिक्षक निकासा भौचरहरू (Trainer Payouts)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    कमिसन र मासिक तलब भुक्तानी
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => setActiveTab(3)}
                  sx={{ fontWeight: 700, textTransform: 'none', color: '#0F2E5A' }}
                >
                  पेरोल हेर्नुहोस् &rarr;
                </Button>
              </Box>

              <TableContainer sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <Table size="small">
                  <TableHead
                    sx={{
                      bgcolor: '#0F2E5A',
                      '& .MuiTableCell-head': {
                        bgcolor: '#0F2E5A !important',
                        color: '#FFFFFF !important',
                        fontWeight: 900,
                        fontSize: '0.84rem',
                        py: 1.2,
                        borderBottom: '2px solid #F59E0B'
                      }
                    }}
                  >
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 55, textAlign: 'center' }}>क्र.सं.</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>भौचर नं.</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>प्रशिक्षक</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>रकम (Rs.)</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>मिति</TableCell>
                      <TableCell align="right" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>प्रकार</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trainerPayouts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                          अहिलेसम्म कुनै प्रशिक्षक भुक्तानी भएको छैन।
                        </TableCell>
                      </TableRow>
                    ) : (
                      trainerPayouts.slice(0, 5).map((tp, idx) => (
                        <TableRow key={tp.id} hover>
                          <TableCell sx={{ fontWeight: 800, color: '#64748B', textAlign: 'center', width: 55 }}>
                            {idx + 1}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#B45309', fontSize: '0.8rem' }}>
                            {tp.voucherNo}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                              {tp.trainerName}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 900, color: '#B45309', fontSize: '0.9rem' }}>
                            Rs. {Number(tp.amount).toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.78rem', color: '#64748B' }}>
                            {tp.payoutDate}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={tp.payoutType === 'COMMISSION' ? 'कमिसन' : 'तलब'}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.68rem',
                                height: 22,
                                bgcolor: tp.payoutType === 'COMMISSION' ? '#FEF3C7' : '#EFF6FF',
                                color: tp.payoutType === 'COMMISSION' ? '#92400E' : '#1D4ED8'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ======================================================== */}
      {/* TAB 1: STUDENT FEE LEDGER                                */}
      {/* ======================================================== */}
      {activeTab === 1 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3.5,
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            bgcolor: '#FFFFFF'
          }}
        >
          {/* Search & Filter Toolbar */}
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flexGrow: 1 }}>
              <TextField
                size="small"
                placeholder="विद्यार्थी नाम, TGID, वा फोन खोज्नुहोस्..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  )
                }}
                sx={{ minWidth: { xs: '100%', sm: 260 } }}
              />

              <TextField
                select
                size="small"
                label="भुक्तानी स्थिति (Status)"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="ALL">सबै स्थिति (All)</MenuItem>
                <MenuItem value="PAID">सम्पन्न (Paid)</MenuItem>
                <MenuItem value="PARTIAL">आंशिक किस्ता (Partial)</MenuItem>
                <MenuItem value="OVERDUE">म्याद नाघेको (Overdue &gt;30D)</MenuItem>
                <MenuItem value="UNPAID">नबुझाएको (Unpaid)</MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                label="तालिम ब्याच (Group)"
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="ALL">सबै ब्याच (All Groups)</MenuItem>
                {groups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.groupCode || g.id}
                  </MenuItem>
                ))}
              </TextField>

              {(searchQuery || statusFilter !== 'ALL' || groupFilter !== 'ALL') && (
                <Button
                  size="small"
                  startIcon={<FilterAltOffIcon />}
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setGroupFilter('ALL');
                  }}
                  sx={{ color: '#EF4444', fontWeight: 700, textTransform: 'none' }}
                >
                  फिल्टर हटाउनुहोस्
                </Button>
              )}
            </Box>
          </Box>

          <TableContainer sx={{ maxHeight: 620 }}>
            <Table stickyHeader>
              <TableHead
                sx={{
                  bgcolor: '#0F2E5A',
                  '& .MuiTableCell-head': {
                    bgcolor: '#0F2E5A !important',
                    color: '#FFFFFF !important',
                    fontWeight: 900,
                    fontSize: '0.84rem',
                    py: 1.5,
                    borderBottom: '2px solid #F59E0B'
                  }
                }}
              >
                <TableRow>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 65, textAlign: 'center' }}>
                    क्र.सं. (S.N.)
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>TGID</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>विद्यार्थीको नाम</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>कोर्स तथा ब्याच</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>लक्ड कुल शुल्क</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>बुझाएको रकम</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>बाँकी बक्यौता</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>अवस्था</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>२nd किस्ता म्याद</TableCell>
                  <TableCell align="right" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>कार्यहरू</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6, color: '#94A3B8' }}>
                      कुनै विद्यार्थी फेला परेन।
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((st, idx) => {
                    const l = getStudentLedger(st);

                    return (
                      <TableRow key={st.id} hover>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center', color: '#64748B', width: 65 }}>
                          {idx + 1}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#1E40AF' }}>
                          {st.tgid}
                        </TableCell>

                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            {st.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {st.phone}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {l.courseTitle}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            ब्याच: {l.groupCode}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            Rs. {l.lockedFee.toLocaleString()}
                          </Typography>
                          {l.discountAmount > 0 && (
                            <Typography variant="caption" sx={{ color: '#DC2626', display: 'block' }}>
                              छुट: -Rs. {l.discountAmount.toLocaleString()} ({l.discountPercent}%)
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ fontWeight: 800, color: '#059669' }}>
                          Rs. {l.totalPaid.toLocaleString()}
                        </TableCell>

                        <TableCell sx={{ fontWeight: 900, color: l.due > 0 ? (l.isOverdue ? '#DC2626' : '#D97706') : '#059669' }}>
                          Rs. {l.due.toLocaleString()}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={
                              l.paymentStatus === 'Paid'
                                ? 'सम्पन्न (Paid)'
                                : l.paymentStatus === 'Overdue'
                                ? 'Overdue (>30D)'
                                : l.paymentStatus === 'Partial'
                                ? 'आंशिक (Partial)'
                                : 'नबुझाएको (Unpaid)'
                            }
                            size="small"
                            color={
                              l.paymentStatus === 'Paid'
                                ? 'success'
                                : l.paymentStatus === 'Overdue'
                                ? 'error'
                                : l.paymentStatus === 'Partial'
                                ? 'warning'
                                : 'default'
                            }
                            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: l.isOverdue ? 900 : 600,
                              color: l.isOverdue ? '#DC2626' : '#475569'
                            }}
                          >
                            {l.due > 0 ? l.dueDateStr : '-'}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {l.due > 0 && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<PointOfSaleIcon sx={{ fontSize: '1rem !important' }} />}
                                onClick={() => {
                                  setPreselectedStudentId(st.id);
                                  setOpenCollectModal(true);
                                }}
                                sx={{
                                  background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                                  fontWeight: 800,
                                  fontSize: '0.75rem',
                                  textTransform: 'none',
                                  borderRadius: 2
                                }}
                              >
                                शुल्क लिनुहोस्
                              </Button>
                            )}

                            {l.due === 0 && (
                              <Tooltip title="आधिकारिक शुल्क चुक्ता प्रमाणपत्र रसिद प्रिन्ट गर्नुहोस्">
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="warning"
                                  startIcon={<VerifiedIcon sx={{ fontSize: '1rem !important' }} />}
                                  onClick={() => {
                                    setClearanceStudent(st);
                                    setClearanceLedger(l);
                                  }}
                                  sx={{
                                    bgcolor: '#F59E0B',
                                    color: '#0F2E5A',
                                    fontWeight: 900,
                                    fontSize: '0.74rem',
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    '&:hover': { bgcolor: '#D97706', color: '#FFFFFF' }
                                  }}
                                >
                                  शुल्क चुक्ता
                                </Button>
                              </Tooltip>
                            )}

                            <Tooltip title="१२-महिने लेजर स्टेटमेन्ट हेर्नुहोस्">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setStatementType('STUDENT');
                                  setStatementTargetId(st.id);
                                  setUniversalStatementOpen(true);
                                }}
                                sx={{ color: '#0F2E5A', bgcolor: '#F1F5F9' }}
                              >
                                <ArticleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="किस्ता टाइमलाइन र इतिहास हेर्नुहोस्">
                              <IconButton
                                size="small"
                                onClick={() => setTimelineStudent({ student: st, ledger: l })}
                                sx={{ color: '#0F2E5A', bgcolor: '#F1F5F9' }}
                              >
                                <AccessTimeIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {l.paymentCount > 0 && (
                              <Tooltip title="पछिल्लो रसिद हेर्नुहोस्">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const latestP = payments.filter((p) => p.studentId === st.id).slice(-1)[0];
                                    if (latestP) setSelectedReceiptPayment(latestP);
                                  }}
                                  sx={{ color: '#0284C7', bgcolor: '#F0F9FF' }}
                                >
                                  <ReceiptLongIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PARTY DIRECTORY & LANDLORD ACCOUNTS               */}
      {/* ======================================================== */}
      {activeTab === 2 && (
        <PartyManagerView db={db} setDb={setDb} showToast={showToast} />
      )}

      {/* ======================================================== */}
      {/* TAB 3: TRAINER PAYOUTS & COMMISSIONS                     */}
      {/* ======================================================== */}
      {activeTab === 3 && (
        <Grid container spacing={2.5}>
          {trainers.map((trn) => {
            const l = getTrainerLedger(trn);

            return (
              <Grid item xs={12} sm={6} md={4} key={trn.id}>
                <Card
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3.5,
                    border: '1px solid #E2E8F0',
                    bgcolor: '#FFFFFF',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        src={trn.photo}
                        sx={{ width: 46, height: 46, bgcolor: '#B45309', fontWeight: 800 }}
                      >
                        {trn.name ? trn.name.charAt(0) : 'T'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                          {trn.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {trn.specialization || 'प्रशिक्षक'}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={trn.remunerationType === 'SALARY' ? 'मासिक तलब' : 'कमिसन (%)'}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        bgcolor: trn.remunerationType === 'SALARY' ? '#EFF6FF' : '#FEF3C7',
                        color: trn.remunerationType === 'SALARY' ? '#1D4ED8' : '#92400E'
                      }}
                    />
                  </Box>

                  {/* Financial Breakdown Card */}
                  <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, mb: 2, border: '1px solid #E2E8F0' }}>
                    <Grid container spacing={1} sx={{ fontSize: '0.85rem' }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>तोकिएका ब्याच:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{l.assignedGroupsCount} ब्याच</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>संकलित शुल्क रकम:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>Rs. {l.totalCollectedInGroups.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>पाकेको पारिश्रमिक:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>Rs. {l.totalEarned.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>अहिलेसम्म भुक्तानी:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#10B981' }}>Rs. {l.totalPaid.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={12} sx={{ pt: 1, borderTop: '1px dashed #CBD5E1', mt: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#78350F', fontWeight: 800 }}>दिन बाँकी बक्यौता:</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: l.balanceDue > 0 ? '#B45309' : '#059669' }}>
                            Rs. {l.balanceDue.toLocaleString()}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Action Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PaymentsIcon />}
                    onClick={() => {
                      setPreselectedTrainerId(trn.id);
                      setOpenPayoutModal(true);
                    }}
                    sx={{
                      background: 'linear-gradient(135deg, #78350F 0%, #B45309 100%)',
                      fontWeight: 800,
                      borderRadius: 2,
                      textTransform: 'none'
                    }}
                  >
                    पारिश्रमिक निकासा गर्नुहोस् (Pay)
                  </Button>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ACCOUNTING HUB (EXPENSES, JOURNALS, COA, AUDIT)   */}
      {/* ======================================================== */}
      {activeTab === 4 && (
        <Box>
          {/* Sub-Navigation Pill Control */}
          <Paper
            elevation={0}
            sx={{
              p: 0.8,
              mb: 3,
              borderRadius: 3,
              border: '1px solid #E2E8F0',
              bgcolor: '#F8FAFC',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.8,
              alignItems: 'center'
            }}
          >
            {[
              { label: `दैनिक खर्च तथा घरभाडा (${(db.expenses || []).length})`, icon: <PaymentsIcon fontSize="small" /> },
              { label: 'दोहोरो लेखा जर्नल (Journal)', icon: <ReceiptLongIcon fontSize="small" /> },
              { label: 'खाता सूची (COA)', icon: <AccountTreeIcon fontSize="small" /> },
              { label: `प्रोजेक्ट एकाउन्टिङ (${(db.projectContracts || []).length})`, icon: <BusinessIcon fontSize="small" /> },
              { label: 'वित्तीय विवरणहरू (Statements)', icon: <BalanceIcon fontSize="small" /> },
              { label: `कारोबार अडिट लग (${payments.length + trainerPayouts.length})`, icon: <ArticleIcon fontSize="small" /> }
            ].map((sub, idx) => (
              <Button
                key={idx}
                size="small"
                startIcon={sub.icon}
                onClick={() => setAccountingSubTab(idx)}
                sx={{
                  borderRadius: 2.2,
                  px: 1.8,
                  py: 0.8,
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  color: accountingSubTab === idx ? '#FFFFFF' : '#475569',
                  bgcolor: accountingSubTab === idx ? '#0F2E5A' : 'transparent',
                  boxShadow: accountingSubTab === idx ? '0 2px 8px rgba(15, 46, 90, 0.25)' : 'none',
                  '&:hover': {
                    bgcolor: accountingSubTab === idx ? '#1E40AF' : '#E2E8F0'
                  }
                }}
              >
                {sub.label}
              </Button>
            ))}
          </Paper>

          {/* Sub-view 0: Expenses */}
          {accountingSubTab === 0 && (
            <ExpenseManagerView db={db} setDb={setDb} showToast={showToast} />
          )}

          {/* Sub-view 1: Double-Entry Journal */}
          {accountingSubTab === 1 && (
            <DoubleEntryJournalView db={db} setDb={setDb} showToast={showToast} />
          )}

          {/* Sub-view 2: Chart of Accounts */}
          {accountingSubTab === 2 && (
            <ChartOfAccountsView db={db} />
          )}

          {/* Sub-view 3: Project Accounting */}
          {accountingSubTab === 3 && (
            <ProjectAccountingView db={db} setDb={setDb} showToast={showToast} />
          )}

          {/* Sub-view 4: Financial Reports */}
          {accountingSubTab === 4 && (
            <FinancialReportsView db={db} />
          )}

          {/* Sub-view 5: All Transactions Audit Log */}
          {accountingSubTab === 5 && (
            <Card
              elevation={0}
              sx={{
                borderRadius: 3.5,
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                bgcolor: '#FFFFFF'
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flexGrow: 1 }}>
                  <TextField
                    size="small"
                    placeholder="रसिद नं., नाम वा कैफियत खोज्नुहोस्..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#94A3B8' }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{ minWidth: 260 }}
                  />

                  <TextField
                    select
                    size="small"
                    label="कारोबार प्रकार (Type)"
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter(e.target.value)}
                    sx={{ minWidth: 180 }}
                  >
                    <MenuItem value="ALL">सबै कारोबार (All)</MenuItem>
                    <MenuItem value="FEE">विद्यार्थी शुल्क रसिद (+ Receipt)</MenuItem>
                    <MenuItem value="PAYOUT">प्रशिक्षक निकासा भौचर (- Payout)</MenuItem>
                  </TextField>
                </Box>
              </Box>

              <TableContainer sx={{ maxHeight: 620 }}>
                <Table stickyHeader>
                  <TableHead
                    sx={{
                      bgcolor: '#0F2E5A',
                      '& .MuiTableCell-head': {
                        bgcolor: '#0F2E5A !important',
                        color: '#FFFFFF !important',
                        fontWeight: 900,
                        fontSize: '0.84rem',
                        py: 1.5,
                        borderBottom: '2px solid #F59E0B'
                      }
                    }}
                  >
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 65, textAlign: 'center' }}>
                        क्र.सं. (S.N.)
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>रसिद / भौचर नं.</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>प्रकार</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>सम्बन्धित व्यक्ति</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>रकम (Rs.)</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>माध्यम</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>मिति</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>कैफियत</TableCell>
                      <TableCell align="right" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>प्रिन्ट</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {combinedTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#94A3B8' }}>
                          कुनै कारोबार फेला परेन।
                        </TableCell>
                      </TableRow>
                    ) : (
                      combinedTransactions.map((tx, idx) => (
                        <TableRow key={tx.id} hover>
                          <TableCell sx={{ fontWeight: 800, textAlign: 'center', color: '#64748B', width: 65 }}>
                            {idx + 1}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: tx.isInflow ? '#1E40AF' : '#B45309' }}>
                            {tx.refNo}
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={tx.isInflow ? 'शुल्क संकलन (+ Inflow)' : 'पारिश्रमिक (- Outflow)'}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.7rem',
                                bgcolor: tx.isInflow ? '#ECFDF5' : '#FEF3C7',
                                color: tx.isInflow ? '#047857' : '#92400E'
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{tx.name}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>{tx.sub}</Typography>
                          </TableCell>

                          <TableCell sx={{ fontWeight: 900, color: tx.isInflow ? '#059669' : '#B45309', fontSize: '0.95rem' }}>
                            {tx.isInflow ? '+' : '-'} Rs. {Number(tx.amount).toLocaleString()}
                          </TableCell>

                          <TableCell sx={{ fontSize: '0.8rem' }}>{tx.method}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{tx.date}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{tx.remarks || '-'}</TableCell>

                          <TableCell align="right">
                            {tx.isInflow ? (
                              <Tooltip title="रसिद प्रिन्ट गर्नुहोस्">
                                <IconButton
                                  size="small"
                                  onClick={() => setSelectedReceiptPayment(tx.rawObj)}
                                  sx={{ color: '#0284C7' }}
                                >
                                  <PrintIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Chip label="Voucher" size="small" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </Box>
      )}

      {/* ======================================================== */}
      {/* MODALS                                                   */}
      {/* ======================================================== */}

      {/* 1. Record Student Payment Modal */}
      <RecordPaymentModal
        open={openCollectModal}
        onClose={() => setOpenCollectModal(false)}
        onSavePayment={handleSavePayment}
        db={db}
        preselectedStudentId={preselectedStudentId}
      />

      {/* 2. Trainer Payout Modal */}
      <TrainerPayoutModal
        open={openPayoutModal}
        onClose={() => setOpenPayoutModal(false)}
        onSavePayout={handleSavePayout}
        db={db}
        preselectedTrainerId={preselectedTrainerId}
      />

      {/* 3. Printable Receipt Modal (A4 & Thermal POS 80mm) */}
      <ReceiptModal
        open={Boolean(selectedReceiptPayment)}
        onClose={() => setSelectedReceiptPayment(null)}
        payment={selectedReceiptPayment}
        student={students.find((s) => s.id === selectedReceiptPayment?.studentId)}
        group={groups.find((g) => g.id === selectedReceiptPayment?.groupId)}
        course={courses.find((c) => c.title === selectedReceiptPayment?.courseName)}
        settings={db.settings}
      />

      {/* 4. Daily Counter Cash Closing Modal */}
      <DailyCashClosingModal
        open={openCashClosingModal}
        onClose={() => setOpenCashClosingModal(false)}
        db={db}
        setDb={setDb}
        showToast={showToast}
      />

      {/* 5. Official Fee Clearance Certificate Receipt Modal */}
      <FeeClearanceReceiptModal
        open={Boolean(clearanceStudent && clearanceLedger)}
        onClose={() => {
          setClearanceStudent(null);
          setClearanceLedger(null);
        }}
        student={clearanceStudent}
        ledger={clearanceLedger}
        payments={payments}
      />

      {/* 6. Student Payment Timeline Modal */}
      <StudentPaymentTimelineModal
        open={Boolean(timelineStudent)}
        onClose={() => setTimelineStudent(null)}
        student={timelineStudent?.student}
        ledger={timelineStudent?.ledger}
        payments={payments}
        onCollectDue={(stdId) => {
          setPreselectedStudentId(stdId);
          setOpenCollectModal(true);
        }}
        onOpenClearanceCertificate={(st, l) => {
          setClearanceStudent(st);
          setClearanceLedger(l);
        }}
      />

      {/* 7. Universal 12-Month Financial Statement Modal */}
      <UniversalStatementModal
        open={universalStatementOpen}
        onClose={() => setUniversalStatementOpen(false)}
        db={db}
        initialEntityType={statementType}
        initialEntityId={statementTargetId}
      />

      {/* 8. ConnectIPS Direct Bank Payout Modal */}
      <ConnectIpsPayoutModal
        open={connectIpsModalOpen}
        onClose={() => setConnectIpsModalOpen(false)}
        party={connectIpsParty}
        db={db}
        setDb={setDb}
        onSuccess={() => {
          setConnectIpsModalOpen(false);
          setDb(loadDB());
          showToast('ConnectIPS भुक्तानी तथा बैंक भौचर सफलतापूर्वक सम्पन्न भयो।');
        }}
      />

      {/* Snackbar Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ fontWeight: 700, borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
