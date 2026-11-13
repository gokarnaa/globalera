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
  Stack,
  Chip,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { sendMetaWhatsAppMessage } from '../../services/whatsappCloudApi';

export const PAYMENT_METHODS = [
  'Cash',
  'Fonepay / QR',
  'eSewa',
  'Khalti',
  'Bank Transfer',
  'Cheque'
];

export default function RecordPaymentModal({
  open,
  onClose,
  onSavePayment,
  db,
  preselectedStudentId = null
}) {
  const { currentUser } = useAuth();

  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMonth, setPaymentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [paymentMethod, setPaymentMethod] = useState('Fonepay / QR');
  const [remarks, setRemarks] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  const students = db?.students || [];
  const courses = db?.courses || [];
  const groups = db?.trainingGroups || [];
  const payments = db?.payments || [];

  // Helper to calculate student balance
  const getStudentBalance = (sId) => {
    const st = students.find((s) => s.id === sId);
    if (!st) return { lockedFee: 0, paid: 0, due: 0, courseName: '', groupName: '', originalFee: 0, discountAmount: 0, discountPercent: 0, admissionFee: 0 };

    const grp = groups.find((g) => g.id === st.groupId);
    const crs = courses.find((c) => c.id === grp?.courseId);

    const originalFee = st.originalFee || crs?.price || 30000;
    const discountAmount = st.discountAmount || 0;
    const discountPercent = st.discountPercent || (discountAmount > 0 ? Math.round((discountAmount / originalFee) * 100) : 0);
    const admissionFee = st.admissionFee || 0;

    const lockedFee = st.lockedCourseFee || (originalFee - discountAmount + admissionFee) || 15000;
    const paid = payments
      .filter((p) => p.studentId === sId)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const due = Math.max(0, lockedFee - paid);

    return {
      lockedFee,
      paid,
      due,
      originalFee,
      discountAmount,
      discountPercent,
      admissionFee,
      courseName: crs?.title || 'Vocational Training',
      groupName: grp?.groupCode || st.groupId || 'Group'
    };
  };

  useEffect(() => {
    if (!open) return;
    setErrorMsg('');
    const today = new Date().toISOString().slice(0, 10);
    const currentMonth = today.slice(0, 7);
    setPaymentDate(today);
    setPaymentMonth(currentMonth);

    if (preselectedStudentId) {
      setStudentId(preselectedStudentId);
      const bal = getStudentBalance(preselectedStudentId);
      // If student has paid 0, suggest 50% installment!
      if (bal.paid === 0) {
        setAmount(Math.round(bal.lockedFee * 0.5));
        setRemarks('1st Installment (50% Admission Fee)');
      } else {
        setAmount(bal.due);
        setRemarks('2nd Installment (Remaining Balance Payment)');
      }
    } else {
      setStudentId('');
      setAmount('');
      setRemarks('');
    }
  }, [open, preselectedStudentId]);

  const handleStudentSelect = (selectedId) => {
    setStudentId(selectedId);
    setErrorMsg('');
    const bal = getStudentBalance(selectedId);
    if (bal.paid === 0) {
      setAmount(Math.round(bal.lockedFee * 0.5));
      setRemarks('1st Installment (50% Admission Fee)');
    } else {
      setAmount(bal.due);
      setRemarks('2nd Installment (Remaining Balance Payment)');
    }
  };

  const selectedBalance = studentId ? getStudentBalance(studentId) : null;
  const currentStudent = students.find((s) => s.id === studentId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!studentId) {
      setErrorMsg('Please select a student.');
      return;
    }
    const payNum = Number(amount);
    if (!payNum || payNum <= 0) {
      setErrorMsg('Please enter a valid payment amount (Amount must be > 0).');
      return;
    }
    if (selectedBalance && payNum > selectedBalance.due) {
      setErrorMsg(`Payment amount cannot exceed remaining due balance (Rs. ${selectedBalance.due.toLocaleString()}).`);
      return;
    }

    // Generate Next Sequential Receipt No: REC-2026-0001
    const yearStr = new Date().getFullYear();
    const existingRecNos = payments
      .map((p) => {
        const match = p.receiptNo && p.receiptNo.match(/REC-\d+-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextRecSeq = existingRecNos.length ? Math.max(...existingRecNos) + 1 : 1;
    const receiptNo = `REC-${yearStr}-${String(nextRecSeq).padStart(4, '0')}`;

    const newPayment = {
      id: `PAY-${Date.now().toString().slice(-6)}`,
      receiptNo,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      tgid: currentStudent.tgid,
      groupId: currentStudent.groupId,
      courseName: selectedBalance.courseName,
      originalFee: selectedBalance.originalFee,
      discountPercent: selectedBalance.discountPercent,
      discountAmount: selectedBalance.discountAmount,
      admissionFee: selectedBalance.admissionFee,
      lockedCourseFee: selectedBalance.lockedFee,
      amount: payNum,
      paymentDate,
      paymentMonth,
      paymentMethod: paymentMethod.split(' (')[0],
      remarks: remarks.trim() || 'Fee Payment',
      receivedBy: currentUser?.name || 'Admin / Cashier',
      createdAt: new Date().toISOString()
    };

    // If fully cleared, celebrate!
    if (selectedBalance.due - payNum <= 0) {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (err) {}
    }

    // Auto WhatsApp payment voucher dispatch
    if (sendWhatsApp && selectedStudent?.phone) {
      const remainingDue = Math.max(0, selectedBalance.due - payNum);
      const text = `🧾 *Official Tuition Fee Payment Voucher*\n` +
        `Global Era Technical School (CTEVT Accredited)\n\n` +
        `Dear *${selectedStudent.name}*,\n` +
        `Your fee payment of *Rs. ${payNum.toLocaleString()}* has been successfully recorded!\n\n` +
        `• *Receipt No:* ${receiptNo}\n` +
        `• *Course:* ${selectedBalance.courseName}\n` +
        `• *Payment Method:* ${paymentMethod.split(' (')[0]}\n` +
        `• *Date:* ${paymentDate}\n` +
        `• *Remaining Due Balance:* Rs. ${remainingDue.toLocaleString()}\n` +
        (remainingDue <= 0 ? `• *Status:* Fee Fully Cleared 🎉\n` : `• *Status:* Partially Paid\n`) +
        `• *Received By:* ${currentUser?.name || 'Accounts Office'}\n\n` +
        `Thank you for training with Global Era Technical School!`;

      sendMetaWhatsAppMessage({
        to: selectedStudent.phone,
        type: 'text',
        text: text
      }).catch((e) => console.warn('Payment WhatsApp notice failed:', e));
    }

    onSavePayment(newPayment);
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
          background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
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
            <PointOfSaleIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2 }}>
              Collect Student Fee & Issue Receipt
            </Typography>
            <Typography variant="caption" sx={{ color: '#A7F3D0', fontWeight: 500 }}>
              Record installment payment and issue printable receipt
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#A7F3D0', '&:hover': { color: '#FFF' } }}>
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

          {/* Student Selector */}
          <TextField
            select
            fullWidth
            required
            label="Select Student"
            value={studentId}
            onChange={(e) => handleStudentSelect(e.target.value)}
            sx={{ mb: 2.5 }}
          >
            <MenuItem value="">
              <em>-- Select Student --</em>
            </MenuItem>
            {students.map((st) => {
              const b = getStudentBalance(st.id);
              return (
                <MenuItem key={st.id} value={st.id} disabled={b.due <= 0}>
                  {st.name} ({st.tgid}) — Remaining Due: Rs. {b.due.toLocaleString()} {b.due <= 0 ? '(Cleared)' : ''}
                </MenuItem>
              );
            })}
          </TextField>

          {/* Live Student Account Balance Card */}
          {selectedBalance && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2.5,
                bgcolor: '#ECFDF5',
                border: '1.5px solid #A7F3D0'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#065F46' }}>
                  {currentStudent?.name} ({currentStudent?.tgid})
                </Typography>
                <Chip
                  label={selectedBalance.due === 0 ? 'Cleared (Paid)' : `Remaining Due: Rs. ${selectedBalance.due.toLocaleString()}`}
                  size="small"
                  color={selectedBalance.due === 0 ? 'success' : 'warning'}
                  sx={{ fontWeight: 800, fontSize: '0.75rem' }}
                />
              </Box>

              <Grid container spacing={1} sx={{ fontSize: '0.85rem' }}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>Course:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#064E3B' }}>{selectedBalance.courseName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>Locked Total Fee:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#064E3B' }}>Rs. {selectedBalance.lockedFee.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>Total Paid So Far:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#10B981' }}>Rs. {selectedBalance.paid.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>Remaining Due:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900, color: '#DC2626' }}>Rs. {selectedBalance.due.toLocaleString()}</Typography>
                </Grid>
              </Grid>

              {/* Quick Installment Buttons */}
              {selectedBalance.due > 0 && (
                <Box sx={{ mt: 1.5, pt: 1.2, borderTop: '1px dashed #A7F3D0', display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setAmount(Math.round(selectedBalance.lockedFee * 0.5))}
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderColor: '#10B981',
                      color: '#047857',
                      bgcolor: '#FFFFFF'
                    }}
                  >
                    50% Installment (Rs. {Math.round(selectedBalance.lockedFee * 0.5).toLocaleString()})
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setAmount(selectedBalance.due)}
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderColor: '#059669',
                      color: '#065F46',
                      bgcolor: '#FFFFFF'
                    }}
                  >
                    Full Remaining (Rs. {selectedBalance.due.toLocaleString()})
                  </Button>
                </Box>
              )}
            </Paper>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Payment Amount (Rs.)"
                placeholder="e.g. 6000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MonetizationOnIcon sx={{ color: '#059669' }} />
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
                {PAYMENT_METHODS.map((pm) => (
                  <MenuItem key={pm} value={pm}>
                    {pm}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Payment Date"
                InputLabelProps={{ shrink: true }}
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="month"
                label="Accounting Month"
                InputLabelProps={{ shrink: true }}
                value={paymentMonth}
                onChange={(e) => setPaymentMonth(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                placeholder="e.g. 1st installment 50% admission fee paid..."
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

            <Grid item xs={12}>
              <Box sx={{ p: 1.5, bgcolor: '#F0FDF4', borderRadius: 2.5, border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <FormControlLabel
                  control={<Checkbox checked={sendWhatsApp} onChange={(e) => setSendWhatsApp(e.target.checked)} color="success" />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#166534' }}>
                        Dispatch Official Receipt Voucher to Trainee WhatsApp
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#15803D' }}>
                        Sends official receipt with remaining balance to trainee mobile
                      </Typography>
                    </Box>
                  }
                />
                <Chip icon={<WhatsAppIcon sx={{ color: '#25D366 !important' }} />} label="Live 1-Click" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800 }} />
              </Box>
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
            disabled={!studentId || !amount || Number(amount) <= 0}
            startIcon={<PointOfSaleIcon />}
            sx={{
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              fontWeight: 800,
              px: 3.5,
              py: 1,
              borderRadius: 2.5,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            Record & Generate Receipt
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
