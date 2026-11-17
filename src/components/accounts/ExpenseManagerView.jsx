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
  ToggleButtonGroup,
  useTheme,
  useMediaQuery
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CloseIcon from '@mui/icons-material/Close';

import { postDoubleEntryJournal, saveDB } from '../../services/storage';
import { ResponsiveDataView, StatusBadge } from '../common';

export default function ExpenseManagerView({ db, setDb, showToast }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      showToast('Please enter the payee and expense amount.', 'error');
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
        narration: `Operating Expense Payment (${voucherNo}): ${newExpense.description}`,
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
      showToast(`Expense voucher ${voucherNo} posted successfully!`);
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
    <Box sx={{ p: { xs: 1.5, sm: 2.2 } }}>
      {/* Slim 1-Row Executive Header Bar */}
      <Card
        elevation={0}
        sx={{
          py: { xs: 1.25, sm: 1.5 },
          px: { xs: 1.75, sm: 2.25 },
          mb: 1.75,
          borderRadius: 2.5,
          background: 'linear-gradient(135deg, #0f2e5a 0%, #1e3a8a 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(15, 46, 90, 0.16)'
        }}
      >
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.8,
                  bgcolor: 'rgba(245, 158, 11, 0.16)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <PointOfSaleIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  Operating Expenses &amp; Vendor Payments
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  Prabidhik School, Jorpati • Record rent, electricity, internet, raw materials, maintenance &amp; operating expenses
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: '15px !important' }} />}
                onClick={() => setOpenModal(true)}
                sx={{
                  bgcolor: '#f59e0b',
                  color: '#0f2e5a',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  px: 1.4,
                  py: 0.65,
                  whiteSpace: 'nowrap',
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#d97706', color: '#ffffff' }
                }}
              >
                + Record Expense
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* Compact Filter & Search Bar */}
      <Card elevation={0} sx={{ p: 1.25, mb: 1.75, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by Payee, Description, Voucher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: '#94A3B8', mr: 1, fontSize: 18 }} /> }}
            sx={{ minWidth: { xs: '100%', sm: 300 } }}
          />
          <TextField
            select
            size="small"
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 200 } }}
          >
            <MenuItem value="ALL">All Categories</MenuItem>
            <MenuItem value="Rent & Facilities">Rent &amp; Facilities</MenuItem>
            <MenuItem value="Training Materials">Training Materials</MenuItem>
            <MenuItem value="Utilities & Internet">Utilities &amp; Internet</MenuItem>
            <MenuItem value="Marketing & Counseling">Marketing &amp; Counseling</MenuItem>
            <MenuItem value="Office Supplies & Maintenance">Office Supplies &amp; Maintenance</MenuItem>
          </TextField>
          <Box sx={{ ml: { xs: 0, sm: 'auto' }, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#DC2626', fontSize: '0.8rem' }}>
              Total Expenses: Rs. {totalExpenseAmount.toLocaleString()}
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
                  py: 0.4,
                  fontWeight: 800,
                  fontSize: '0.72rem',
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
          </Box>
        </Stack>
      </Card>

      {/* Table View Mode */}
      {viewMode === 'table' && (
      <ResponsiveDataView
        rows={filtered}
        keyExtractor={(e) => e.id}
        emptyIcon={<ReceiptLongIcon sx={{ fontSize: 24 }} />}
        emptyTitle="No expenses found."
        emptySubtitle="Try adjusting your search or category filter."
        renderTable={() => (
          <Card elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <TableContainer>
              <Table size="small">
                <TableHead
                  sx={{
                    bgcolor: '#0F2E5A',
                    '& .MuiTableCell-head': {
                      bgcolor: '#0F2E5A !important',
                      color: '#FFFFFF !important',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      py: 1,
                      px: 1.25,
                      borderBottom: '2px solid #F59E0B',
                      whiteSpace: 'nowrap'
                    }
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, width: 130 }}>Voucher No.</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, width: 110 }}>Date</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Payee / Vendor</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, width: 170 }}>Category</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, width: 130 }}>Payment Method</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'right', width: 130 }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((e) => (
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
        renderCard={(e) => (
          <Paper
            elevation={0}
            sx={{
              p: 1.75,
              borderRadius: 2.5,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1.25 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }} noWrap>
                  {e.payee}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#DC2626' }}>
                  {e.voucherNo}
                </Typography>
              </Box>
              <StatusBadge label={e.category} tone="error" showDot />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1.25,
                py: 1.1,
                borderTop: '1px solid #F1F5F9',
                borderBottom: e.description ? '1px solid #F1F5F9' : 'none'
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 600 }}>
                  Expense Amount
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                  Rs. {Number(e.amount).toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 600 }}>
                  Method &amp; Date
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F172A', display: 'block' }}>
                  {e.paymentMethod}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontVariantNumeric: 'tabular-nums' }}>
                  {e.date}
                </Typography>
              </Box>
            </Box>

            {e.description && (
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1 }}>
                {e.description}
              </Typography>
            )}
          </Paper>
        )}
      />
      )}

      {/* Cards View Mode */}
      {viewMode === 'cards' && (
        <Box sx={{ mt: 1 }}>
          {filtered.length === 0 ? (
            <Card elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <ReceiptLongIcon sx={{ fontSize: 48, color: '#94A3B8', mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#64748B' }}>
                No expenses found.
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
                          Expense Amount:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#DC2626' }}>
                          Rs. {Number(e.amount).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ pt: 1, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748B' }}>
                      <span>Method: <strong>{e.paymentMethod}</strong></span>
                      <span>Date: <strong>{e.date}</strong></span>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Record Expense Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
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
              + Record Center Expense
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.74rem' }}>
              Register operating, rent, materials, and administrative expenses
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
                label="Date"
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
                label="Category"
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
                label="Payee / Vendor"
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
                label="Amount (in Rs.)"
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
                label="Payment Method"
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              >
                <MenuItem value="Cash">Cash on Hand (Counter Cash - 1010)</MenuItem>
                <MenuItem value="Fonepay / QR">Fonepay / QR (Bank - 1020)</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer (Bank - 1020)</MenuItem>
                <MenuItem value="eSewa">eSewa Wallet (1020)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                disabled
                label="Dr. Account Code"
                value={`${form.accountCode} - Operating Expense`}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Description / Remarks"
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
            Cancel
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
            Save Expense
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
