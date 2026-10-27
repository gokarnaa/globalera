import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Grid,
  Paper,
  Divider,
  Alert,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Stack,
  Tooltip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalculateIcon from '@mui/icons-material/Calculate';

import { saveDB } from '../../services/storage';

export const DENOMINATION_RATES = [1000, 500, 100, 50, 20, 10, 5];

export default function DailyCashClosingModal({ open, onClose, db, setDb, showToast, onDayClosed }) {
  const today = new Date().toISOString().slice(0, 10);
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Inflows and Outflows calculation
  const openingBalance = db?.counterStatus?.openingCash || 44000;

  const todayCashIn = useMemo(() => {
    return (db.payments || [])
      .filter((p) => (p.paymentDate === today || (p.createdAt || '').slice(0, 10) === today) && p.paymentMethod?.toLowerCase().includes('cash'))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [db.payments, today]);

  const todayCashOut = useMemo(() => {
    return (db.expenses || [])
      .filter((e) => e.date === today && e.paymentMethod?.toLowerCase().includes('cash'))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [db.expenses, today]);

  const expectedClosing = openingBalance + todayCashIn - todayCashOut;

  // 2. Denominations State (Note counts)
  const [denominations, setDenominations] = useState({
    1000: '',
    500: '',
    100: '',
    50: '',
    20: '',
    10: '',
    5: '',
    coins: ''
  });

  const [closingNotes, setClosingNotes] = useState('');
  const [showPrintView, setShowPrintView] = useState(false);
  const [savedClosingRecord, setSavedClosingRecord] = useState(null);

  // Initialize realistic notes count when modal opens to assist the cashier
  useEffect(() => {
    if (open) {
      setShowPrintView(false);
      setSavedClosingRecord(null);

      // Distribute expectedClosing into notes as a smart starting template
      let remaining = expectedClosing;
      const initialCounts = { 1000: 0, 500: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, coins: 0 };

      if (remaining > 0) {
        initialCounts[1000] = Math.floor(remaining / 1000);
        remaining %= 1000;
        initialCounts[500] = Math.floor(remaining / 500);
        remaining %= 500;
        initialCounts[100] = Math.floor(remaining / 100);
        remaining %= 100;
        initialCounts[50] = Math.floor(remaining / 50);
        remaining %= 50;
        initialCounts[20] = Math.floor(remaining / 20);
        remaining %= 20;
        initialCounts[10] = Math.floor(remaining / 10);
        remaining %= 10;
        initialCounts[5] = Math.floor(remaining / 5);
        remaining %= 5;
        initialCounts.coins = remaining;
      }

      setDenominations({
        1000: initialCounts[1000] || '',
        500: initialCounts[500] || '',
        100: initialCounts[100] || '',
        50: initialCounts[50] || '',
        20: initialCounts[20] || '',
        10: initialCounts[10] || '',
        5: initialCounts[5] || '',
        coins: initialCounts.coins || ''
      });
    }
  }, [open, expectedClosing]);

  // Handle note count input change
  const handleDenominationChange = (rate, value) => {
    const cleanVal = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    setDenominations((prev) => ({
      ...prev,
      [rate]: cleanVal
    }));
  };

  // Compute total physical cash from denominations
  const { physicalCount, totalNotesCount, rateSubtotals } = useMemo(() => {
    let sum = 0;
    let notes = 0;
    const subs = {};

    DENOMINATION_RATES.forEach((rate) => {
      const count = Number(denominations[rate]) || 0;
      const sub = rate * count;
      subs[rate] = sub;
      sum += sub;
      notes += count;
    });

    const coinVal = Number(denominations.coins) || 0;
    sum += coinVal;

    return { physicalCount: sum, totalNotesCount: notes, rateSubtotals: subs };
  }, [denominations]);

  const variance = physicalCount - expectedClosing;

  // Handle confirmation and closing the day
  const handleConfirmClose = () => {
    const closingRecord = {
      id: `CSH-CLOSE-${Date.now()}`,
      closingDate: today,
      closingTime: currentTime,
      openingBalance,
      cashReceived: todayCashIn,
      cashPaid: todayCashOut,
      expectedClosing,
      physicalCount,
      variance,
      denominations: {
        1000: Number(denominations[1000]) || 0,
        500: Number(denominations[500]) || 0,
        100: Number(denominations[100]) || 0,
        50: Number(denominations[50]) || 0,
        20: Number(denominations[20]) || 0,
        10: Number(denominations[10]) || 0,
        5: Number(denominations[5]) || 0,
        coins: Number(denominations.coins) || 0
      },
      notes: closingNotes.trim() || (variance === 0 ? 'काउन्टर नगद पूर्ण रूपमा मिलेको (Matched)' : `नगद फरक (Variance): Rs. ${variance}`),
      closedBy: db?.counterStatus?.openedBy || 'सुनिता शर्मा (क्यासियर)',
      closedAt: new Date().toISOString(),
      status: variance === 0 ? 'EXACT_MATCH' : variance > 0 ? 'EXCESS' : 'SHORTAGE'
    };

    const nextDb = {
      ...db,
      cashClosings: [closingRecord, ...(db.cashClosings || [])],
      counterStatus: {
        isOpen: false,
        closedAt: new Date().toISOString(),
        closedBy: closingRecord.closedBy,
        closingCash: physicalCount,
        openingCash: physicalCount // becomes opening cash for tomorrow!
      }
    };

    saveDB(nextDb);
    setDb(nextDb);
    setSavedClosingRecord(closingRecord);
    setShowPrintView(true);

    if (showToast) {
      showToast(`दैनिक काउन्टर नगद क्लोजिङ (Rs. ${physicalCount.toLocaleString()}) प्रमाणित भई दिन बन्द भयो!`, 'success');
    }
    if (onDayClosed) {
      onDayClosed(closingRecord);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
          border: '1px solid rgba(226, 232, 240, 0.8)'
        }
      }}
    >
      {/* Top Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: 2.2,
          background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #F59E0B'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <LockIcon sx={{ fontSize: '1.4rem' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.15rem', lineHeight: 1.2, color: '#FFFFFF' }}>
              दैनिक काउन्टर नगद क्लोजिङ तथा नोट गणना (Daily Cash Closing)
            </Typography>
            <Typography variant="caption" sx={{ color: '#93C5FD', fontWeight: 600 }}>
              मिति: {today} • समय: {currentTime} • भौतिक नोट गणना (Denomination Sheet)
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} sx={{ color: '#93C5FD', '&:hover': { color: '#FFF' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
        {/* Printable Closing Slip View (Shown after closing or when triggered) */}
        {showPrintView && savedClosingRecord ? (
          <Box id="printable-cash-closing" sx={{ bgcolor: '#FFFFFF', p: 3, borderRadius: 3, border: '1.5px solid #0F2E5A' }}>
            <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '2px dashed #CBD5E1', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                GLOBAL ERA TECHNICAL SCHOOL
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                ग्लोबल एरा प्राविधिक स्कुल • जोरपाटी, काठमाडौं
              </Typography>
              <Chip
                label="दैनिक काउन्टर नगद क्लोजिङ भौचर (DAILY CASH CLOSING & DENOMINATION SLIP)"
                size="small"
                sx={{ bgcolor: '#0F2E5A', color: '#FFF', fontWeight: 900, fontSize: '0.72rem', mt: 1 }}
              />
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#475569' }}>
                क्लोजिङ नं: <strong>{savedClosingRecord.id}</strong> • मिति: <strong>{savedClosingRecord.closingDate}</strong> ({savedClosingRecord.closingTime})
              </Typography>
            </Box>

            {/* Financial Summary */}
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
              <Grid item xs={3}>
                <Paper elevation={0} sx={{ p: 1.2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>सुरु मौज्दात</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Rs. {savedClosingRecord.openingBalance.toLocaleString()}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper elevation={0} sx={{ p: 1.2, bgcolor: '#ECFDF5', border: '1px solid #A7F3D0', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#059669' }}>नगद प्राप्ति (+)</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>Rs. {savedClosingRecord.cashReceived.toLocaleString()}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper elevation={0} sx={{ p: 1.2, bgcolor: '#FEF2F2', border: '1px solid #FECACA', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#DC2626' }}>नगद खर्च (-)</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#DC2626' }}>Rs. {savedClosingRecord.cashPaid.toLocaleString()}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper elevation={0} sx={{ p: 1.2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#1E40AF' }}>हुनुपर्ने मौज्दात</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#1E40AF' }}>Rs. {savedClosingRecord.expectedClosing.toLocaleString()}</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Denomination Breakdown Table */}
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A', mb: 1 }}>
              💵 भौतिक नोट गणना विवरण (Physical Cash Denomination):
            </Typography>
            <TableContainer sx={{ border: '1px solid #CBD5E1', borderRadius: 2, mb: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#0F2E5A' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#FFF !important', fontWeight: 900 }}>दर (Rate)</TableCell>
                    <TableCell align="center" sx={{ color: '#FFF !important', fontWeight: 900 }}>थान (Count)</TableCell>
                    <TableCell align="right" sx={{ color: '#FFF !important', fontWeight: 900 }}>जम्मा रकम (Sub-Total)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {DENOMINATION_RATES.map((r) => (
                    <TableRow key={r}>
                      <TableCell sx={{ fontWeight: 800 }}>रु. {r}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                        {savedClosingRecord.denominations[r] || 0}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                        Rs. {(r * (savedClosingRecord.denominations[r] || 0)).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>सिक्का तथा खुद्रा</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>-</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                      Rs. {(savedClosingRecord.denominations.coins || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                    <TableCell sx={{ fontWeight: 900, fontSize: '0.95rem' }}>कुल भौतिक नगद (Grand Total)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900 }}>
                      {Object.keys(savedClosingRecord.denominations).filter(k => k !== 'coins').reduce((sum, k) => sum + savedClosingRecord.denominations[k], 0)} थान
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, fontSize: '1rem', color: '#059669' }}>
                      Rs. {savedClosingRecord.physicalCount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Reconciliation Variance */}
            <Box sx={{ p: 1.5, bgcolor: savedClosingRecord.variance === 0 ? '#ECFDF5' : '#FEF2F2', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: savedClosingRecord.variance === 0 ? '#065F46' : '#991B1B' }}>
                रुजु स्थिति: {savedClosingRecord.variance === 0 ? '✓ हिसाब पूर्ण रूपमा मिलेको (Exact Match)' : `फरक (Variance): Rs. ${savedClosingRecord.variance.toLocaleString()}`}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                कैफियत: {savedClosingRecord.notes}
              </Typography>
            </Box>

            {/* Signatures */}
            <Grid container spacing={4} sx={{ pt: 3, borderTop: '1px dashed #CBD5E1' }}>
              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ borderBottom: '1px solid #475569', pb: 0.5, mb: 0.5, minHeight: 25 }} />
                <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                  {savedClosingRecord.closedBy}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>काउन्टर क्यासियर (Cashier)</Typography>
              </Grid>
              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ borderBottom: '1px solid #475569', pb: 0.5, mb: 0.5, minHeight: 25 }} />
                <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>लेखा अधिकृत</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>प्रमाणित गर्ने (Accountant)</Typography>
              </Grid>
              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ borderBottom: '1px solid #475569', pb: 0.5, mb: 0.5, minHeight: 25 }} />
                <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>क्याम्पस प्रमुख / निर्देशक</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>स्वीकृत (Campus Chief)</Typography>
              </Grid>
            </Grid>
          </Box>
        ) : (
          /* Normal Denomination Input Mode */
          <Box>
            {/* Step 1: System Cash Status Cards */}
            <Grid container spacing={2} sx={{ mb: 2.8 }}>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>सुरु मौज्दात (Opening)</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A' }}>Rs. {openingBalance.toLocaleString()}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>नगद संकलन (+)</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#059669' }}>Rs. {todayCashIn.toLocaleString()}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 700 }}>नगद खर्च (-)</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#DC2626' }}>Rs. {todayCashOut.toLocaleString()}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: '#EEF2FF', border: '1.5px solid #C7D2FE', borderRadius: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#4338CA', fontWeight: 800 }}>हुनुपर्ने अन्तिम नगद</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#1E40AF', fontSize: '1.1rem' }}>Rs. {expectedClosing.toLocaleString()}</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Step 2: Denomination Sheet (2 Columns Table) */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', mb: 2.8 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalculateIcon sx={{ color: '#0F2E5A' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A' }}>
                    भौतिक नोट गणना क्यालकुलेटर (Physical Cash Denomination Counter):
                  </Typography>
                </Box>
                <Chip
                  label={`जम्मा थान: ${totalNotesCount} नोटहरू`}
                  size="small"
                  sx={{ fontWeight: 800, bgcolor: '#F1F5F9', color: '#0F2E5A' }}
                />
              </Box>

              <Grid container spacing={2}>
                {/* Column 1: Higher Denominations (1000, 500, 100, 50) */}
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1.2}>
                    {[1000, 500, 100, 50].map((rate) => (
                      <Box
                        key={rate}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1,
                          bgcolor: '#F8FAFC',
                          borderRadius: 2,
                          border: '1px solid #E2E8F0'
                        }}
                      >
                        <Typography sx={{ fontWeight: 800, color: '#0F172A', minWidth: 80, fontSize: '0.88rem' }}>
                          रु. {rate}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>×</Typography>
                          <TextField
                            size="small"
                            type="number"
                            placeholder="०"
                            value={denominations[rate]}
                            onChange={(e) => handleDenominationChange(rate, e.target.value)}
                            inputProps={{ min: 0, style: { textAlign: 'center', fontWeight: 800, width: 60, padding: '4px 6px' } }}
                            sx={{ bgcolor: '#FFFFFF', borderRadius: 1.5 }}
                          />
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>=</Typography>
                          <Typography sx={{ fontWeight: 900, color: '#0F2E5A', minWidth: 90, textAlign: 'right', fontSize: '0.88rem' }}>
                            Rs. {(rateSubtotals[rate] || 0).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Grid>

                {/* Column 2: Lower Denominations (20, 10, 5, Coins) */}
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1.2}>
                    {[20, 10, 5].map((rate) => (
                      <Box
                        key={rate}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1,
                          bgcolor: '#F8FAFC',
                          borderRadius: 2,
                          border: '1px solid #E2E8F0'
                        }}
                      >
                        <Typography sx={{ fontWeight: 800, color: '#0F172A', minWidth: 80, fontSize: '0.88rem' }}>
                          रु. {rate}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>×</Typography>
                          <TextField
                            size="small"
                            type="number"
                            placeholder="०"
                            value={denominations[rate]}
                            onChange={(e) => handleDenominationChange(rate, e.target.value)}
                            inputProps={{ min: 0, style: { textAlign: 'center', fontWeight: 800, width: 60, padding: '4px 6px' } }}
                            sx={{ bgcolor: '#FFFFFF', borderRadius: 1.5 }}
                          />
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>=</Typography>
                          <Typography sx={{ fontWeight: 900, color: '#0F2E5A', minWidth: 90, textAlign: 'right', fontSize: '0.88rem' }}>
                            Rs. {(rateSubtotals[rate] || 0).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    ))}

                    {/* Coins Row */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1,
                        bgcolor: '#F8FAFC',
                        borderRadius: 2,
                        border: '1px solid #E2E8F0'
                      }}
                    >
                      <Typography sx={{ fontWeight: 800, color: '#0F172A', minWidth: 80, fontSize: '0.85rem' }}>
                        खुद्रा / सिक्का
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>Rs.</Typography>
                        <TextField
                          size="small"
                          type="number"
                          placeholder="०"
                          value={denominations.coins}
                          onChange={(e) => handleDenominationChange('coins', e.target.value)}
                          inputProps={{ min: 0, style: { textAlign: 'right', fontWeight: 800, width: 85, padding: '4px 6px' } }}
                          sx={{ bgcolor: '#FFFFFF', borderRadius: 1.5 }}
                        />
                        <Typography sx={{ fontWeight: 900, color: '#0F2E5A', minWidth: 90, textAlign: 'right', fontSize: '0.88rem' }}>
                          Rs. {(Number(denominations.coins) || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>

            {/* Step 3: Variance & Comparison Banner */}
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: 2.5,
                bgcolor: variance === 0 ? '#ECFDF5' : variance > 0 ? '#EFF6FF' : '#FEF2F2',
                border: variance === 0 ? '1.5px solid #A7F3D0' : variance > 0 ? '1.5px solid #BFDBFE' : '1.5px solid #FECACA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2.5
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  गनिएको जम्मा भौतिक नगद (Physical Count)
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: variance === 0 ? '#059669' : variance > 0 ? '#1E40AF' : '#DC2626' }}>
                  Rs. {physicalCount.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Chip
                  label={
                    variance === 0
                      ? '✓ हिसाब पूर्ण रूपमा मिलेको (Exact Match)'
                      : variance > 0
                      ? `बढी नगद (Excess: +Rs. ${variance.toLocaleString()})`
                      : `घटी नगद (Shortage: -Rs. ${Math.abs(variance).toLocaleString()})`
                  }
                  size="small"
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    bgcolor: variance === 0 ? '#10B981' : variance > 0 ? '#3B82F6' : '#EF4444',
                    color: '#FFFFFF',
                    py: 0.5,
                    px: 1
                  }}
                />
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#64748B', fontWeight: 600 }}>
                  सिस्टमले रु. {expectedClosing.toLocaleString()} अपेक्षा गरेको छ
                </Typography>
              </Box>
            </Paper>

            {/* Step 4: Closing Notes */}
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="क्लोजिङ कैफियत / टिप्पणी (Closing Notes)"
              placeholder="e.g. Counter closed successfully. Cash verified and locked in institute vault."
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              sx={{ bgcolor: '#FFFFFF', borderRadius: 2 }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        {showPrintView ? (
          <>
            <Button
              variant="outlined"
              onClick={() => setShowPrintView(false)}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              &larr; विवरणमा फर्कनुहोस्
            </Button>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{
                  bgcolor: '#F59E0B',
                  color: '#0F2E5A',
                  fontWeight: 900,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#D97706' }
                }}
              >
                A4 क्लोजिङ स्लिप प्रिन्ट गर्नुहोस्
              </Button>
              <Button
                variant="contained"
                onClick={onClose}
                sx={{
                  bgcolor: '#0F2E5A',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  textTransform: 'none'
                }}
              >
                सम्पन्न (Done)
              </Button>
            </Stack>
          </>
        ) : (
          <>
            <Button onClick={onClose} sx={{ fontWeight: 700, color: '#64748B', textTransform: 'none' }}>
              रद्द गर्नुहोस् (Cancel)
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmClose}
              sx={{
                fontWeight: 900,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)',
                boxShadow: '0 4px 14px rgba(15, 46, 90, 0.35)',
                borderRadius: 2.2,
                px: 2.8,
                py: 0.9,
                fontSize: '0.88rem'
              }}
            >
              🔒 दिन बन्द प्रमाणित गर्नुहोस् (Confirm & Lock Day Close)
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
