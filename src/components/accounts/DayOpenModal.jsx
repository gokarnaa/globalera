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
  Chip,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonIcon from '@mui/icons-material/Person';
import confetti from 'canvas-confetti';

import { saveDB } from '../../services/storage';

export default function DayOpenModal({ open, onClose, db, setDb, showToast, onDayOpened }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const today = new Date().toISOString().slice(0, 10);
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Get previous closing cash as default opening cash
  const lastClosingCash = db?.cashClosings?.[0]?.physicalCount ?? 44000;

  const [openingCash, setOpeningCash] = useState(String(lastClosingCash));
  const [cashierName, setCashierName] = useState('Authorized Cashier');
  const [openingNotes, setOpeningNotes] = useState('Counter opened after verifying morning opening cash.');

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
      showToast(`Day started! Counter cash (Rs. ${cashVal.toLocaleString()}) verified and opened.`, 'success');
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
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3.5,
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
            <LockOpenIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.05rem', sm: '1.15rem' }, lineHeight: 1.2, color: '#FFFFFF' }}>
              Day Open Counter
            </Typography>
            <Typography variant="caption" sx={{ color: '#CBD5E1', fontWeight: 500, display: 'block' }}>
              Date: {today} • Time: {currentTime} • Daily Fee Collection Open
            </Typography>
          </Box>
        </Box>

        <IconButton
          aria-label="Close day open modal"
          onClick={onClose}
          sx={{ color: '#CBD5E1', '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box
        component="form"
        onSubmit={handleConfirmOpen}
        sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
      >
        <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: '#F8FAFC', overflowY: 'auto' }}>
          {/* Section 1: Opening Balance Reference */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              mb: 2,
              borderRadius: 2,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF'
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
              Opening Balance Reference
            </Typography>
            <Box
              sx={{
                p: 1.75,
                borderRadius: 2,
                bgcolor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 800, textTransform: 'uppercase' }}>
                  Last Day Closing Balance
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#059669', mt: 0.2 }}>
                  Rs. {Number(lastClosingCash).toLocaleString()}
                </Typography>
              </Box>
              <Chip
                label="Opening Cash"
                size="small"
                sx={{ bgcolor: '#059669', color: '#FFF', fontWeight: 800 }}
              />
            </Box>
          </Paper>

          {/* Section 2: Counter Opening Details */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF'
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
              Counter Opening Details
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  type="number"
                  label="Opening Float Cash (in Rs.)"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountBalanceWalletIcon sx={{ color: '#059669' }} />
                      </InputAdornment>
                    )
                  }}
                  helperText="Actual drawer cash balance"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Opening Cashier / Staff Name"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#64748B' }} />
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
                  label="Opening Remarks"
                  value={openingNotes}
                  onChange={(e) => setOpeningNotes(e.target.value)}
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
            startIcon={<LockOpenIcon />}
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
            Open Day Counter
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
