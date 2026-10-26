import React, { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Paper,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

import { postDoubleEntryJournal, saveDB } from '../../services/storage';

export default function ExpenseManagerView({ db, setDb, showToast }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // New Expense Dialog
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'Rent & Facilities',
    payee: '',
    amount: '',
    paymentMethod: 'Cash',
    accountCode: '5400',
    description: ''
  });

  const expenses = db.expenses || [];

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      e.payee.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.voucherNo || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleSaveExpense = () => {
    if (!form.payee.trim() || !form.amount || Number(form.amount) <= 0) {
      showToast('कृपया भुक्तानी पाउने व्यक्ति/संस्था (Payee) र रकम भर्नुहोस्।', 'error');
      return;
    }

    const amt = Number(form.amount);
    const voucherNo = `EXP-2026-${String(expenses.length + 1).padStart(4, '0')}`;
    const isDigital = form.paymentMethod !== 'Cash';
    const creditAccCode = isDigital ? '1020' : '1010';

    const newExpense = {
      id: `EXP-${Date.now()}`,
      voucherNo,
      date: form.date,
      category: form.category,
      payee: form.payee.trim(),
      amount: amt,
      paymentMethod: form.paymentMethod,
      accountCode: form.accountCode,
      description: form.description.trim() || `${form.category} payment to ${form.payee}`,
      status: 'Paid',
      recordedBy: 'Cashier / Admin',
      createdAt: new Date().toISOString()
    };

    try {
      // Auto-post balanced Double-Entry Journal
      const { nextDb } = postDoubleEntryJournal(db, {
        narration: `संस्थागत खर्च भुक्तानी (${voucherNo}): ${newExpense.description}`,
        lines: [
          { accountCode: form.accountCode, debit: amt, credit: 0, lineNarration: newExpense.description },
          { accountCode: creditAccCode, debit: 0, credit: amt, lineNarration: `Paid via ${form.paymentMethod}` }
        ],
        sourceModule: 'EXPENSE',
        sourceId: voucherNo,
        entryDate: form.date
      });

      const updatedDb = {
        ...nextDb,
        expenses: [newExpense, ...(nextDb.expenses || [])]
      };
      saveDB(updatedDb);
      setDb(updatedDb);
      showToast(`खर्च भौचर ${voucherNo} सफलतापूर्वक प्रविष्टि भयो!`);
      setOpenModal(false);
      setForm({
        date: new Date().toISOString().slice(0, 10),
        category: 'Rent & Facilities',
        payee: '',
        amount: '',
        paymentMethod: 'Cash',
        accountCode: '5400',
        description: ''
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <Box>
      <Card sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              💸 संस्थागत खर्च तथा आपूर्तिकर्ता भुक्तानी (Operating Expenses & Vendors)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              घरभाडा, बत्ती, इन्टरनेट, तालिम कच्चा सामग्री, मर्मत तथा अन्य सञ्चालन खर्च प्रविष्टि
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenModal(true)}
            sx={{
              background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
              fontWeight: 800,
              borderRadius: 2.5,
              textTransform: 'none'
            }}
          >
            + नयाँ खर्च प्रविष्टि (Record Expense)
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by Payee, Description, Voucher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: '#94A3B8', mr: 1, fontSize: '1.2rem' }} /> }}
            sx={{ minWidth: 320 }}
          />
          <TextField
            select
            size="small"
            label="खर्च विधा (Category)"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="ALL">All Categories</MenuItem>
            <MenuItem value="Rent & Facilities">Rent & Facilities</MenuItem>
            <MenuItem value="Training Materials">Training Materials</MenuItem>
            <MenuItem value="Utilities & Internet">Utilities & Internet</MenuItem>
            <MenuItem value="Marketing & Counseling">Marketing & Counseling</MenuItem>
            <MenuItem value="Office Supplies & Maintenance">Office Supplies & Maintenance</MenuItem>
          </TextField>
          <Box sx={{ ml: 'auto' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#DC2626' }}>
              कुल खर्च योग: Rs. {totalExpenseAmount.toLocaleString()}
            </Typography>
          </Box>
        </Stack>
      </Card>

      <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, width: 140 }}>Voucher No</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 120 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>पाउने व्यक्ति / आपूर्तिकर्ता (Payee)</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 180 }}>विधा (Category)</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 140 }}>Payment Method</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right', width: 140 }}>रकम (Amount)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell sx={{ fontWeight: 800, color: '#DC2626' }}>{e.voucherNo}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{e.date}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>{e.payee}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>{e.description}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={e.category} size="small" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={e.paymentMethod} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 900, color: '#DC2626', fontSize: '0.95rem' }}>
                    Rs. {Number(e.amount).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Record Expense Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>+ नयाँ खर्च प्रविष्टि (Record Center Expense)</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="मिति (Date)"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                size="small"
                label="खर्च वर्ग (Category)"
                value={form.category}
                onChange={(e) => {
                  const cat = e.target.value;
                  let acc = '5400';
                  if (cat === 'Training Materials') acc = '5300';
                  if (cat === 'Marketing & Counseling') acc = '5500';
                  if (cat === 'Office Supplies & Maintenance') acc = '5600';
                  setForm({ ...form, category: cat, accountCode: acc });
                }}
              >
                <MenuItem value="Rent & Facilities">Rent & Facilities (5400)</MenuItem>
                <MenuItem value="Training Materials">Training Materials (5300)</MenuItem>
                <MenuItem value="Utilities & Internet">Utilities & Internet (5400)</MenuItem>
                <MenuItem value="Marketing & Counseling">Marketing & Counseling (5500)</MenuItem>
                <MenuItem value="Office Supplies & Maintenance">Office Supplies (5600)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="भुक्तानी पाउने (Payee / Vendor)"
                placeholder="e.g. Nepal Electricity Authority / Newroad Fabrics"
                value={form.payee}
                onChange={(e) => setForm({ ...form, payee: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="रकम (Amount in Rs.)"
                placeholder="e.g. 5000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                size="small"
                label="भुक्तानी माध्यम (Payment Method)"
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              >
                <MenuItem value="Cash">Cash on Hand (काउन्टर नगद - 1010)</MenuItem>
                <MenuItem value="Fonepay / QR">Fonepay / QR (बैंक - 1020)</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer (बैंक - 1020)</MenuItem>
                <MenuItem value="eSewa">eSewa Wallet (1020)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                disabled
                label="खाता कोड (Dr. Account)"
                value={`${form.accountCode} - Operating Expense`}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="कैफियत / विवरण (Description / Remarks)"
                placeholder="e.g. September electricity bill for Jorpati center"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleSaveExpense} sx={{ fontWeight: 800 }}>
            खर्च सुरक्षित गर्नुहोस् (Save Expense)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
