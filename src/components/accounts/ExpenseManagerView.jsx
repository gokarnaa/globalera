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
  Grid,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CloseIcon from '@mui/icons-material/Close';

import { postDoubleEntryJournal, saveDB } from '../../services/storage';

export default function ExpenseManagerView({ db, setDb, showToast }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

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
          <Box sx={{ ml: { xs: 0, sm: 'auto' }, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#DC2626' }}>
              कुल खर्च योग: Rs. {totalExpenseAmount.toLocaleString()}
            </Typography>

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
                <ViewListIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> तालिका
              </ToggleButton>
              <ToggleButton value="cards">
                <GridViewIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> कार्ड
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Stack>
      </Card>

      {/* Table View Mode */}
      {viewMode === 'table' && (
      <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
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
                  py: 1.4,
                  borderBottom: '2px solid #F59E0B'
                }
              }}
            >
              <TableRow>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 140 }}>भौचर नं. (Voucher)</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 120 }}>मिति (Date)</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>पाउने व्यक्ति / आपूर्तिकर्ता (Payee)</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 180 }}>विधा (Category)</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 140 }}>Payment Method</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right', width: 140 }}>रकम (Amount)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#94A3B8' }}>
                    कुनै खर्च फेला परेन।
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell sx={{ fontWeight: 800, color: '#DC2626', fontFamily: 'monospace' }}>{e.voucherNo}</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      )}

      {/* Cards View Mode */}
      {viewMode === 'cards' && (
        <Box sx={{ mt: 1 }}>
          {filtered.length === 0 ? (
            <Card elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <ReceiptLongIcon sx={{ fontSize: 48, color: '#94A3B8', mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#64748B' }}>
                कुनै खर्च फेला परेन।
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={2.2}>
              {filtered.map((e) => (
                <Grid item xs={12} sm={6} md={4} key={e.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: 3,
                      border: '1px solid #E2E8F0',
                      bgcolor: '#FFFFFF',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderLeft: '5px solid #DC2626',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.06)'
                      }
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                        <Chip
                          label={e.voucherNo}
                          size="small"
                          sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.74rem', bgcolor: '#FEF2F2', color: '#DC2626' }}
                        />
                        <Chip
                          label={e.category}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.68rem', bgcolor: '#F1F5F9' }}
                        />
                      </Box>

                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.3 }}>
                        {e.payee}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                        {e.description}
                      </Typography>

                      <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, mb: 1.5, border: '1px solid #E2E8F0' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 700 }}>
                          खर्च रकम (Expense Amount):
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#DC2626' }}>
                          Rs. {Number(e.amount).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ pt: 1, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748B' }}>
                      <span>माध्यम: <strong>{e.paymentMethod}</strong></span>
                      <span>मिति: <strong>{e.date}</strong></span>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Record Expense Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)',
            color: '#FFFFFF',
            py: 2.2,
            px: 3,
            borderBottom: '3px solid #F59E0B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2, color: '#FFFFFF' }}>
              + नयाँ खर्च प्रविष्टि (Record Center Expense)
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.74rem' }}>
              संस्थागत सञ्चालन, भाडा, सामग्री तथा प्रशासनिक खर्च दर्ता
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setOpenModal(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.85)',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)', color: '#FFFFFF' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, bgcolor: '#FFFFFF' }}>
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
        <DialogActions sx={{ p: 2.5, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button
            onClick={() => setOpenModal(false)}
            sx={{ fontWeight: 700, color: '#64748B', border: '1px solid #CBD5E1', borderRadius: 2, px: 2.5, textTransform: 'none', bgcolor: '#FFFFFF', '&:hover': { bgcolor: '#F1F5F9', color: '#0F172A' } }}
          >
            रद्द गर्नुहोस् (Cancel)
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveExpense}
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              color: '#FFFFFF',
              borderRadius: 2,
              px: 3,
              py: 0.8,
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
              textTransform: 'none',
              '&:hover': { background: 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)' }
            }}
          >
            खर्च सुरक्षित गर्नुहोस् (Save Expense)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
