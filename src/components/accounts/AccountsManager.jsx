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
import DayOpenModal from './DayOpenModal';
import CashToBankModal from './CashToBankModal';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import BalanceIcon from '@mui/icons-material/Balance';
import BusinessIcon from '@mui/icons-material/Business';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArticleIcon from '@mui/icons-material/Article';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import PercentIcon from '@mui/icons-material/Percent';
import PaymentIcon from '@mui/icons-material/Payment';

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
  const [openDayOpenModal, setOpenDayOpenModal] = useState(false);
  const [openCashToBankModal, setOpenCashToBankModal] = useState(false);
  const [openCollectModal, setOpenCollectModal] = useState(false);
  const [openPayoutModal, setOpenPayoutModal] = useState(false);
  const [openCashClosingModal, setOpenCashClosingModal] = useState(false);
  const [selectedClosingToView, setSelectedClosingToView] = useState(null);
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

  // Tab 1: Student Specific Metrics
  const studentMetrics = useMemo(() => {
    let totalLocked = 0;
    let totalCollected = 0;
    let totalDue = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let paidCount = 0;

    students.forEach((st) => {
      const l = getStudentLedger(st);
      totalLocked += l.lockedFee;
      totalCollected += l.totalPaid;
      totalDue += l.due;
      if (l.isOverdue) {
        overdueCount++;
        overdueAmount += l.due;
      }
      if (l.paymentStatus === 'Paid') {
        paidCount++;
      }
    });

    const paidPercent = students.length > 0 ? Math.round((paidCount / students.length) * 100) : 0;
    return { totalLocked, totalCollected, totalDue, overdueCount, overdueAmount, paidCount, paidPercent };
  }, [students, payments, groups, courses]);

  // Tab 2: Party & Landlord Specific Metrics
  const partyMetrics = useMemo(() => {
    const partyList = db.parties || [];
    const landlord = partyList.find((p) => p.category === 'LANDLORD' || p.type === 'LANDLORD');
    const monthlyRent = Number(landlord?.monthlyRent) || 50000;
    const tdsRate = Number(landlord?.tdsPercent) || 10;
    const tdsAmount = Math.round(monthlyRent * (tdsRate / 100));
    const deposit = Number(landlord?.securityDeposit) || 150000;

    const suppliers = partyList.filter((p) => p.category !== 'LANDLORD' && p.type !== 'LANDLORD');
    const supplierDue = suppliers.reduce((sum, p) => sum + (Number(p.currentDue) || 0), 0);
    const totalDue = partyList.reduce((sum, p) => sum + (Number(p.currentDue) || 0), 0);

    return { monthlyRent, tdsAmount, deposit, supplierDue, totalDue };
  }, [db.parties]);

  // Tab 3: Trainer Payroll Specific Metrics
  const trainerMetrics = useMemo(() => {
    let totalEarned = 0;
    let totalPaid = 0;
    let totalDue = 0;

    trainers.forEach((trn) => {
      const l = getTrainerLedger(trn);
      totalEarned += l.totalEarned;
      totalPaid += l.totalPaid;
      totalDue += l.balanceDue;
    });

    const commPercents = groups.map((g) => Number(g.trainerCommissionPercent) || 25);
    const avgComm = commPercents.length > 0 ? Math.round(commPercents.reduce((a, b) => a + b, 0) / commPercents.length) : 25;

    return { totalEarned, totalPaid, totalDue, avgComm };
  }, [trainers, groups, payments, trainerPayouts]);

  // Tab 4: Accounting Hub Specific Metrics
  const accountingMetrics = useMemo(() => {
    const totalExpenses = (db.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const bankAcc = (db.chartOfAccounts || []).find((a) => a.code === '1020');
    const cashAcc = (db.chartOfAccounts || []).find((a) => a.code === '1010');
    const bankBalance = bankAcc?.balance || 1425000;
    const cashInHand = cashAcc?.balance || 44000;
    const journalCount = (db.journalEntries || []).length || 8;
    const projectTotal = (db.projectContracts || []).reduce((sum, c) => sum + (Number(c.contractValue) || 0), 0) || 450000;

    return { totalExpenses, bankBalance, cashInHand, journalCount, projectTotal };
  }, [db.expenses, db.chartOfAccounts, db.journalEntries, db.projectContracts]);

  // Live Cash in Hand and Live Bank Balance Calculation
  const { liveCashInHand, liveBankBalance } = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const opening = db?.counterStatus?.openingCash ?? 44000;

    // Today's physical cash inflows
    const cashIn = (db.payments || [])
      .filter((p) => (p.paymentDate === todayStr || (p.createdAt || '').slice(0, 10) === todayStr) && p.paymentMethod?.toLowerCase().includes('cash'))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Today's physical cash outflows
    const cashOut = (db.expenses || [])
      .filter((e) => e.date === todayStr && e.paymentMethod?.toLowerCase().includes('cash'))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Today's cash deposited to bank (contra)
    const bankDeposits = (db.transactions || [])
      .filter((t) => (t.date === todayStr || (t.createdAt || '').slice(0, 10) === todayStr) && t.type === 'BANK_DEPOSIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const liveCash = Math.max(0, opening + cashIn - cashOut - bankDeposits);

    // Live bank balance
    const bankAcc = (db.chartOfAccounts || []).find((a) => a.code === '1020');
    const baseBank = bankAcc?.balance || 1425000;

    const digitalIn = (db.payments || [])
      .filter((p) => p.paymentMethod && !p.paymentMethod.toLowerCase().includes('cash'))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const digitalOut = (db.trainerPayouts || [])
      .filter((tp) => tp.paymentMethod && !tp.paymentMethod.toLowerCase().includes('cash'))
      .reduce((sum, tp) => sum + (Number(tp.amount) || 0), 0);

    const liveBank = baseBank + digitalIn - digitalOut + bankDeposits;

    return { liveCashInHand: liveCash, liveBankBalance: liveBank };
  }, [db.counterStatus, db.payments, db.expenses, db.transactions, db.chartOfAccounts, db.trainerPayouts]);

  // Dynamic Context-Aware KPI Cards for the Active Tab
  const currentKpis = useMemo(() => {
    switch (activeTab) {
      case 1: // Trainee Fees Tab
        return [
          {
            title: 'कुल लक्ड शुल्क',
            amount: `Rs. ${studentMetrics.totalLocked.toLocaleString()}`,
            sub: `${students.length} जना विद्यार्थीको कुल शुल्क`,
            color: '#0F2E5A',
            icon: <SchoolIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#EFF6FF'
          },
          {
            title: 'संकलित किस्ता',
            amount: `Rs. ${studentMetrics.totalCollected.toLocaleString()}`,
            sub: 'रसिद जारी भई प्राप्त रकम',
            color: '#059669',
            icon: <TrendingUpIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#ECFDF5'
          },
          {
            title: 'उठ्न बाँकी किस्ता',
            amount: `Rs. ${studentMetrics.totalDue.toLocaleString()}`,
            sub: 'विद्यार्थीहरूले बुझाउन बाँकी',
            color: '#D97706',
            icon: <AccessTimeIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#FFFBEB'
          },
          {
            title: 'म्याद नाघेको किस्ता',
            amount: `Rs. ${studentMetrics.overdueAmount.toLocaleString()}`,
            sub: `${studentMetrics.overdueCount} जना विद्यार्थी (>३० दिन)`,
            color: '#DC2626',
            icon: <ErrorOutlineIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#FEF2F2'
          },
          {
            title: 'शुल्क चुक्ता विद्यार्थी',
            amount: `${studentMetrics.paidCount} जना (${studentMetrics.paidPercent}%)`,
            sub: 'सम्पन्न प्रमाणपत्र जारी योग्य',
            color: '#10B981',
            icon: <CheckCircleIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#ECFDF5'
          }
        ];
      case 2: // Parties & Landlords Tab
        return [
          {
            title: 'मासिक घरभाडा देय',
            amount: `Rs. ${partyMetrics.monthlyRent.toLocaleString()}`,
            sub: '१ गते स्वतः बिलिङ हुने रकम',
            color: '#0F2E5A',
            icon: <HomeWorkIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#EFF6FF'
          },
          {
            title: 'आपूर्तिकर्ता बाँकी',
            amount: `Rs. ${partyMetrics.supplierDue.toLocaleString()}`,
            sub: 'कच्चा पदार्थ तथा स्टेशनरी उधारो',
            color: '#D97706',
            icon: <StorefrontIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#FFFBEB'
          },
          {
            title: 'अग्रिम धरौटी (Deposit)',
            amount: `Rs. ${partyMetrics.deposit.toLocaleString()}`,
            sub: 'फिर्ता हुने घरभाडा सेक्युरिटी',
            color: '#2563EB',
            icon: <AccountBalanceWalletIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#EFF6FF'
          },
          {
            title: '१०% TDS कट्टी रकम',
            amount: `Rs. ${partyMetrics.tdsAmount.toLocaleString()}`,
            sub: 'आन्तरिक राजस्व दाखिला हुने',
            color: '#0D9488',
            icon: <ReceiptLongIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#CCFBF1'
          },
          {
            title: 'कुल पार्टी दायित्व',
            amount: `Rs. ${partyMetrics.totalDue.toLocaleString()}`,
            sub: 'ConnectIPS बाट भुक्तानी योग्य',
            color: '#DC2626',
            icon: <PaymentIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#FEF2F2'
          }
        ];
      case 3: // Trainer Payroll Tab
        return [
          {
            title: 'कुल प्रशिक्षक संख्या',
            amount: `${trainers.length} जना`,
            sub: 'तलब तथा कमिसन प्रशिक्षकहरू',
            color: '#0F2E5A',
            icon: <PersonIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#EFF6FF'
          },
          {
            title: 'पाकेको पारिश्रमिक',
            amount: `Rs. ${trainerMetrics.totalEarned.toLocaleString()}`,
            sub: 'संकलित शुल्कमा आधारित कमिसन',
            color: '#B45309',
            icon: <TrendingUpIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#FEF3C7'
          },
          {
            title: 'हालसम्म निकासा',
            amount: `Rs. ${trainerMetrics.totalPaid.toLocaleString()}`,
            sub: 'भौचर जारी गरी भुक्तानी भएको',
            color: '#059669',
            icon: <CheckCircleIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#ECFDF5'
          },
          {
            title: 'दिन बाँकी बक्यौता',
            amount: `Rs. ${trainerMetrics.totalDue.toLocaleString()}`,
            sub: 'प्रशिक्षकलाई निकासा हुन बाँकी',
            color: '#DC2626',
            icon: <PaymentsIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#FEF2F2'
          },
          {
            title: 'औसत कमिसन दर',
            amount: `${trainerMetrics.avgComm}% प्रति ब्याच`,
            sub: 'ब्याच शुल्क संकलनमा आधारित',
            color: '#7C3AED',
            icon: <PercentIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#F5F3FF'
          }
        ];
      case 4: // Accounting Hub Tab
        return [
          {
            title: 'कुल चालु खर्च',
            amount: `Rs. ${accountingMetrics.totalExpenses.toLocaleString()}`,
            sub: 'सञ्चालन तथा प्रशासनिक खर्च',
            color: '#DC2626',
            icon: <TrendingDownIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#FEF2F2'
          },
          {
            title: 'बैंक मौज्दात (A/C 1020)',
            amount: `Rs. ${accountingMetrics.bankBalance.toLocaleString()}`,
            sub: 'नबिल / ग्लोबल आइएमई बैंक',
            color: '#059669',
            icon: <AccountBalanceIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#ECFDF5'
          },
          {
            title: 'काउन्टर क्यास (A/C 1010)',
            amount: `Rs. ${accountingMetrics.cashInHand.toLocaleString()}`,
            sub: 'दैनिक काउन्टर नगद मौज्दात',
            color: '#2563EB',
            icon: <PointOfSaleIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#EFF6FF'
          },
          {
            title: 'दोहोरो लेखा प्रविष्टि',
            amount: `${accountingMetrics.journalCount} भौचरहरू`,
            sub: 'सन्तुलित डेबिट-क्रेडिट जर्नल',
            color: '#0F2E5A',
            icon: <ReceiptLongIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#EFF6FF'
          },
          {
            title: 'प्रोजेक्ट सम्झौता रकम',
            amount: `Rs. ${accountingMetrics.projectTotal.toLocaleString()}`,
            sub: 'नगरपालिका / संघसंस्था अनुदान',
            color: '#B45309',
            icon: <BusinessIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#FEF3C7'
          }
        ];
      case 0: // Overview Default
      default:
        return [
          {
            title: 'कुल संकलित शुल्क',
            amount: `Rs. ${metrics.totalFeeCollected.toLocaleString()}`,
            sub: 'नगद तथा अनलाइन रसिद प्राप्ति',
            color: '#059669',
            icon: <TrendingUpIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#ECFDF5'
          },
          {
            title: 'उठ्न बाँकी बक्यौता',
            amount: `Rs. ${metrics.totalPendingDues.toLocaleString()}`,
            sub: 'दोस्रो किस्ता बाँकी रकम',
            color: '#D97706',
            icon: <AccessTimeIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#FFFBEB'
          },
          {
            title: 'म्याद नाघेको बक्यौता',
            amount: `Rs. ${metrics.totalOverdueAmount.toLocaleString()}`,
            sub: `${metrics.overdueCount} जना विद्यार्थीको म्याद कट्यो`,
            color: '#DC2626',
            icon: <ErrorOutlineIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#FEF2F2'
          },
          {
            title: 'प्रशिक्षक निकासा',
            amount: `Rs. ${metrics.totalTrainerDisbursed.toLocaleString()}`,
            sub: 'कमिसन तथा मासिक पारिश्रमिक',
            color: '#B45309',
            icon: <PaymentsIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#FEF3C7'
          },
          {
            title: 'खुद संस्था बचत',
            amount: `Rs. ${metrics.netMargin.toLocaleString()}`,
            sub: 'निकासा पछिको कुल बचत रकम',
            color: '#0F2E5A',
            icon: <AccountBalanceWalletIcon sx={{ fontSize: '1rem' }} />,
            bgBadge: '#EFF6FF'
          }
        ];
    }
  }, [activeTab, metrics, studentMetrics, partyMetrics, trainerMetrics, accountingMetrics, students.length, trainers.length]);

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
              
              {/* Counter Open / Closed Status Badge */}
              {db?.counterStatus?.isOpen !== false ? (
                <Tooltip title={`काउन्टर सुरु मिति: ${db?.counterStatus?.openedDate || 'आज'} • क्यासियर: ${db?.counterStatus?.openedBy || 'सुनिता शर्मा'}`}>
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
                </Tooltip>
              ) : (
                <Tooltip title="काउन्टर अहिले बन्द छ। नयाँ कारोबारका लागि पहिले दिन सुरु गर्नुहोस्।">
                  <Chip
                    label="🔴 काउन्टर बन्द • FY 2081/82"
                    size="small"
                    sx={{
                      bgcolor: '#FEF2F2',
                      color: '#991B1B',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      border: '1px solid #FECACA',
                      height: 24
                    }}
                  />
                </Tooltip>
              )}

              {/* Live Physical Cash in Hand Badge */}
              <Tooltip title="काउन्टर दराजमा रहेको वास्तविक नगद मौज्दात (A/C 1010)">
                <Chip
                  icon={<PointOfSaleIcon sx={{ fontSize: '0.88rem !important', color: '#059669 !important' }} />}
                  label={`दराज नगद: Rs. ${liveCashInHand.toLocaleString()}`}
                  size="small"
                  sx={{
                    bgcolor: '#F0FDF4',
                    color: '#065F46',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    border: '1px solid #BBF7D0',
                    height: 24
                  }}
                />
              </Tooltip>

              {/* Live Bank Balance Badge */}
              <Tooltip title="ग्लोबल आइएमई तथा नबिल बैंक खाता मौज्दात (A/C 1020)">
                <Chip
                  icon={<AccountBalanceIcon sx={{ fontSize: '0.88rem !important', color: '#1E40AF !important' }} />}
                  label={`बैंक मौज्दात: Rs. ${liveBankBalance.toLocaleString()}`}
                  size="small"
                  sx={{
                    bgcolor: '#EFF6FF',
                    color: '#1E40AF',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    border: '1px solid #BFDBFE',
                    height: 24
                  }}
                />
              </Tooltip>
            </Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
              ग्लोबल एरा वित्तीय तथा शुल्क व्यवस्थापन • किस्ता संकलन, ConnectIPS भुक्तानी, घरबेटी/पार्टी लेजर तथा अडिट हब
            </Typography>
          </Box>
        </Box>

        {/* Right: Compact Professional 1-Line Action Bar */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          sx={{
            justifyContent: { xs: 'flex-start', lg: 'flex-end' }
          }}
        >
          {/* Day Open Button when Counter is Closed */}
          {db?.counterStatus?.isOpen === false ? (
            <Button
              variant="contained"
              size="small"
              onClick={() => setOpenDayOpenModal(true)}
              startIcon={<LockOpenIcon sx={{ fontSize: '1.05rem !important' }} />}
              sx={{
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#FFFFFF',
                fontWeight: 900,
                borderRadius: 2.2,
                px: 2,
                py: 0.8,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                textTransform: 'none',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap'
              }}
            >
              🔓 दिन सुरु (Day Open)
            </Button>
          ) : (
            <>
              {/* Primary Actions when Counter is Open */}
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setPreselectedStudentId(null);
                  setOpenCollectModal(true);
                }}
                startIcon={<PointOfSaleIcon sx={{ fontSize: '1.05rem !important' }} />}
                sx={{
                  background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  borderRadius: 2.2,
                  px: 1.8,
                  py: 0.75,
                  boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                  textTransform: 'none',
                  fontSize: '0.82rem',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }
                }}
              >
                + शुल्क संकलन
              </Button>

              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  const defaultParty = (db.parties || []).find((p) => p.type === 'LANDLORD') || (db.parties || [])[0];
                  setConnectIpsParty(defaultParty || null);
                  setConnectIpsModalOpen(true);
                }}
                startIcon={<AccountBalanceIcon sx={{ fontSize: '1.05rem !important' }} />}
                sx={{
                  background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  borderRadius: 2.2,
                  px: 1.8,
                  py: 0.75,
                  boxShadow: '0 3px 10px rgba(15, 46, 90, 0.3)',
                  textTransform: 'none',
                  fontSize: '0.82rem',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0A1E3B 0%, #0F2E5A 100%)',
                    boxShadow: '0 4px 14px rgba(15, 46, 90, 0.4)'
                  }
                }}
              >
                + भुक्तानी
              </Button>

              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setPreselectedTrainerId(null);
                  setOpenPayoutModal(true);
                }}
                startIcon={<PaymentsIcon sx={{ fontSize: '1.05rem !important' }} />}
                sx={{
                  background: 'linear-gradient(135deg, #78350F 0%, #B45309 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  borderRadius: 2.2,
                  px: 1.8,
                  py: 0.75,
                  boxShadow: '0 3px 10px rgba(180, 83, 9, 0.3)',
                  textTransform: 'none',
                  fontSize: '0.82rem',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #592507 0%, #78350F 100%)'
                  }
                }}
              >
                + निकासा
              </Button>

              {/* Bank Deposit Contra Button */}
              <Tooltip title="काउन्टरको नगद बैंकमा दाखिला गर्नुहोस् (Contra Entry)">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setOpenCashToBankModal(true)}
                  startIcon={<AccountBalanceIcon sx={{ fontSize: '0.95rem !important', color: '#1E40AF' }} />}
                  sx={{
                    fontWeight: 800,
                    borderRadius: 2,
                    borderColor: '#93C5FD',
                    color: '#1E40AF',
                    bgcolor: '#EFF6FF',
                    textTransform: 'none',
                    fontSize: '0.78rem',
                    py: 0.65,
                    px: 1.4,
                    whiteSpace: 'nowrap',
                    '&:hover': { bgcolor: '#DBEAFE', borderColor: '#3B82F6' }
                  }}
                >
                  🏦 बैंक दाखिला
                </Button>
              </Tooltip>

              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, my: 0.5, borderColor: '#CBD5E1' }} />

              {/* Cash Closing */}
              <Button
                size="small"
                variant="outlined"
                onClick={() => setOpenCashClosingModal(true)}
                startIcon={<LockIcon sx={{ fontSize: '0.95rem !important' }} />}
                sx={{
                  fontWeight: 800,
                  borderRadius: 2,
                  borderColor: '#CBD5E1',
                  color: '#334155',
                  bgcolor: '#F8FAFC',
                  textTransform: 'none',
                  fontSize: '0.78rem',
                  py: 0.65,
                  px: 1.4,
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' }
                }}
              >
                🔒 क्यास क्लोजिङ
              </Button>
            </>
          )}

          {/* 2 Utility Tools (Always Available) */}
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setStatementType(activeTab === 2 ? 'LANDLORD' : activeTab === 3 ? 'TRAINER' : activeTab === 1 ? 'STUDENT' : 'LANDLORD');
              setUniversalStatementOpen(true);
            }}
            startIcon={<ArticleIcon sx={{ fontSize: '0.95rem !important' }} />}
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              borderColor: '#CBD5E1',
              color: '#0F2E5A',
              bgcolor: '#F8FAFC',
              textTransform: 'none',
              fontSize: '0.78rem',
              py: 0.65,
              px: 1.4,
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' }
            }}
          >
            📜 स्टेटमेन्ट
          </Button>

          <Button
            size="small"
            variant="outlined"
            onClick={handleExportExcel}
            startIcon={<FileDownloadIcon sx={{ fontSize: '0.95rem !important' }} />}
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              borderColor: '#CBD5E1',
              color: '#334155',
              bgcolor: '#F8FAFC',
              textTransform: 'none',
              fontSize: '0.78rem',
              py: 0.65,
              px: 1.4,
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' }
            }}
          >
            📊 एक्सेल
          </Button>
        </Stack>
      </Box>

      {/* Top Financial KPI Summary Cards (Dynamic Context-Aware for each Tab!) */}
      <Grid container spacing={2.2} sx={{ mb: 3.5 }}>
        {currentKpis.map((kpi, idx) => (
          <Grid item xs={12} sm={6} md={2.4} key={idx}>
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: 3.5,
                border: '1px solid #E2E8F0',
                borderLeft: `5px solid ${kpi.color}`,
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
                  {kpi.title}
                </Typography>
                <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: kpi.bgBadge, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {kpi.icon}
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: kpi.color, my: 0.5, fontSize: '1.42rem' }}>
                {kpi.amount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {kpi.sub}
              </Typography>
            </Paper>
          </Grid>
        ))}
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

                            <Tooltip title="विद्यार्थी किस्ता लेजर (Fee Statement / Passbook)">
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

                  {/* Action Buttons */}
                  <Stack direction="row" spacing={1}>
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
                      पारिश्रमिक निकासा (Pay)
                    </Button>
                    <Tooltip title="प्रशिक्षक पारिश्रमिक तथा कमिसन लेजर">
                      <IconButton
                        onClick={() => {
                          setStatementType('TRAINER');
                          setStatementTargetId(trn.id);
                          setUniversalStatementOpen(true);
                        }}
                        sx={{
                          border: '1.5px solid #CBD5E1',
                          borderRadius: 2,
                          color: '#0F2E5A',
                          bgcolor: '#F8FAFC',
                          px: 1.2,
                          '&:hover': { bgcolor: '#F1F5F9' }
                        }}
                      >
                        <ArticleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
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
              { label: `कारोबार अडिट लग (${payments.length + trainerPayouts.length})`, icon: <ArticleIcon fontSize="small" /> },
              { label: `दैनिक क्लोजिङ लग (${(db.cashClosings || []).length})`, icon: <LockIcon fontSize="small" /> }
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

          {/* Sub-view 6: Daily Cash Closing & Denomination Audit History */}
          {accountingSubTab === 6 && (
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
                  p: 2.2,
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: '#F8FAFC'
                }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A' }}>
                    दैनिक काउन्टर नगद क्लोजिङ तथा नोट अडिट लग (Daily Cash Closings History)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    दैनिक दराज नगद गन्ती, नोट विवरण (Denominations) तथा रुजु स्थिति
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setOpenCashClosingModal(true)}
                  startIcon={<LockIcon />}
                  sx={{
                    bgcolor: '#0F2E5A',
                    fontWeight: 800,
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  🔒 आजको क्यास क्लोजिङ गर्नुहोस्
                </Button>
              </Box>

              <TableContainer sx={{ maxHeight: 620 }}>
                <Table stickyHeader size="small">
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
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>क्लोजिङ मिति / समय</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>सुरु मौज्दात</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>नगद संकलन (+)</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>नगद खर्च (-)</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>हुनुपर्ने अन्तिम</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>भौतिक नगद (Count)</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>नोट गणना (Denominations)</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>रुजु स्थिति</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>क्यासियर</TableCell>
                      <TableCell align="right" sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>स्लिप</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(db.cashClosings || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} align="center" sx={{ py: 6, color: '#94A3B8' }}>
                          अहिलेसम्म कुनै दैनिक क्यास क्लोजिङ रेकर्ड फेला परेन।
                        </TableCell>
                      </TableRow>
                    ) : (
                      (db.cashClosings || []).map((c, idx) => {
                        const den = c.denominations || {};
                        const denText = [
                          den['1000'] ? `1000×${den['1000']}` : null,
                          den['500'] ? `500×${den['500']}` : null,
                          den['100'] ? `100×${den['100']}` : null,
                          den['50'] ? `50×${den['50']}` : null,
                          den['20'] ? `20×${den['20']}` : null,
                          den['10'] ? `10×${den['10']}` : null,
                          den['5'] ? `5×${den['5']}` : null,
                          den['coins'] ? `खुद्रा:${den['coins']}` : null
                        ].filter(Boolean).join(', ') || '-';

                        return (
                          <TableRow key={c.id || idx} hover>
                            <TableCell sx={{ fontWeight: 800, textAlign: 'center', color: '#64748B', width: 65 }}>
                              {idx + 1}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                              {c.closingDate} {c.closingTime ? `(${c.closingTime})` : ''}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>
                              Rs. {Number(c.openingBalance || 0).toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#059669' }}>
                              +Rs. {Number(c.cashReceived || 0).toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#DC2626' }}>
                              -Rs. {Number(c.cashPaid || 0).toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#1E40AF' }}>
                              Rs. {Number(c.expectedClosing || 0).toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 900, color: '#0F2E5A', fontSize: '0.92rem' }}>
                              Rs. {Number(c.physicalCount || 0).toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#475569', maxWidth: 180 }}>
                              <Tooltip title={denText}>
                                <Typography variant="caption" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {denText}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={c.variance === 0 ? '✓ मिलेको' : c.variance > 0 ? `+${c.variance}` : `${c.variance}`}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: '0.68rem',
                                  bgcolor: c.variance === 0 ? '#ECFDF5' : c.variance > 0 ? '#EFF6FF' : '#FEF2F2',
                                  color: c.variance === 0 ? '#065F46' : c.variance > 0 ? '#1D4ED8' : '#DC2626'
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.78rem', color: '#475569' }}>
                              {c.closedBy || 'Cashier'}
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="क्लोजिङ स्लिप हेर्नुहोस्">
                                <IconButton
                                  size="small"
                                  onClick={() => setOpenCashClosingModal(true)}
                                  sx={{ color: '#0F2E5A', bgcolor: '#F1F5F9' }}
                                >
                                  <ArticleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
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
        </Box>
      )}

      {/* ======================================================== */}
      {/* MODALS                                                   */}
      {/* ======================================================== */}

      {/* 0. Day Open Counter Modal */}
      <DayOpenModal
        open={openDayOpenModal}
        onClose={() => setOpenDayOpenModal(false)}
        db={db}
        setDb={setDb}
        showToast={showToast}
        onDayOpened={() => {
          setDb(loadDB());
        }}
      />

      {/* 0.1 Cash To Bank Deposit Contra Modal */}
      <CashToBankModal
        open={openCashToBankModal}
        onClose={() => setOpenCashToBankModal(false)}
        db={db}
        setDb={setDb}
        showToast={showToast}
        currentCashInHand={liveCashInHand}
      />

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

      {/* 4. Daily Counter Cash Closing Modal with Denomination & Print */}
      <DailyCashClosingModal
        open={openCashClosingModal}
        onClose={() => setOpenCashClosingModal(false)}
        db={db}
        setDb={setDb}
        showToast={showToast}
        onDayClosed={() => {
          setDb(loadDB());
        }}
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
