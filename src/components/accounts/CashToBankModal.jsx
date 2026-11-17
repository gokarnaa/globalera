import React, { useState } from 'react';
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
  Chip,
  IconButton,
  InputAdornment,
  MenuItem
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CloseIcon from '@mui/icons-material/Close';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import confetti from 'canvas-confetti';

import { saveDB, postDoubleEntryJournal } from '../../services/storage';

export default function CashToBankModal({ open, onClose, db, setDb, showToast, currentCashInHand = 0 }) {
  const today = new Date().toISOString().slice(0, 10);

  const [depositAmount, setDepositAmount] = useState('');
  const [targetBank, setTargetBank] = useState('1020'); // 1020: Bank Account
  const [bankName, setBankName] = useState('Global IME Bank (A/C: 01200012345)');
  const [slipReference, setSlipReference] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleBankChange = (code) => {
    setTargetBank(code);
    if (code === '1020') setBankName('Global IME Bank (A/C: 01200012345)');
    else setBankName('Nabil Bank Ltd. (A/C: 01234567890)');
  };

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    const amt = Number(depositAmount) || 0;

    if (amt <= 0) {
      setErrorMsg('Please enter the deposit amount.');
      return;
    }

    if (amt > currentCashInHand) {
      setErrorMsg(`Only Rs. ${currentCashInHand.toLocaleString()} is available in the drawer; cannot deposit more than that.`);
      return;
    }

    const refNo = slipReference.trim() || `DEP-${Date.now().toString().slice(-6)}`;
    const narrationText = `Bank Deposit from Counter Cash (Deposit to ${bankName}) - Voucher ${refNo}`;

    // Post Contra Double-Entry Journal:
    // Debit: Bank Account (1020)
    // Credit: Cash in Hand (1010)
    let nextDb = db;
    try {
      const { nextDb: updatedJournalDb } = postDoubleEntryJournal(nextDb, {
        narration: narrationText,
        lines: [
          {
            accountCode: targetBank,
            debit: amt,
            credit: 0,
            lineNarration: `Bank Deposit via slip ${refNo}`
          },
          {
            accountCode: '1010',
            debit: 0,
            credit: amt,
            lineNarration: 'Counter cash reduction for bank deposit'
          }
        ],
        sourceModule: 'BANK_DEPOSIT',
        sourceId: refNo,
        entryDate: today
      });
      nextDb = updatedJournalDb;
    } catch (err) {
      console.warn('Bank deposit auto journal warning:', err);
    }

    // Also record transaction into db.transactions
    const newTxn = {
      id: `TXN-DEP-${Date.now()}`,
      refNo,
      type: 'BANK_DEPOSIT',
      name: bankName,
      sub: 'Bank Deposit from Counter (Contra Entry)',
      amount: amt,
      isInflow: false,
      date: today,
      method: 'Bank Deposit (Physical Deposit)',
      remarks: remarks.trim() || 'Daily collected cash deposited to bank',
      createdAt: new Date().toISOString()
    };

    nextDb = {
      ...nextDb,
      transactions: [newTxn, ...(nextDb.transactions || [])]
    };

    saveDB(nextDb);
    setDb(nextDb);

    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    } catch (e) {
      // ignore
    }

    if (showToast) {
      showToast(`Bank deposit of Rs. ${amt.toLocaleString()} completed successfully (Contra Entry Posted).`, 'success');
    }

    onClose();
    setDepositAmount('');
    setSlipReference('');
    setRemarks('');
    setErrorMsg('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
      <DialogTitle
        sx={{
          m: 0,
          px: { xs: 2, sm: 2.5 },
          py: 2,
          background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px solid #F59E0B'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: 'rgba(245, 158, 11, 0.18)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B',
              flexShrink: 0
            }}
          >
            <AccountBalanceIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.05rem', sm: '1.15rem' }, lineHeight: 1.2, color: '#FFFFFF' }}>
              Deposit Cash to Bank
            </Typography>
            <Typography variant="caption" sx={{ color: '#CBD5E1', fontWeight: 500, display: 'block' }}>
              Contra Entry • Direct transfer of drawer cash to bank account
            </Typography>
          </Box>
        </Box>

        <IconButton
          aria-label="Close cash to bank modal"
          onClick={onClose}
          sx={{ color: '#CBD5E1', '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box
        component="form"
        onSubmit={handleDepositSubmit}
        sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
      >
        <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: '#F8FAFC', overflowY: 'auto' }}>
          {errorMsg && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 2, color: '#DC2626', fontWeight: 700, fontSize: '0.85rem' }}>
              {errorMsg}
            </Box>
          )}

          {/* Section 1: Contra Transfer Flow */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              mb: 2,
              borderRadius: 2,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0'
            }}
          >
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#64748B',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                mb: 1.2
              }}
            >
              Contra Transfer Flow
            </Typography>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: { xs: 1.25, sm: 1 }
              }}
            >
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>Source Account</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                  Counter Cash (1010)
                </Typography>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800 }}>
                  Balance: Rs. {currentCashInHand.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ px: 1, color: '#0F2C59', display: 'flex', alignItems: 'center', transform: { xs: 'rotate(90deg)', sm: 'none' } }}>
                <ArrowForwardIcon />
              </Box>

              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>Target Account</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2C59' }}>
                  Bank Account ({targetBank})
                </Typography>
                <Typography variant="caption" sx={{ color: '#1E3A8A', fontWeight: 800 }}>
                  {targetBank === '1020' ? 'Global IME Bank' : 'Nabil Bank'}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Section 2: Deposit & Slip Details */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0'
            }}
          >
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#64748B',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                mb: 1.5
              }}
            >
              Deposit &amp; Slip Details
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Select Bank Account"
                  value={targetBank}
                  onChange={(e) => handleBankChange(e.target.value)}
                >
                  <MenuItem value="1020">Global IME Bank (A/C 01200012345)</MenuItem>
                  <MenuItem value="1021">Nabil Bank Ltd. (A/C 01234567890)</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  type="number"
                  label="Deposit Amount (in Rs.)"
                  value={depositAmount}
                  onChange={(e) => {
                    setDepositAmount(e.target.value);
                    setErrorMsg('');
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs.</InputAdornment>
                  }}
                  helperText={`Max depositable: Rs. ${currentCashInHand.toLocaleString()}`}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Deposit Slip Ref No."
                  placeholder="e.g. GIME-DEP-84920"
                  value={slipReference}
                  onChange={(e) => setSlipReference(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ReceiptLongIcon sx={{ color: '#64748B' }} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Remarks"
                  placeholder="e.g. Deposited excess counter fee collection to Global IME Bank"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
          <Button onClick={onClose} sx={{ fontWeight: 700, color: '#64748B', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<AccountBalanceIcon />}
            sx={{
              fontWeight: 800,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
              boxShadow: '0 4px 14px rgba(15, 44, 89, 0.3)',
              borderRadius: 2,
              px: 3,
              py: 1
            }}
          >
            Confirm Deposit
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
