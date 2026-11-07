import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentIcon from '@mui/icons-material/Payment';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ArticleIcon from '@mui/icons-material/Article';

import { postDoubleEntryJournal, saveDB } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { useDialog } from '../../context/DialogContext';
import ConnectIpsPayoutModal from './ConnectIpsPayoutModal';
import UniversalStatementModal from './UniversalStatementModal';

export const PARTY_CATEGORIES = [
  { code: 'LANDLORD', label: 'Building Owner / Landlord', icon: '🏠' },
  { code: 'TECHNICAL_SUPPLIER', label: 'Technical Tools & Raw Materials', icon: '🛠️' },
  { code: 'TAILORING_SUPPLIER', label: 'Tailoring Materials (Fabric / Thread)', icon: '🧵' },
  { code: 'BEAUTICIAN_SUPPLIER', label: 'Beautician & Cosmetics Supplies', icon: '💄' },
  { code: 'BAKERY_SUPPLIER', label: 'Bakery & Culinary Ingredients', icon: '🎂' },
  { code: 'UTILITY_SERVICE', label: 'Utilities (Internet, Electricity, Services)', icon: '💡' },
  { code: 'STATIONERY_MEDIA', label: 'Stationery, Printing & Branding', icon: '📚' }
];

export default function PartyManagerView({ db, setDb, showToast }) {
  const { confirm, alert } = useDialog();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [dueFilter, setDueFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modals
  const [addPartyOpen, setAddPartyOpen] = useState(false);
  const [recordPurchaseOpen, setRecordPurchaseOpen] = useState(false);

  // ConnectIPS Payout Modal
  const [connectIpsModalOpen, setConnectIpsModalOpen] = useState(false);
  const [selectedPartyForConnectIps, setSelectedPartyForConnectIps] = useState(null);

  // Universal Statement Modal
  const [universalStatementOpen, setUniversalStatementOpen] = useState(false);
  const [statementPartyId, setStatementPartyId] = useState(null);
  const [statementPartyType, setStatementPartyType] = useState('LANDLORD');

  // Form states: Add Party
  const [partyName, setPartyName] = useState('');
  const [partyCategory, setPartyCategory] = useState('LANDLORD');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [address, setAddress] = useState('Jorpati-05, Kathmandu');
  const [bankName, setBankName] = useState('Global IME Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [tdsPercent, setTdsPercent] = useState('10');
  const [notes, setNotes] = useState('');

  // Form states: Record Purchase
  const [purchasePartyId, setPurchasePartyId] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseDescription, setPurchaseDescription] = useState('');
  const [isCreditPurchase, setIsCreditPurchase] = useState(true);
  const [purchasePayMethod, setPurchasePayMethod] = useState('ConnectIPS');

  // Resolve Parties & ensure seed data if empty
  const parties = useMemo(() => {
    return db.parties || [];
  }, [db.parties]);

  // Auto-seed realistic parties if empty
  React.useEffect(() => {
    if (!db.parties || db.parties.length === 0) {
      const initialParties = [
        {
          id: 'PRT-001',
          name: 'Ram Kumar Shrestha (Main Building Landlord)',
          category: 'LANDLORD',
          contactPerson: 'Ram Kumar Shrestha',
          phone: '9851011122',
          panNumber: '302918273',
          address: 'Jorpati-05, Kathmandu',
          bankName: 'Global IME Bank',
          accountNumber: '01201010049281',
          accountHolderName: 'Ram Kumar Shrestha',
          monthlyRent: 50000,
          securityDeposit: 150000,
          tdsPercent: 10,
          totalPurchases: 600000,
          totalPaid: 550000,
          currentDue: 50000,
          notes: 'Main institute building lease agreement (Shrawan-Ashadh). Monthly rent invoice generated on 1st.'
        },
        {
          id: 'PRT-002',
          name: 'New Mahalaxmi Hardware & Machinery Store',
          category: 'TECHNICAL_SUPPLIER',
          contactPerson: 'Mahesh Maharjan',
          phone: '9841887766',
          panNumber: '601928374',
          address: 'Chabahil, Kathmandu',
          bankName: 'Nabil Bank',
          accountNumber: '0010009281928',
          accountHolderName: 'New Mahalaxmi Hardware Store',
          totalPurchases: 85000,
          totalPaid: 65000,
          currentDue: 20000,
          notes: 'Supplier for welding, plumbing, and electrical training tools and materials'
        },
        {
          id: 'PRT-003',
          name: 'WorldLink Communications Pvt. Ltd. (Internet)',
          category: 'UTILITY_SERVICE',
          contactPerson: 'Customer Support',
          phone: '01-4911222',
          panNumber: '300182910',
          address: 'Jawalakhel, Lalitpur',
          bankName: 'ConnectIPS / eSewa Online',
          accountNumber: 'WLINK-CORP-4820',
          accountHolderName: 'WorldLink Communications Ltd.',
          totalPurchases: 42000,
          totalPaid: 38500,
          currentDue: 3500,
          notes: 'Computer lab & office 200 Mbps dedicated fiber internet (Monthly bill Rs. 3,500)'
        },
        {
          id: 'PRT-004',
          name: 'New Road Fabric & Tailoring Supply Store',
          category: 'TAILORING_SUPPLIER',
          contactPerson: 'Sunil Bajracharya',
          phone: '9841887766',
          panNumber: '601928374',
          address: 'New Road, Kathmandu',
          bankName: 'NIC Asia Bank',
          accountNumber: '0420019283746',
          accountHolderName: 'New Road Fabric Store',
          totalPurchases: 32000,
          totalPaid: 25000,
          currentDue: 7000,
          notes: 'Supplier of fabric, thread, and sewing machine needles for tailoring training'
        }
      ];

      const nextDb = { ...db, parties: initialParties };
      saveDB(nextDb);
      setDb(nextDb);
    }
  }, [db, setDb]);

  // Financial Metrics
  const totalPartiesCount = parties.length;
  const totalPurchasesSum = parties.reduce((acc, p) => acc + (Number(p.totalPurchases) || 0), 0);
  const totalPaidSum = parties.reduce((acc, p) => acc + (Number(p.totalPaid) || 0), 0);
  const totalDueSum = parties.reduce((acc, p) => acc + (Number(p.currentDue) || 0), 0);

  // Filter logic
  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.contactPerson || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.phone || '').includes(search) ||
        (p.panNumber || '').includes(search);

      const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
      const isDue = (Number(p.currentDue) || 0) > 0;
      const matchDue = dueFilter === 'ALL' || (dueFilter === 'DUE' && isDue) || (dueFilter === 'PAID' && !isDue);

      return matchSearch && matchCat && matchDue;
    });
  }, [parties, search, categoryFilter, dueFilter]);

  // Handler: Add New Party
  const handleAddParty = (e) => {
    e.preventDefault();
    if (!partyName.trim()) return;

    const newParty = {
      id: `PRT-${Date.now().toString().slice(-6)}`,
      name: partyName.trim(),
      category: partyCategory,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      panNumber: panNumber.trim(),
      address: address.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountHolderName: accountHolderName.trim() || partyName.trim(),
      monthlyRent: partyCategory === 'LANDLORD' ? Number(monthlyRent) || 50000 : null,
      securityDeposit: partyCategory === 'LANDLORD' ? Number(securityDeposit) || 0 : null,
      tdsPercent: partyCategory === 'LANDLORD' ? Number(tdsPercent) || 10 : null,
      totalPurchases: 0,
      totalPaid: 0,
      currentDue: 0,
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    const nextParties = [newParty, ...parties];
    const nextDb = { ...db, parties: nextParties };
    saveDB(nextDb);
    setDb(nextDb);

    if (showToast) showToast(`Party ${partyName} registered successfully.`, 'success');
    setAddPartyOpen(false);
    setPartyName('');
    setPhone('');
    setPanNumber('');
    setAccountNumber('');
    setMonthlyRent('');
    setNotes('');
  };

  // Handler: Record Purchase / Expense
  const handleRecordPurchase = (e) => {
    e.preventDefault();
    const amt = Number(purchaseAmount) || 0;
    if (amt <= 0 || !purchasePartyId) return;

    const targetParty = parties.find((p) => p.id === purchasePartyId);
    if (!targetParty) return;

    const billNo = billNumber.trim() || `BILL-${Date.now().toString().slice(-5)}`;
    const isCredit = isCreditPurchase;

    // Update Party Balance
    const updatedParties = parties.map((p) => {
      if (p.id === purchasePartyId) {
        return {
          ...p,
          totalPurchases: (p.totalPurchases || 0) + amt,
          totalPaid: isCredit ? (p.totalPaid || 0) : (p.totalPaid || 0) + amt,
          currentDue: isCredit ? (p.currentDue || 0) + amt : (p.currentDue || 0)
        };
      }
      return p;
    });

    // Also record into db.expenses
    const newExpense = {
      id: `EXP-${Date.now()}`,
      voucherNo: `VCH-${Date.now().toString().slice(-6)}`,
      date: billDate,
      category: targetParty.category === 'LANDLORD' ? 'Rent & Facilities' : 'Practical Raw Materials',
      payee: targetParty.name,
      amount: amt,
      paymentMethod: isCredit ? 'Credit (Payable)' : purchasePayMethod,
      accountCode: targetParty.category === 'LANDLORD' ? '5400' : '5300',
      description: `Bill #${billNo}: ${purchaseDescription || 'Goods Purchase'}`,
      status: isCredit ? 'Pending' : 'Paid',
      billNumber: billNo
    };

    let nextDb = {
      ...db,
      parties: updatedParties,
      expenses: [newExpense, ...(db.expenses || [])]
    };

    // Double Entry Journal Entry
    try {
      const creditAcc = isCredit ? '2010' : '1010';
      const debitAcc = targetParty.category === 'LANDLORD' ? '5400' : '5300';
      const journalRes = postDoubleEntryJournal(nextDb, {
        entryDate: billDate,
        narration: `Purchase/Expense from ${targetParty.name} (Bill #${billNo})`,
        sourceModule: 'VENDOR_BILL',
        sourceId: billNo,
        lines: [
          { accountCode: debitAcc, debit: amt, credit: 0, lineNarration: purchaseDescription },
          { accountCode: creditAcc, debit: 0, credit: amt, lineNarration: `Bill #${billNo}` }
        ]
      });
      nextDb = journalRes.nextDb;
    } catch (_) {}

    saveDB(nextDb);
    setDb(nextDb);

    if (showToast) {
      showToast(`Purchase recorded for Bill #${billNo} amounting to Rs. ${amt.toLocaleString()}.`, 'success');
    }
    setRecordPurchaseOpen(false);
    setPurchaseAmount('');
    setBillNumber('');
    setPurchaseDescription('');
  };

  const handleDeleteParty = async (partyId, name) => {
    const ok = await confirm({
      type: 'danger',
      title: 'Confirm Delete Party',
      message: `Are you sure you want to delete party "${name}" from the list?`,
      detail: 'This will remove the party bank and ledger records. This action cannot be undone.',
      confirmText: 'Yes, Delete',
      confirmColor: '#DC2626'
    });

    if (ok) {
      const updated = parties.filter((p) => p.id !== partyId);
      const nextDb = { ...db, parties: updated };
      saveDB(nextDb);
      setDb(nextDb);
      if (showToast) showToast('Party deleted successfully.', 'info');
    }
  };

  const handleOpenPayout = (party) => {
    setSelectedPartyForConnectIps(party);
    setConnectIpsModalOpen(true);
  };

  const handleOpenStatement = (party) => {
    setStatementPartyId(party.id);
    setStatementPartyType(party.category === 'LANDLORD' ? 'LANDLORD' : 'SUPPLIER');
    setUniversalStatementOpen(true);
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* 4 Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  Total Registered Parties
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f2e5a', mt: 0.5 }}>
                  {totalPartiesCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 700 }}>
                  Landlords, Vendors & Utilities
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#f0f9ff', borderRadius: 2, color: '#0284c7' }}>
                <StorefrontIcon sx={{ fontSize: 28 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  Total Purchases & Rent Bills
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f2e5a', mt: 0.5 }}>
                  Rs. {totalPurchasesSum.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Annual Total Liabilities
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, color: '#0f2e5a' }}>
                <ShoppingBagIcon sx={{ fontSize: 28 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  Total Amount Paid
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#16a34a', mt: 0.5 }}>
                  Rs. {totalPaidSum.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700 }}>
                  Paid via ConnectIPS & Bank Transfers
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, color: '#16a34a' }}>
                <ReceiptLongIcon sx={{ fontSize: 28 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  Total Outstanding Due
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: totalDueSum > 0 ? '#dc2626' : '#16a34a', mt: 0.5 }}>
                  Rs. {totalDueSum.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: totalDueSum > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                  {totalDueSum > 0 ? 'Pending Payment Obligation' : 'All Clear'}
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: totalDueSum > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: 2, color: totalDueSum > 0 ? '#dc2626' : '#16a34a' }}>
                <PaymentIcon sx={{ fontSize: 28 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Action Bar & Filter Controls */}
      <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search party name, phone, or PAN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={6} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Party Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Categories</MenuItem>
              {PARTY_CATEGORIES.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.icon} {c.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Outstanding Status"
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="DUE">🔴 Outstanding Due Only</MenuItem>
              <MenuItem value="PAID">🟢 Fully Paid Only</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
            <Stack direction="row" spacing={1.2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap">
              {/* View Toggle */}
              <ToggleButtonGroup
                size="small"
                value={viewMode}
                exclusive
                onChange={(e, next) => next && setViewMode(next)}
                sx={{
                  bgcolor: '#F1F5F9',
                  borderRadius: 2,
                  p: 0.3,
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: '6px !important',
                    px: 1.2,
                    py: 0.5,
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    textTransform: 'none',
                    color: '#64748B',
                    '&.Mui-selected': {
                      bgcolor: '#FFFFFF',
                      color: '#0F2E5A',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                    }
                  }
                }}
              >
                <ToggleButton value="table">
                  <ViewListIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> Table
                </ToggleButton>
                <ToggleButton value="cards">
                  <GridViewIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> Cards
                </ToggleButton>
              </ToggleButtonGroup>

              <Button
                variant="outlined"
                startIcon={<ArticleIcon />}
                onClick={() => {
                  setStatementPartyId(parties[0]?.id || null);
                  setStatementPartyType('LANDLORD');
                  setUniversalStatementOpen(true);
                }}
                sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2, fontSize: '0.78rem' }}
              >
                Statement Hub
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddPartyOpen(true)}
                sx={{ fontWeight: 800, textTransform: 'none', bgcolor: '#0f2e5a', borderRadius: 2, fontSize: '0.78rem', '&:hover': { bgcolor: '#174276' } }}
              >
                + Add Party
              </Button>
              <Button
                variant="contained"
                startIcon={<PointOfSaleIcon />}
                onClick={() => setRecordPurchaseOpen(true)}
                sx={{ fontWeight: 800, textTransform: 'none', bgcolor: '#059669', borderRadius: 2, fontSize: '0.78rem', '&:hover': { bgcolor: '#047857' } }}
              >
                + Purchase / Expense
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* Party Table with Model 1 Styling */}
      {viewMode === 'table' && (
      <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
        <TableContainer>
          <Table>
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
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 60, textAlign: 'center' }}>
                  S.N.
                </TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Party Name & Category</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Contact Person & Phone</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>ConnectIPS Bank Details</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }} align="right">Total Purchases / Rent</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }} align="right">Total Paid</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }} align="right">Outstanding Due</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredParties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#64748b' }}>
                    No parties found. Click '+ Add Party' to register a landlord or vendor.
                  </TableCell>
                </TableRow>
              ) : (
                filteredParties.map((p, idx) => {
                  const catObj = PARTY_CATEGORIES.find((c) => c.code === p.category) || {};
                  const isDue = (Number(p.currentDue) || 0) > 0;

                  return (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#64748B' }}>
                        {idx + 1}
                      </TableCell>

                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a' }}>
                          {catObj.icon} {p.name}
                        </Typography>
                        <Chip
                          label={catObj.label ? catObj.label.split('(')[0] : 'Supplier'}
                          size="small"
                          sx={{ height: '20px', fontSize: '0.68rem', fontWeight: 700, mt: 0.5, bgcolor: '#f1f5f9' }}
                        />
                        {p.monthlyRent && (
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.3 }}>
                            Monthly Lease: Rs. {p.monthlyRent.toLocaleString()} (TDS: {p.tdsPercent || 10}%)
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                          {p.contactPerson || '-'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {p.phone || '-'}
                          </Typography>
                          {p.phone && (
                            <IconButton
                              size="small"
                              component="a"
                              href={getWhatsAppUrl(p.phone, `Hello ${p.name}, contacting you from Global Era Technical Institute.`)}
                              target="_blank"
                              sx={{ color: '#25D366', p: 0.2 }}
                            >
                              <WhatsAppIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#0F2E5A' }}>
                          {p.bankName || 'Global IME Bank'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569', fontFamily: 'monospace', display: 'block' }}>
                          A/C: {p.accountNumber || '01200012345'}
                        </Typography>
                        {p.panNumber && (
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            PAN: {p.panNumber}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="right" sx={{ fontWeight: 800, color: '#0f2e5a' }}>
                        Rs. {(Number(p.totalPurchases) || 0).toLocaleString()}
                      </TableCell>

                      <TableCell align="right" sx={{ fontWeight: 800, color: '#059669' }}>
                        Rs. {(Number(p.totalPaid) || 0).toLocaleString()}
                      </TableCell>

                      <TableCell align="right">
                        {isDue ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 900, color: '#dc2626' }}>
                              Rs. {(Number(p.currentDue) || 0).toLocaleString()}
                            </Typography>
                            <Chip
                              label="Due Outstanding"
                              size="small"
                              sx={{ height: '18px', fontSize: '0.65rem', fontWeight: 800, bgcolor: '#fef2f2', color: '#991b1b' }}
                            />
                          </Box>
                        ) : (
                          <Chip
                            label="Cleared"
                            size="small"
                            sx={{ height: '20px', fontSize: '0.7rem', fontWeight: 800, bgcolor: '#ecfdf5', color: '#065f46' }}
                          />
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Stack direction="row" spacing={0.8} justifyContent="center">
                          <Tooltip title="Make ConnectIPS / Bank Payment">
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<AccountBalanceIcon sx={{ fontSize: '0.9rem !important' }} />}
                              onClick={() => handleOpenPayout(p)}
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.74rem',
                                py: 0.4,
                                px: 1.2,
                                bgcolor: isDue ? '#DC2626' : '#0F2E5A',
                                borderRadius: 1.8,
                                textTransform: 'none',
                                '&:hover': { bgcolor: isDue ? '#B91C1C' : '#174276' }
                              }}
                            >
                              Pay
                            </Button>
                          </Tooltip>

                          <Tooltip title={p.category === 'LANDLORD' ? "Fiscal Year 12-Month Rent Statement" : "Vendor Ledger & Purchase Statement"}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<ArticleIcon sx={{ fontSize: '0.9rem !important' }} />}
                              onClick={() => handleOpenStatement(p)}
                              sx={{ fontWeight: 800, fontSize: '0.74rem', py: 0.4, px: 1.2, borderRadius: 1.8, textTransform: 'none' }}
                            >
                              Statement
                            </Button>
                          </Tooltip>

                          <Tooltip title="Delete Party">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteParty(p.id, p.name)}
                              sx={{ color: '#EF4444', bgcolor: '#FEF2F2', borderRadius: 1.8 }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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

      {/* Party Cards View */}
      {viewMode === 'cards' && (
        <Box sx={{ mt: 1 }}>
          {filteredParties.length === 0 ? (
            <Card elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <StorefrontIcon sx={{ fontSize: 48, color: '#94A3B8', mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#64748B' }}>
                No parties found. Click '+ Add Party' to register a new vendor or party.
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={2.5}>
              {filteredParties.map((p) => {
                const isDue = (Number(p.currentDue) || 0) > 0;
                const catInfo = PARTY_CATEGORIES.find((c) => c.code === p.category);

                return (
                  <Grid item xs={12} sm={6} md={4} key={p.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 3.5,
                        border: '1px solid #E2E8F0',
                        bgcolor: '#FFFFFF',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                        borderTop: `4px solid ${isDue ? '#DC2626' : '#10B981'}`,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 8px 24px rgba(15, 46, 90, 0.08)',
                          borderColor: '#93C5FD'
                        }
                      }}
                    >
                      <Box>
                        {/* Top: Category Badge & Due Status Chip */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Chip
                            label={`${catInfo?.icon || '🏢'} ${catInfo?.label ? catInfo.label.split('(')[0] : p.category}`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              bgcolor: p.category === 'LANDLORD' ? '#EFF6FF' : '#F8FAFC',
                              color: p.category === 'LANDLORD' ? '#1D4ED8' : '#334155',
                              border: '1px solid #E2E8F0'
                            }}
                          />
                          <Chip
                            label={isDue ? 'Outstanding Due' : 'Paid & Cleared'}
                            size="small"
                            sx={{
                              fontWeight: 900,
                              fontSize: '0.7rem',
                              bgcolor: isDue ? '#FEF2F2' : '#ECFDF5',
                              color: isDue ? '#DC2626' : '#059669',
                              border: `1px solid ${isDue ? '#FECACA' : '#A7F3D0'}`
                            }}
                          />
                        </Box>

                        {/* Party Name */}
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F2E5A', mb: 0.5, lineHeight: 1.3 }}>
                          {p.name}
                        </Typography>

                        {/* Contact Person & Phone */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, p: 1, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 700 }}>
                              Contact: {p.contactPerson || '-'}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                              {p.phone || '-'}
                            </Typography>
                          </Box>
                          {p.phone && (
                            <Tooltip title="Send WhatsApp Message">
                              <IconButton
                                size="small"
                                component="a"
                                href={getWhatsAppUrl(p.phone, `Hello ${p.name}, contacting you from Global Era Technical Institute.`)}
                                target="_blank"
                                rel="noreferrer"
                                sx={{ color: '#16A34A', bgcolor: '#DCFCE7' }}
                              >
                                <WhatsAppIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>

                        {/* Bank & Tax Details */}
                        <Box sx={{ mb: 1.5, fontSize: '0.78rem', color: '#475569' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                            <span style={{ color: '#64748B' }}>PAN:</span>
                            <strong>{p.panNumber || '-'}</strong>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                            <span style={{ color: '#64748B' }}>Bank:</span>
                            <span style={{ fontWeight: 700, color: '#1E40AF' }}>{p.bankName || 'ConnectIPS'}</span>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>A/C No:</span>
                            <strong style={{ fontFamily: 'monospace' }}>{p.accountNumber || '-'}</strong>
                          </Box>
                        </Box>

                        {/* Landlord Specific Info */}
                        {p.category === 'LANDLORD' && (
                          <Box sx={{ p: 1, mb: 1.5, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #DBEAFE', fontSize: '0.76rem' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                              <span style={{ color: '#1E40AF', fontWeight: 700 }}>Monthly Rent:</span>
                              <strong>Rs. {(p.monthlyRent || 50000).toLocaleString()}/Month</strong>
                            </Box>
                            {p.securityDeposit && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#1E40AF' }}>Security Deposit:</span>
                                <strong>Rs. {Number(p.securityDeposit).toLocaleString()}</strong>
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* 3-Column Financial Summary */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, p: 1.2, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px dashed #CBD5E1', textAlign: 'center', mb: 1.5 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>
                              Total Bill
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A', fontSize: '0.8rem' }}>
                              Rs. {(p.totalPurchases || 0).toLocaleString()}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#16A34A', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>
                              Paid
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#16A34A', fontSize: '0.8rem' }}>
                              Rs. {(p.totalPaid || 0).toLocaleString()}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: isDue ? '#DC2626' : '#16A34A', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>
                              Remaining Due
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 900, color: isDue ? '#DC2626' : '#16A34A', fontSize: '0.8rem' }}>
                              Rs. {(p.currentDue || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Card Bottom Actions */}
                      <Box sx={{ pt: 1.5, borderTop: '1px solid #F1F5F9' }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            startIcon={<AccountBalanceIcon sx={{ fontSize: '0.95rem !important' }} />}
                            onClick={() => handleOpenConnectIps(p)}
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              py: 0.65,
                              bgcolor: isDue ? '#DC2626' : '#0F2E5A',
                              borderRadius: 2,
                              textTransform: 'none',
                              '&:hover': { bgcolor: isDue ? '#B91C1C' : '#174276' }
                            }}
                          >
                            ConnectIPS Pay
                          </Button>

                          <Tooltip title={p.category === 'LANDLORD' ? "12-Month Rent Statement" : "Vendor Ledger"}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenStatement(p)}
                              sx={{ border: '1px solid #CBD5E1', borderRadius: 2, color: '#0F2E5A', bgcolor: '#F8FAFC' }}
                            >
                              <ArticleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Party">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteParty(p.id, p.name)}
                              sx={{ color: '#EF4444', bgcolor: '#FEF2F2', borderRadius: 2 }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}

      {/* Dialog: Add New Party */}
      <Dialog open={addPartyOpen} onClose={() => setAddPartyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)', color: '#ffffff', py: 2.2, px: 3, borderBottom: '3px solid #F59E0B' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem' }}>
              + Add New Party / Vendor
            </Typography>
            <IconButton onClick={() => setAddPartyOpen(false)} sx={{ color: 'rgba(255,255,255,0.85)', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', color: '#ffffff' } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleAddParty} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  size="small"
                  label="Party Category"
                  value={partyCategory}
                  onChange={(e) => setPartyCategory(e.target.value)}
                >
                  {PARTY_CATEGORIES.map((c) => (
                    <MenuItem key={c.code} value={c.code}>
                      {c.icon} {c.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Party / Vendor / Landlord Name *"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g., Ram Kumar Shrestha (Landlord)"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Contact Person"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Contact Phone / WhatsApp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9841xxxxxx"
                />
              </Grid>

              {/* ConnectIPS Bank Account Details */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="ConnectIPS Bank Name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g., Global IME Bank"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Bank Account Number (A/C No)"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="01200012345"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Account Holder Name"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Ram Kumar Shrestha"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="PAN / VAT Number"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                />
              </Grid>

              {/* Landlord Specific Fields */}
              {partyCategory === 'LANDLORD' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Monthly Agreement Rent (Rs.)"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      placeholder="50,000"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Rs. </InputAdornment>
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Refundable Security Deposit (Rs.)"
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(e.target.value)}
                      placeholder="150,000"
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Notes & Agreement Details"
                  multiline
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>
            </Grid>

            <DialogActions sx={{ px: 0, pt: 3 }}>
              <Button onClick={() => setAddPartyOpen(false)} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#0f2e5a', fontWeight: 800 }}>
                Save Party
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog: Record Purchase */}
      <Dialog open={recordPurchaseOpen} onClose={() => setRecordPurchaseOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)', color: '#ffffff', py: 2.2, px: 3, borderBottom: '3px solid #F59E0B' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem' }}>
              + Record New Purchase / Expense Bill
            </Typography>
            <IconButton onClick={() => setRecordPurchaseOpen(false)} sx={{ color: 'rgba(255,255,255,0.85)', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)', color: '#ffffff' } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleRecordPurchase} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  required
                  size="small"
                  label="Select Vendor / Party *"
                  value={purchasePartyId}
                  onChange={(e) => setPurchasePartyId(e.target.value)}
                >
                  {parties.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Invoice / Bill No *"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  placeholder="e.g., INV-1042"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Bill Date *"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  size="small"
                  label="Total Bill Amount (Rs.)"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Payment Terms"
                  value={isCreditPurchase ? 'CREDIT' : 'CASH'}
                  onChange={(e) => setIsCreditPurchase(e.target.value === 'CREDIT')}
                >
                  <MenuItem value="CREDIT">🔴 Credit (Accounts Payable)</MenuItem>
                  <MenuItem value="CASH">🟢 Instant Paid (Cash/Bank)</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Item Description"
                  multiline
                  rows={2}
                  value={purchaseDescription}
                  onChange={(e) => setPurchaseDescription(e.target.value)}
                  placeholder="e.g., 5 bundles welding electrodes and grinding discs for training"
                />
              </Grid>
            </Grid>

            <DialogActions sx={{ px: 0, pt: 3 }}>
              <Button onClick={() => setRecordPurchaseOpen(false)} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#0f2e5a', fontWeight: 800 }}>
                Submit Purchase Bill
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ConnectIPS Fast Payout Modal */}
      <ConnectIpsPayoutModal
        open={connectIpsModalOpen}
        onClose={() => setConnectIpsModalOpen(false)}
        party={selectedPartyForConnectIps}
        db={db}
        setDb={setDb}
        onSuccess={() => {
          if (showToast) showToast('ConnectIPS payment completed successfully!', 'success');
        }}
      />

      {/* Universal Statement Modal */}
      <UniversalStatementModal
        open={universalStatementOpen}
        onClose={() => setUniversalStatementOpen(false)}
        db={db}
        initialEntityType={statementPartyType}
        initialEntityId={statementPartyId}
      />
    </Box>
  );
}
