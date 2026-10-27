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
  const [bankName, setBankName] = useState('Global IME Bank (खाता: ०१२०००१२३४५)');
  const [slipReference, setSlipReference] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleBankChange = (code) => {
    setTargetBank(code);
    if (code === '1020') setBankName('Global IME Bank (खाता: ०१२०००१२३४५)');
    else setBankName('Nabil Bank Ltd. (खाता: ०१२३४५६७८९०)');
  };

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    const amt = Number(depositAmount) || 0;

    if (amt <= 0) {
      setErrorMsg('कृपया दाखिला गर्ने रकम खुलाउनुहोस्।');
      return;
    }

    if (amt > currentCashInHand) {
      setErrorMsg(`दराजमा रु. ${currentCashInHand.toLocaleString()} मात्र छ, सोभन्दा बढी दाखिला गर्न मिल्दैन।`);
      return;
    }

    const refNo = slipReference.trim() || `DEP-${Date.now().toString().slice(-6)}`;
    const narrationText = `काउन्टर नगदबाट बैंक दाखिला (Deposit to ${bankName}) - भौचर ${refNo}`;

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
      sub: 'काउन्टरबाट बैंक दाखिला (Contra Entry)',
      amount: amt,
      isInflow: false,
      date: today,
      method: 'Bank Deposit (भौतिक दाखिला)',
      remarks: remarks.trim() || 'दैनिक संकलित नगद बैंकमा दाखिला',
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
      showToast(`बैंक दाखिला रु. ${amt.toLocaleString()} सफलतापूर्वक सम्पन्न भयो (Contra Entry Posted).`, 'success');
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
              color: '#FFFFFF'
            }}
          >
            <AccountBalanceIcon sx={{ fontSize: '1.4rem' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.15rem', lineHeight: 1.2, color: '#FFFFFF' }}>
              काउन्टर नगद बैंक दाखिला (Deposit Cash to Bank)
            </Typography>
            <Typography variant="caption" sx={{ color: '#93C5FD', fontWeight: 600 }}>
              कन्ट्रा प्रविष्टि (Contra Entry) • दराजको नगद सिधै बैंक खातामा ट्रान्सफर
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} sx={{ color: '#93C5FD', '&:hover': { color: '#FFF' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleDepositSubmit}>
        <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
          {errorMsg && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 2, color: '#DC2626', fontWeight: 700, fontSize: '0.85rem' }}>
              {errorMsg}
            </Box>
          )}

          {/* Visual Transfer Flow: Cash Drawer -> Bank Account */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 3,
              bgcolor: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {/* Source */}
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>स्रोत खाता (Source)</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                💵 काउन्टर नगद (1010)
              </Typography>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800 }}>
                मौज्दात: Rs. {currentCashInHand.toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ px: 1, color: '#0F2E5A', display: 'flex', alignItems: 'center' }}>
              <ArrowForwardIcon />
            </Box>

            {/* Destination */}
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>दाखिला खाता (Target)</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                🏦 बैंक खाता ({targetBank})
              </Typography>
              <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 800 }}>
                {targetBank === '1020' ? 'Global IME Bank' : 'Nabil Bank'}
              </Typography>
            </Box>
          </Paper>

          {/* Target Bank Account Selector */}
          <Box sx={{ mb: 2.2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="दाखिला हुने बैंक खाता छान्नुहोस् (Select Bank Account)"
              value={targetBank}
              onChange={(e) => handleBankChange(e.target.value)}
              sx={{ bgcolor: '#FFFFFF', borderRadius: 2 }}
            >
              <MenuItem value="1020">🏦 ग्लोबल आइएमई बैंक (Global IME Bank - A/C ०१२०००१२३४५)</MenuItem>
              <MenuItem value="1021">🏦 नबिल बैंक लिमिटेड (Nabil Bank Ltd. - A/C ०१२३४५६७८९०)</MenuItem>
            </TextField>
          </Box>

          {/* Amount Input */}
          <Box sx={{ mb: 2.2 }}>
            <TextField
              fullWidth
              required
              type="number"
              label="बैंकमा दाखिला गरिने नगद रकम (Deposit Amount in Rs.)"
              value={depositAmount}
              onChange={(e) => {
                setDepositAmount(e.target.value);
                setErrorMsg('');
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs.</InputAdornment>
              }}
              helperText={`अधिकतम दाखिला गर्न मिल्ने रकम: Rs. ${currentCashInHand.toLocaleString()}`}
              sx={{ bgcolor: '#FFFFFF', borderRadius: 2 }}
            />
          </Box>

          {/* Bank Slip Reference No */}
          <Box sx={{ mb: 2.2 }}>
            <TextField
              fullWidth
              size="small"
              label="बैंक दाखिला भौचर / स्लिप नं. (Deposit Slip Ref No.)"
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
              sx={{ bgcolor: '#FFFFFF', borderRadius: 2 }}
            />
          </Box>

          {/* Remarks */}
          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            label="दाखिला कैफियत / टिप्पणी (Remarks)"
            placeholder="e.g. Deposited excess counter fee collection to Global IME Bank"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            sx={{ bgcolor: '#FFFFFF', borderRadius: 2 }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
          <Button onClick={onClose} sx={{ fontWeight: 700, color: '#64748B', textTransform: 'none' }}>
            रद्द गर्नुहोस् (Cancel)
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              fontWeight: 900,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)',
              boxShadow: '0 4px 14px rgba(15, 46, 90, 0.35)',
              borderRadius: 2.2,
              px: 3,
              py: 0.9,
              fontSize: '0.88rem'
            }}
          >
            🏦 बैंक दाखिला प्रमाणित गर्नुहोस् (Confirm Deposit)
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
