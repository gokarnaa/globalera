import React, { useState, useEffect } from 'react';
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
  InputAdornment
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import confetti from 'canvas-confetti';

import { saveDB } from '../../services/storage';

export default function DayOpenModal({ open, onClose, db, setDb, showToast, onDayOpened }) {
  const today = new Date().toISOString().slice(0, 10);
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Get previous closing cash as default opening cash
  const lastClosingCash = db?.cashClosings?.[0]?.physicalCount ?? 44000;

  const [openingCash, setOpeningCash] = useState(String(lastClosingCash));
  const [cashierName, setCashierName] = useState('सुनिता शर्मा (क्यासियर)');
  const [openingNotes, setOpeningNotes] = useState('काउन्टर बिहानको सुरुवाती नगद रुजु गरी खोलियो।');

  useEffect(() => {
    if (open) {
      const prev = db?.cashClosings?.[0]?.physicalCount ?? 44000;
      setOpeningCash(String(prev));
    }
  }, [open, db]);

  const handleConfirmOpen = (e) => {
    e.preventDefault();
    const cashVal = Number(openingCash) || 0;

    const newCounterStatus = {
      isOpen: true,
      openedAt: new Date().toISOString(),
      openedDate: today,
      openedTime: currentTime,
      openedBy: cashierName.trim() || 'Front Desk Cashier',
      openingCash: cashVal,
      notes: openingNotes.trim()
    };

    const nextDb = {
      ...db,
      counterStatus: newCounterStatus
    };

    saveDB(nextDb);
    setDb(nextDb);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {
      // ignore
    }

    if (showToast) {
      showToast(`दिन सुरु भयो! काउन्टर नगद (Rs. ${cashVal.toLocaleString()}) प्रमाणित भई खुल्ला भयो।`, 'success');
    }

    if (onDayOpened) {
      onDayOpened(newCounterStatus);
    }

    onClose();
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
      {/* Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: 2.2,
          background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #34D399'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            <LockOpenIcon sx={{ fontSize: '1.4rem' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.15rem', lineHeight: 1.2, color: '#FFFFFF' }}>
              दिन सुरु तथा काउन्टर ओपनिङ (Day Open Counter)
            </Typography>
            <Typography variant="caption" sx={{ color: '#D1FAE5', fontWeight: 600 }}>
              मिति: {today} • समय: {currentTime} • दैनिक शुल्क संकलन खुल्ला
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} sx={{ color: '#D1FAE5', '&:hover': { color: '#FFF' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleConfirmOpen}>
        <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5 }}>
            बिहान काउन्टर सुरु गर्दा दराजमा रहेको सुरुवाती मौज्दात (Float Cash / Petty Cash) रुजु गरी काउन्टर खोल्नुहोस्:
          </Typography>

          {/* Previous Closing Cash Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2.5
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 800, textTransform: 'uppercase' }}>
                अघिल्लो दिनको अन्तिम नगद (Last Day Closing Balance)
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#059669', mt: 0.3 }}>
                Rs. {Number(lastClosingCash).toLocaleString()}
              </Typography>
            </Box>
            <Chip
              label="सुरुवाती क्यास"
              size="small"
              sx={{ bgcolor: '#059669', color: '#FFF', fontWeight: 800 }}
            />
          </Paper>

          {/* Cash Input */}
          <Box sx={{ mb: 2.5 }}>
            <TextField
              fullWidth
              required
              type="number"
              label="काउन्टरमा रहेको सुरुवाती नगद (Opening Float Cash in Rs.)"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountBalanceWalletIcon sx={{ color: '#059669' }} />
                  </InputAdornment>
                )
              }}
              helperText="दराजमा अहिले रहेको खुद्रा तथा नोटको वास्तविक मौज्दात"
              sx={{ bgcolor: '#FFFFFF', borderRadius: 2 }}
            />
          </Box>

          {/* Cashier Name */}
          <Box sx={{ mb: 2.5 }}>
            <TextField
              fullWidth
              required
              label="काउन्टर खोल्ने क्यासियर / कर्मचारीको नाम"
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#64748B' }} />
                  </InputAdornment>
                )
              }}
              sx={{ bgcolor: '#FFFFFF', borderRadius: 2 }}
            />
          </Box>

          {/* Opening Notes */}
          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            label="सुरुवाती कैफियत / टिप्पणी (Opening Remarks)"
            value={openingNotes}
            onChange={(e) => setOpeningNotes(e.target.value)}
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
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              borderRadius: 2.2,
              px: 3,
              py: 0.9,
              fontSize: '0.88rem'
            }}
          >
            🟢 काउन्टर खोल्नुहोस् (Open Day Counter)
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
