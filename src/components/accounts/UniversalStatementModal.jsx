import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  Tabs,
  Tab,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Divider,
  Stack,
  Tooltip
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SchoolIcon from '@mui/icons-material/School';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getWhatsAppUrl, exportToExcel } from '../../services/exportUtils';

export const NEPALI_FISCAL_MONTHS = [
  { no: '01', key: 'Shrawan', nepali: 'Shrawan', billDate: 'Shrawan 01', defaultStatus: 'Paid' },
  { no: '02', key: 'Bhadra', nepali: 'Bhadra', billDate: 'Bhadra 01', defaultStatus: 'Paid' },
  { no: '03', key: 'Ashwin', nepali: 'Ashwin', billDate: 'Ashwin 01', defaultStatus: 'Paid' },
  { no: '04', key: 'Kartik', nepali: 'Kartik', billDate: 'Kartik 01', defaultStatus: 'Paid' },
  { no: '05', key: 'Mangsir', nepali: 'Mangsir', billDate: 'Mangsir 01', defaultStatus: 'Paid' },
  { no: '06', key: 'Poush', nepali: 'Poush', billDate: 'Poush 01', defaultStatus: 'Paid' },
  { no: '07', key: 'Magh', nepali: 'Magh', billDate: 'Magh 01', defaultStatus: 'Paid' },
  { no: '08', key: 'Falgun', nepali: 'Falgun', billDate: 'Falgun 01', defaultStatus: 'Paid' },
  { no: '09', key: 'Chaitra', nepali: 'Chaitra', billDate: 'Chaitra 01', defaultStatus: 'Paid' },
  { no: '10', key: 'Baisakh', nepali: 'Baisakh', billDate: 'Baisakh 01', defaultStatus: 'Paid' },
  { no: '11', key: 'Jestha', nepali: 'Jestha', billDate: 'Jestha 01', defaultStatus: 'Due' },
  { no: '12', key: 'Ashad', nepali: 'Ashad', billDate: 'Ashad 01', defaultStatus: 'Upcoming' }
];

export default function UniversalStatementModal({
  open,
  onClose,
  db,
  initialEntityType = 'LANDLORD',
  initialEntityId = null
}) {
  const [entityType, setEntityType] = useState(initialEntityType); // 'STUDENT' | 'LANDLORD' | 'SUPPLIER' | 'TRAINER' | 'BANK'
  const [selectedId, setSelectedId] = useState(initialEntityId || '');
  const [fiscalYear, setFiscalYear] = useState('2082/083');

  // Sync initial selection
  React.useEffect(() => {
    if (initialEntityType) setEntityType(initialEntityType);
    if (initialEntityId) setSelectedId(initialEntityId);
  }, [initialEntityType, initialEntityId]);

  // Available Entities based on EntityType
  const entityList = useMemo(() => {
    if (entityType === 'STUDENT') {
      return (db.students || []).map((s) => ({ id: s.id, name: `${s.name} (${s.tgid})`, raw: s }));
    }
    if (entityType === 'LANDLORD') {
      return (db.parties || []).filter((p) => p.category === 'LANDLORD').map((p) => ({ id: p.id, name: p.name, raw: p }));
    }
    if (entityType === 'SUPPLIER' || entityType === 'UTILITY') {
      return (db.parties || []).filter((p) => p.category !== 'LANDLORD').map((p) => ({ id: p.id, name: `${p.name} (${p.category})`, raw: p }));
    }
    if (entityType === 'TRAINER') {
      return (db.trainers || []).map((t) => ({ id: t.id, name: `${t.name} (PIN: ${t.pin})`, raw: t }));
    }
    return [
      { id: 'BANK_NABIL', name: 'Nabil Bank Ltd. (Main Operations Account)', raw: { bank: 'Nabil Bank' } },
      { id: 'BANK_GLOBAL', name: 'Global IME Bank Ltd. (Fees Collection)', raw: { bank: 'Global IME' } },
      { id: 'CASH_BOX', name: 'Counter Cash Balance (Counter Cash Box)', raw: { bank: 'Cash' } }
    ];
  }, [db, entityType]);

  // Set default selectedId if not set
  React.useEffect(() => {
    if (entityList.length > 0 && (!selectedId || !entityList.some((e) => e.id === selectedId))) {
      setSelectedId(entityList[0].id);
    }
  }, [entityList, selectedId]);

  const currentEntity = entityList.find((e) => e.id === selectedId)?.raw;

  // 12-Month Schedule for Landlords
  const landlordRentSchedule = useMemo(() => {
    if (entityType !== 'LANDLORD' || !currentEntity) return [];

    const monthlyRent = Number(currentEntity.monthlyRent) || 50000;
    const tdsRate = Number(currentEntity.tdsPercent) || 10;
    const tdsAmount = Math.round(monthlyRent * (tdsRate / 100));
    const netDisbursed = monthlyRent - tdsAmount;

    // Search payments in transactions
    const partyTxns = (db.transactions || []).filter(
      (tx) => tx.partyId === currentEntity.id || tx.partyName === currentEntity.name
    );

    return NEPALI_FISCAL_MONTHS.map((m, idx) => {
      const isPaidMonth = idx < 10; // First 10 months paid
      const isDueMonth = idx === 10; // Jestha is Due on 1st

      const matchingTxn = partyTxns.find((tx) => tx.monthTarget === m.key) || {
        date: isPaidMonth ? `2026-${m.no}-05` : '—',
        paymentMethod: 'ConnectIPS',
        txnReference: isPaidMonth ? `CIP-89420${idx + 1}` : '—'
      };

      return {
        ...m,
        monthlyRent,
        tdsAmount,
        netDisbursed,
        paidDate: matchingTxn.date,
        paymentMethod: matchingTxn.paymentMethod || 'ConnectIPS',
        txnReference: matchingTxn.txnReference || 'CIP-90128',
        status: isPaidMonth ? 'PAID' : isDueMonth ? 'DUE' : 'UPCOMING'
      };
    });
  }, [entityType, currentEntity, db.transactions]);

  // Master Ledger Entries for non-landlord or general passbook
  const ledgerEntries = useMemo(() => {
    if (!currentEntity) return [];

    if (entityType === 'STUDENT') {
      const studentPayments = (db.payments || []).filter((p) => p.studentId === currentEntity.id);
      const studentGroup = (db.trainingGroups || []).find((g) => g.id === currentEntity.groupId);
      const course = (db.courses || []).find((c) => c.id === studentGroup?.courseId);
      const lockedFee = Number(currentEntity.lockedFee || course?.price || 15000);

      const rows = [
        {
          sn: 1,
          date: currentEntity.admissionDateBS || currentEntity.admissionDate || '2026-05-01',
          narration: `Admission Agreement - Total Course Fee (${course?.title || 'Vocational Course'})`,
          refNo: `ADM-${currentEntity.tgid || 'REG'}`,
          debit: lockedFee,
          credit: 0,
          method: 'Agreement',
          runningBalance: lockedFee,
          status: 'COMMITTED'
        }
      ];

      let running = lockedFee;
      studentPayments.forEach((p, i) => {
        const amt = Number(p.amount) || 0;
        running -= amt;
        rows.push({
          sn: i + 2,
          date: p.paymentDate || p.date,
          narration: `Fee Collection Receipt (${p.receiptNo}) - Installment Payment`,
          refNo: p.receiptNo,
          debit: 0,
          credit: amt,
          method: p.paymentMethod || 'Cash',
          runningBalance: Math.max(0, running),
          status: running <= 0 ? 'CLEARED' : 'PARTIAL'
        });
      });

      return rows;
    }

    if (entityType === 'SUPPLIER' || entityType === 'UTILITY') {
      const txns = (db.transactions || []).filter(
        (tx) => tx.partyId === currentEntity.id || tx.partyName === currentEntity.name
      );

      const totalPurchases = Number(currentEntity.totalPurchases) || 50000;
      const rows = [
        {
          sn: 1,
          date: '2026-04-15',
          narration: `${currentEntity.name} - Opening Credit Purchase Bill (Bill #1042)`,
          refNo: 'INV-1042',
          debit: totalPurchases,
          credit: 0,
          method: 'Credit Purchase',
          runningBalance: totalPurchases,
          status: 'BILL_ACCURED'
        }
      ];

      let running = totalPurchases;
      txns.forEach((tx, i) => {
        const amt = Number(tx.amount) || 0;
        running -= amt;
        rows.push({
          sn: i + 2,
          date: tx.date,
          narration: `Party Balance Payout (${tx.refNo}) - ConnectIPS`,
          refNo: tx.refNo,
          debit: 0,
          credit: amt,
          method: `${tx.paymentMethod} (Ref: ${tx.txnReference})`,
          runningBalance: Math.max(0, running),
          status: 'PAID'
        });
      });

      return rows;
    }

    // Default Bank / Trainer entries
    return (db.transactions || []).slice(0, 15).map((tx, idx) => ({
      sn: idx + 1,
      date: tx.date,
      narration: tx.remarks || tx.partyName || 'Transaction Entry',
      refNo: tx.refNo,
      debit: tx.isInflow ? Number(tx.amount) : 0,
      credit: !tx.isInflow ? Number(tx.amount) : 0,
      method: `${tx.paymentMethod} (${tx.txnReference || ''})`,
      runningBalance: Number(tx.amount),
      status: 'VERIFIED'
    }));
  }, [entityType, currentEntity, db]);

  // Export to Excel handler
  const handleExportExcel = () => {
    if (entityType === 'LANDLORD') {
      const data = landlordRentSchedule.map((row) => ({
        'S.N.': row.no,
        'Month': `${row.nepali} (${row.key})`,
        'Bill Date': row.billDate,
        'Monthly Rent (Rs.)': row.monthlyRent,
        'TDS Deducted (Rs.)': row.tdsAmount,
        'Net Disbursed (Rs.)': row.netDisbursed,
        'Payment Date': row.paidDate,
        'Method & Txn ID': `${row.paymentMethod} - ${row.txnReference}`,
        'Status': row.status
      }));
      exportToExcel(data, `Landlord_Annual_Rent_Statement_${fiscalYear.replace('/', '_')}`);
    } else {
      const data = ledgerEntries.map((r) => ({
        'S.N.': r.sn,
        'Date': r.date,
        'Particulars': r.narration,
        'Bill/Receipt No': r.refNo,
        'Debit': r.debit,
        'Credit': r.credit,
        'Method': r.method,
        'Running Balance': r.runningBalance,
        'Status': r.status
      }));
      exportToExcel(data, `Statement_${entityType}_${selectedId}`);
    }
  };

  const getEntityShareText = () => {
    if (!currentEntity) return '';
    if (entityType === 'LANDLORD') {
      return `Dear ${currentEntity.name},\n\nAnnual Rent Statement for Fiscal Year ${fiscalYear} from Global Era Technical School:\n\nMonthly Rent: Rs. ${currentEntity.monthlyRent?.toLocaleString()}\nTotal Paid: 10 Months Cleared (ConnectIPS)\nCurrent Due: Rs. ${(currentEntity.currentDue || 0).toLocaleString()}\n\nPlease contact the office for the detailed statement. Thank you!`;
    }
    return `Dear ${currentEntity.name || 'Sir/Madam'},\n\nPlease find your official account statement from Global Era Technical School. Thank you!`;
  };

  const entityTitle = useMemo(() => {
    switch (entityType) {
      case 'STUDENT':
        return {
          title: 'Student Fee Passbook & Installment Ledger',
          subtitle: 'Course fee, installment payment receipts, and remaining due balance'
        };
      case 'LANDLORD':
        return {
          title: 'Fiscal Year 12-Month Rent Statement (Shrawan–Ashad FY Rent Ledger)',
          subtitle: 'Monthly rent payment, 10% TDS deduction, and ConnectIPS transaction history'
        };
      case 'TRAINER':
        return {
          title: 'Trainer Remuneration & Commission Statement (Trainer Payroll Ledger)',
          subtitle: 'Batch commission, monthly salary, and disbursement voucher details'
        };
      case 'SUPPLIER':
      case 'UTILITY':
        return {
          title: 'Party Account & Purchase Statement (Party & Supplier Ledger)',
          subtitle: 'Purchase bills, payable liabilities, and bank payout history'
        };
      case 'BANK':
      default:
        return {
          title: 'Day-Book & Bank Passbook Ledger',
          subtitle: 'Nabil Bank, Global IME Bank, and Counter Cash ledger'
        };
    }
  }, [entityType]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: 'hidden',
          boxShadow: '0 25px 70px -15px rgba(15, 23, 42, 0.45)'
        }
      }}
    >
      {/* Top Header */}
      <DialogTitle
        sx={{
          bgcolor: '#0F2E5A',
          color: '#FFFFFF',
          fontWeight: 900,
          py: 2,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #F59E0B'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccountBalanceIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#FFFFFF', lineHeight: 1.2 }}>
              {entityTitle.title}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              {entityTitle.subtitle}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#FFF', fontWeight: 800, textTransform: 'none' }}
          >
            Excel
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ bgcolor: '#F59E0B', color: '#0F172A', fontWeight: 900, textTransform: 'none', '&:hover': { bgcolor: '#D97706' } }}
          >
            Print A4
          </Button>
          {currentEntity?.phone && (
            <IconButton
              size="small"
              component="a"
              href={getWhatsAppUrl(currentEntity.phone, getEntityShareText())}
              target="_blank"
              sx={{ color: '#25D366', bgcolor: 'rgba(255,255,255,0.1)' }}
            >
              <WhatsAppIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8', '&:hover': { color: '#FFF' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
        {/* Entity Selector Tabs */}
        <Paper elevation={0} sx={{ p: 1.5, mb: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFF' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <Tabs
                value={entityType}
                onChange={(e, val) => {
                  setEntityType(val);
                  setSelectedId('');
                }}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    py: 1,
                    minHeight: 40
                  }
                }}
              >
                <Tab value="LANDLORD" icon={<HomeWorkIcon />} iconPosition="start" label="🏠 Landlord" />
                <Tab value="STUDENT" icon={<SchoolIcon />} iconPosition="start" label="🎓 Student Fee" />
                <Tab value="SUPPLIER" icon={<StorefrontIcon />} iconPosition="start" label="🛠️ Material Suppliers" />
                <Tab value="TRAINER" icon={<PersonIcon />} iconPosition="start" label="👨‍🏫 Trainer Payroll" />
                <Tab value="BANK" icon={<AccountBalanceIcon />} iconPosition="start" label="🏦 Bank Account (Day-Book)" />
              </Tabs>
            </Grid>

            {/* Select Specific Entity */}
            <Grid item xs={12} sm={8} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Select Account / Party"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {entityList.map((ent) => (
                  <MenuItem key={ent.id} value={ent.id}>
                    {ent.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Fiscal Year */}
            <Grid item xs={12} sm={4} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Fiscal Year"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
              >
                <MenuItem value="2082/083">FY 2082/083 (Current)</MenuItem>
                <MenuItem value="2081/082">FY 2081/082 (Previous)</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* Selected Entity KPI Card */}
        {currentEntity && (
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              mb: 3,
              borderRadius: 3,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                  Party Profile
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                  {currentEntity.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                  Contact: {currentEntity.phone || 'N/A'} {currentEntity.panNumber ? `• PAN: ${currentEntity.panNumber}` : ''}
                </Typography>
                {currentEntity.bankName && (
                  <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 700, display: 'block', mt: 0.3 }}>
                    ConnectIPS A/C: {currentEntity.bankName} ({currentEntity.accountNumber})
                  </Typography>
                )}
              </Grid>

              <Grid item xs={6} sm={4} md={2.5}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                  Total Contract / Liability:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A' }}>
                  Rs. {((entityType === 'LANDLORD' ? (currentEntity.monthlyRent * 12) : currentEntity.totalPurchases || currentEntity.lockedFee || 600000)).toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  FY {fiscalYear}
                </Typography>
              </Grid>

              <Grid item xs={6} sm={4} md={2.5}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                  Total Paid / Cleared:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#059669' }}>
                  Rs. {(currentEntity.totalPaid || (entityType === 'LANDLORD' ? currentEntity.monthlyRent * 10 : 0)).toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
                  ConnectIPS & Bank Payments
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4} md={3} sx={{ textAlign: { sm: 'right' } }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                  Current Due Balance:
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: (currentEntity.currentDue > 0 || entityType === 'LANDLORD') ? '#DC2626' : '#059669' }}>
                  Rs. {(currentEntity.currentDue || (entityType === 'LANDLORD' ? currentEntity.monthlyRent : 0)).toLocaleString()}
                </Typography>
                <Chip
                  label={currentEntity.currentDue > 0 || entityType === 'LANDLORD' ? '🔴 Due Remaining' : '🟢 Fully Cleared'}
                  size="small"
                  sx={{
                    fontWeight: 900,
                    bgcolor: (currentEntity.currentDue > 0 || entityType === 'LANDLORD') ? '#FEE2E2' : '#ECFDF5',
                    color: (currentEntity.currentDue > 0 || entityType === 'LANDLORD') ? '#DC2626' : '#059669',
                    mt: 0.5
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* ========================================================
            VIEW 1: LANDLORD 12-MONTH FISCAL SHRAWAN-ASHAD GRID
            ======================================================== */}
        {entityType === 'LANDLORD' ? (
          <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #CBD5E1' }}>
            <TableContainer sx={{ maxHeight: 460 }}>
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
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 60, textAlign: 'center' }}>S.N.</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Fiscal Month</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Bill Issue Date</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Gross Rent</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>TDS Deduction (10%)</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Net Disbursed</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Payment Date</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Method & ConnectIPS Txn ID</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>Payment Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {landlordRentSchedule.map((row) => (
                    <TableRow key={row.no} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#64748B' }}>{row.no}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                        {row.nepali} <Typography variant="caption" sx={{ color: '#64748B' }}>({row.key})</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{row.billDate}</TableCell>
                      <TableCell sx={{ fontWeight: 900, color: '#0F172A' }}>Rs. {row.monthlyRent.toLocaleString()}</TableCell>
                      <TableCell sx={{ color: '#D97706', fontWeight: 700 }}>Rs. {row.tdsAmount.toLocaleString()}</TableCell>
                      <TableCell sx={{ fontWeight: 900, color: '#059669' }}>Rs. {row.netDisbursed.toLocaleString()}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{row.paidDate}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#1E40AF', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                          {row.paymentMethod} {row.txnReference !== '—' ? `(${row.txnReference})` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          size="small"
                          label={
                            row.status === 'PAID'
                              ? '🟢 Paid'
                              : row.status === 'DUE'
                              ? '🔴 Due'
                              : '⚪ Upcoming'
                          }
                          sx={{
                            fontWeight: 900,
                            fontSize: '0.74rem',
                            bgcolor: row.status === 'PAID' ? '#ECFDF5' : row.status === 'DUE' ? '#FEE2E2' : '#F1F5F9',
                            color: row.status === 'PAID' ? '#059669' : row.status === 'DUE' ? '#DC2626' : '#64748B'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : (
          /* ========================================================
             VIEW 2: GENERAL LEDGER PASSBOOK TABLE (STUDENT/VENDOR/BANK)
             ======================================================== */
          <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #CBD5E1' }}>
            <TableContainer sx={{ maxHeight: 460 }}>
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
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 60, textAlign: 'center' }}>S.N.</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 110 }}>Transaction Date</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Particulars</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 120 }}>Receipt / Bill No</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>Debit (+)</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>Credit (-)</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Payment Method</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>Running Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ledgerEntries.map((row) => (
                    <TableRow key={row.sn} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#64748B' }}>{row.sn}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{row.date}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{row.narration}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#1E40AF' }}>{row.refNo}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: row.debit > 0 ? '#0F2E5A' : '#94A3B8' }}>
                        {row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : '—'}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: row.credit > 0 ? '#059669' : '#94A3B8' }}>
                        {row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>{row.method}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: row.runningBalance > 0 ? '#DC2626' : '#059669' }}>
                        Rs. {row.runningBalance.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {ledgerEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#94A3B8' }}>
                        No transaction records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ bgcolor: '#0F2E5A', borderRadius: 2.5, px: 3.5, fontWeight: 800 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
