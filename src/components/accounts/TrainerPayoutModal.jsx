import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Box,
  IconButton,
  Alert,
  Paper,
  InputAdornment,
  Divider,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PaymentsIcon from '@mui/icons-material/Payments';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import { useAuth } from '../../context/AuthContext';

export default function TrainerPayoutModal({
  open,
  onClose,
  onSavePayout,
  db,
  preselectedTrainerId = null
}) {
  const { currentUser } = useAuth();

  const [trainerId, setTrainerId] = useState('');
  const [payoutType, setPayoutType] = useState('COMMISSION'); // 'COMMISSION' or 'SALARY'
  const [groupId, setGroupId] = useState('');
  const [amount, setAmount] = useState('');
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().slice(0, 10));
  const [payoutMonth, setPayoutMonth] = useState(new Date().toISOString().slice(0, 7));
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [remarks, setRemarks] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const trainers = db?.trainers || [];
  const groups = db?.trainingGroups || [];
  const payments = db?.payments || [];
  const trainerPayouts = db?.trainerPayouts || [];

  // Trainer groups
  const assignedGroups = groups.filter((g) => g.trainerId === trainerId);

  // Group commission calculation:
  // Actual cash collected from students in this group * group.trainerCommissionPercent
  const getGroupCommissionData = (grpId) => {
    const grp = groups.find((g) => g.id === grpId);
    if (!grp) return { collected: 0, commPercent: 0, totalEarned: 0, totalPaid: 0, due: 0 };

    const commPercent = Number(grp.trainerCommissionPercent) || 25;

    // Actual payments collected for students in this group
    const groupCollected = payments
      .filter((p) => p.groupId === grpId)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const totalEarned = Math.round((groupCollected * commPercent) / 100);

    const totalPaid = trainerPayouts
      .filter((tp) => tp.trainerId === grp.trainerId && tp.groupId === grpId && tp.payoutType === 'COMMISSION')
      .reduce((sum, tp) => sum + (Number(tp.amount) || 0), 0);

    const due = Math.max(0, totalEarned - totalPaid);

    return {
      collected: groupCollected,
      commPercent,
      totalEarned,
      totalPaid,
      due
    };
  };

  useEffect(() => {
    if (!open) return;
    setErrorMsg('');
    const today = new Date().toISOString().slice(0, 10);
    setPayoutDate(today);
    setPayoutMonth(today.slice(0, 7));

    if (preselectedTrainerId) {
      setTrainerId(preselectedTrainerId);
      const trn = trainers.find((t) => t.id === preselectedTrainerId);
      if (trn?.remunerationType === 'SALARY') {
        setPayoutType('SALARY');
        setAmount(trn.monthlySalary || 25000);
        setRemarks(`Monthly salary disbursement for ${today.slice(0, 7)}`);
      } else {
        setPayoutType('COMMISSION');
        const firstGrp = groups.find((g) => g.trainerId === preselectedTrainerId);
        if (firstGrp) {
          setGroupId(firstGrp.id);
          const data = getGroupCommissionData(firstGrp.id);
          setAmount(data.due);
          setRemarks(`Commission payout for Batch ${firstGrp.groupCode || firstGrp.id}`);
        }
      }
    } else {
      setTrainerId('');
      setGroupId('');
      setAmount('');
      setRemarks('');
    }
  }, [open, preselectedTrainerId]);

  const handleTrainerChange = (selectedId) => {
    setTrainerId(selectedId);
    const trn = trainers.find((t) => t.id === selectedId);
    if (trn?.remunerationType === 'SALARY') {
      setPayoutType('SALARY');
      setAmount(trn.monthlySalary || 25000);
      setRemarks(`Monthly salary disbursement for ${payoutMonth}`);
    } else {
      setPayoutType('COMMISSION');
      const trnGroups = groups.filter((g) => g.trainerId === selectedId);
      if (trnGroups.length > 0) {
        setGroupId(trnGroups[0].id);
        const data = getGroupCommissionData(trnGroups[0].id);
        setAmount(data.due);
        setRemarks(`Commission payout for Batch ${trnGroups[0].groupCode || trnGroups[0].id}`);
      } else {
        setGroupId('');
        setAmount('');
      }
    }
  };

  const handleGroupChange = (grpId) => {
    setGroupId(grpId);
    const data = getGroupCommissionData(grpId);
    setAmount(data.due);
    const grp = groups.find((g) => g.id === grpId);
    setRemarks(`Commission payout for Batch ${grp?.groupCode || grpId}`);
  };

  const selectedTrainer = trainers.find((t) => t.id === trainerId);
  const selectedGroupCommission = (payoutType === 'COMMISSION' && groupId) ? getGroupCommissionData(groupId) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trainerId) {
      setErrorMsg('Please select a trainer.');
      return;
    }
    const payNum = Number(amount);
    if (!payNum || payNum <= 0) {
      setErrorMsg('Please enter a valid payout amount (Amount must be > 0).');
      return;
    }

    if (payoutType === 'COMMISSION' && selectedGroupCommission && payNum > selectedGroupCommission.due) {
      setErrorMsg(`Payout amount cannot exceed accrued commission balance (Rs. ${selectedGroupCommission.due.toLocaleString()}).`);
      return;
    }

    const yearStr = new Date().getFullYear();
    const existingVchNos = trainerPayouts
      .map((p) => {
        const match = p.voucherNo && p.voucherNo.match(/VCH-\d+-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextSeq = existingVchNos.length ? Math.max(...existingVchNos) + 1 : 1;
    const voucherNo = `VCH-${yearStr}-${String(nextSeq).padStart(4, '0')}`;

    const grpObj = groups.find((g) => g.id === groupId);

    const newPayout = {
      id: `TRP-${Date.now().toString().slice(-6)}`,
      voucherNo,
      trainerId: selectedTrainer.id,
      trainerName: selectedTrainer.name,
      payoutType,
      groupId: payoutType === 'COMMISSION' ? groupId : '',
      groupName: payoutType === 'COMMISSION' ? (grpObj?.groupCode || groupId) : '',
      amount: payNum,
      payoutDate,
      payoutMonth,
      paymentMethod: paymentMethod.split(' (')[0],
      remarks: remarks.trim() || 'Trainer Remuneration Disbursement',
      disbursedBy: currentUser?.name || 'Admin',
      createdAt: new Date().toISOString()
    };

    onSavePayout(newPayout);
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
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          background: 'linear-gradient(135deg, #78350F 0%, #B45309 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px solid #F59E0B'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            <PaymentsIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2 }}>
              Trainer Remuneration & Commission Payout
            </Typography>
            <Typography variant="caption" sx={{ color: '#FDE68A', fontWeight: 500 }}>
              Issue commission or monthly salary payout voucher
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#FDE68A', '&:hover': { color: '#FFF' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {/* Trainer Selector */}
          <TextField
            select
            fullWidth
            required
            label="Select Trainer"
            value={trainerId}
            onChange={(e) => handleTrainerChange(e.target.value)}
            sx={{ mb: 2.5 }}
          >
            <MenuItem value="">
              <em>-- Select Trainer --</em>
            </MenuItem>
            {trainers.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name} ({t.remunerationType === 'SALARY' ? `Monthly Salary: Rs. ${(t.monthlySalary || 25000).toLocaleString()}` : 'Commission Model'})
              </MenuItem>
            ))}
          </TextField>

          {/* Payout Type Selector */}
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Payout Type"
                value={payoutType}
                onChange={(e) => setPayoutType(e.target.value)}
              >
                <MenuItem value="COMMISSION">Batch Commission (% Commission)</MenuItem>
                <MenuItem value="SALARY">Fixed Monthly Salary</MenuItem>
              </TextField>
            </Grid>

            {payoutType === 'COMMISSION' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Assigned Training Batch"
                  value={groupId}
                  onChange={(e) => handleGroupChange(e.target.value)}
                >
                  <MenuItem value="">
                    <em>-- Select Batch --</em>
                  </MenuItem>
                  {assignedGroups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.groupCode || g.id} (Commission: {g.trainerCommissionPercent || 25}%)
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
          </Grid>

          {/* Commission Calculation Overview Card */}
          {payoutType === 'COMMISSION' && selectedGroupCommission && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2.5,
                bgcolor: '#FEF3C7',
                border: '1.5px solid #FCD34D'
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#92400E', mb: 1 }}>
                Actual Collected Fee & Commission Calculation
              </Typography>
              <Grid container spacing={1} sx={{ fontSize: '0.85rem' }}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#78350F', display: 'block' }}>Fee Collected:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#92400E' }}>Rs. {selectedGroupCommission.collected.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#78350F', display: 'block' }}>Commission Rate:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#92400E' }}>{selectedGroupCommission.commPercent}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#78350F', display: 'block' }}>Total Accrued Commission:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#047857' }}>Rs. {selectedGroupCommission.totalEarned.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#78350F', display: 'block' }}>Payable Balance Due:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900, color: '#B45309' }}>Rs. {selectedGroupCommission.due.toLocaleString()}</Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Payout Amount (Rs.)"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MonetizationOnIcon sx={{ color: '#B45309' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
                <MenuItem value="Fonepay / QR">Fonepay / QR</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Payout Date"
                InputLabelProps={{ shrink: true }}
                value={payoutDate}
                onChange={(e) => setPayoutDate(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="month"
                label="Month"
                InputLabelProps={{ shrink: true }}
                value={payoutMonth}
                onChange={(e) => setPayoutMonth(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                placeholder="e.g. Batch BT-01 commission or monthly salary payout..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NoteAltIcon sx={{ color: '#64748B' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
          <Button onClick={onClose} sx={{ color: '#64748B', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!trainerId || !amount || Number(amount) <= 0}
            startIcon={<PaymentsIcon />}
            sx={{
              background: 'linear-gradient(135deg, #78350F 0%, #B45309 100%)',
              fontWeight: 800,
              px: 3.5,
              py: 1,
              borderRadius: 2.5,
              boxShadow: '0 4px 14px rgba(180, 83, 9, 0.35)'
            }}
          >
            Disburse Payout
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
